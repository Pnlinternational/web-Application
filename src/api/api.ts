import axios, {
  type AxiosAdapter,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { adminKeys } from "@/features/admin-auth/query-keys";
import { authKeys } from "@/features/auth/query-keys";
import { logger } from "@/lib/logger";
import { queryClient } from "@/lib/query-client";
import { endpoints } from "./endpoints";
import { ApiError, apiErrorFromResponse, isApiError, NetworkError, ParseError } from "./errors";
import { createIdempotencyKey } from "./idempotency";

// Same origin by design: Cloudflare (staging/prod) and the Vite dev proxy forward /v1 to the API.
// The browser never sends X-Staging-Key; the proxy adds it.
export const API_BASE_URL = "/v1";

declare module "axios" {
  interface AxiosRequestConfig {
    /** Created when the user acts; required on every POST (see idempotency.ts). */
    idempotencyKey?: string;
    // Opt out of the login redirect below. For optional session probes on public
    // pages, where a 401 is the normal anonymous case rather than a lost session.
    _skipAuthRedirect?: boolean;
  }
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface QueuedRequest {
  resolve: () => void;
  reject: (reason: unknown) => void;
  skipAuthRedirect?: boolean;
}

export function toApiError(error: unknown): unknown {
  if (error instanceof ApiError || error instanceof NetworkError || error instanceof ParseError) {
    return error;
  }
  if (axios.isCancel(error) || !axios.isAxiosError(error)) {
    return error;
  }
  if (!error.response) {
    return new NetworkError(error);
  }
  const { status, statusText, data } = error.response;
  return apiErrorFromResponse({ status, statusText, data });
}

function addIdempotencyKey(config: InternalAxiosRequestConfig) {
  if (config.method?.toLowerCase() !== "post" || config.headers.has("Idempotency-Key")) {
    return config;
  }
  if (!config.idempotencyKey) {
    logger.warn(
      `POST ${config.url} has no idempotencyKey; generated one. Create it when the user acts.`,
    );
  }
  config.headers.set("Idempotency-Key", config.idempotencyKey ?? createIdempotencyKey());
  return config;
}

function stripSlash(url: string | undefined) {
  return url?.replace(/^\//, "");
}

interface AuthRefreshOptions {
  refreshEndpoint: string;
  /** 401s from these are final (e.g. auth.invalid_credentials on login), never refreshed. */
  authEndpoints: readonly string[];
  onAuthFailure: (error: unknown) => void;
}

function attachAuthRefresh(
  api: AxiosInstance,
  { refreshEndpoint, authEndpoints, onAuthFailure }: AuthRefreshOptions,
) {
  const noRefresh = new Set([refreshEndpoint, ...authEndpoints].map(stripSlash));
  let isRefreshing = false;
  let failedQueue: QueuedRequest[] = [];

  function processQueue(error: unknown) {
    for (const prom of failedQueue) {
      if (error) prom.reject(error);
      else prom.resolve();
    }
    failedQueue = [];
  }

  api.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      const originalRequest = axios.isAxiosError(error)
        ? (error.config as RetryableRequestConfig | undefined)
        : undefined;

      if (
        !axios.isAxiosError(error) ||
        error.response?.status !== 401 ||
        !originalRequest ||
        originalRequest._retry ||
        noRefresh.has(stripSlash(originalRequest.url))
      ) {
        return Promise.reject(toApiError(error));
      }

      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise<void>((resolve, reject) => {
          failedQueue.push({
            resolve,
            reject,
            skipAuthRedirect: originalRequest._skipAuthRedirect,
          });
        }).then(() => api(originalRequest));
      }

      isRefreshing = true;

      try {
        await api.post(refreshEndpoint, undefined, { idempotencyKey: createIdempotencyKey() });
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        const apiError = toApiError(refreshError);
        // Only a rejected refresh means the session is gone. A dropped connection on a weak
        // network must not log the user out.
        const sessionGone = isApiError(apiError) && apiError.status < 500;
        // Read before processQueue empties the array: any queued request that
        // didn't opt out of the redirect still needs it, even if the request
        // that triggered this refresh did.
        const shouldRedirect =
          !originalRequest._skipAuthRedirect || failedQueue.some((prom) => !prom.skipAuthRedirect);
        processQueue(apiError);
        if (sessionGone && shouldRedirect) {
          onAuthFailure(apiError);
        }
        return Promise.reject(apiError);
      } finally {
        isRefreshing = false;
      }
    },
  );
}

interface ApiClientOptions extends AuthRefreshOptions {
  /** Test seam: swap the network layer. */
  adapter?: AxiosAdapter;
}

export function createApiClient({ adapter, ...authOptions }: ApiClientOptions): AxiosInstance {
  const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    adapter,
  });

  api.interceptors.request.use(addIdempotencyKey);
  attachAuthRefresh(api, authOptions);
  return api;
}

async function redirectToLogin(to: "/login" | "/admin/login") {
  // Lazy import breaks the api -> router -> routeTree -> pages -> api cycle.
  const { router } = await import("@/router");
  const { pathname, href } = router.state.location;
  if (pathname === to) return;
  void router.navigate({ to, search: { redirect: href } });
}

export const api = createApiClient({
  refreshEndpoint: endpoints.auth.refresh,
  authEndpoints: [endpoints.auth.login, endpoints.auth.register],
  onAuthFailure() {
    queryClient.removeQueries({ queryKey: authKeys.all });
    void redirectToLogin("/login");
  },
});

export const adminApi = createApiClient({
  refreshEndpoint: endpoints.admin.auth.refresh,
  authEndpoints: [endpoints.admin.auth.login],
  onAuthFailure() {
    queryClient.removeQueries({ queryKey: adminKeys.all });
    void redirectToLogin("/admin/login");
  },
});
