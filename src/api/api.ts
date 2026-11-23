import axios, {
  type AxiosAdapter,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { adminKeys } from "@/features/admin-auth/query-keys";
import { authKeys } from "@/features/auth/query-keys";
import { logger } from "@/lib/logger";
import { queryClient } from "@/lib/query-client";
import { type AccessTokenStore, accessTokenStore, tokensSchema } from "./access-token";
import { endpoints } from "./endpoints";
import { ApiError, apiErrorFromResponse, isApiError, NetworkError, ParseError } from "./errors";
import { createIdempotencyKey } from "./idempotency";
import { parseResponse } from "./parse";

// Same origin by design: Cloudflare (staging/prod) and the Vite dev proxy forward /v1 to the API.
// The browser never sends X-Staging-Key; the proxy adds it.
export const API_BASE_URL = "/v1";

declare module "axios" {
  interface AxiosRequestConfig {
    /** Created when the user acts; required on every POST and DELETE (see idempotency.ts). */
    idempotencyKey?: string;
    // Opt out of the login redirect below. For optional session probes on public
    // pages, where a 401 is the normal anonymous case rather than a lost session.
    _skipAuthRedirect?: boolean;
  }
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
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

const SAFE_METHODS = new Set(["get", "head", "options"]);

function addIdempotencyKey(config: InternalAxiosRequestConfig) {
  const method = config.method?.toLowerCase() ?? "get";
  if (SAFE_METHODS.has(method) || config.headers.has("Idempotency-Key")) {
    return config;
  }
  if (!config.idempotencyKey) {
    logger.warn(
      `${method.toUpperCase()} ${config.url} has no idempotencyKey; generated one. Create it when the user acts.`,
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
  /** 401s from these are final (e.g. auth.invalid_credentials on login), never refreshed. A trailing "/" matches a prefix. */
  authEndpoints: readonly string[];
  onAuthFailure: (error: unknown) => void;
  /** Bearer token kept in memory. Without it the client relies on cookies only (admin). */
  accessToken?: AccessTokenStore;
}

const REFRESH_LOCK = "pnl-auth-refresh";

// Refresh tokens rotate, so two tabs refreshing at once would invalidate each other.
function withRefreshLock<T>(fn: () => Promise<T>): Promise<T> {
  return typeof navigator !== "undefined" && "locks" in navigator
    ? navigator.locks.request(REFRESH_LOCK, fn)
    : fn();
}

function attachAuthRefresh(
  api: AxiosInstance,
  { refreshEndpoint, authEndpoints, onAuthFailure, accessToken }: AuthRefreshOptions,
) {
  const noRefresh = [refreshEndpoint, ...authEndpoints].map(stripSlash);

  function skipsRefresh(url: string | undefined) {
    const path = stripSlash(url);
    return noRefresh.some((entry) =>
      entry?.endsWith("/") ? path?.startsWith(entry) : entry === path,
    );
  }

  async function postRefresh() {
    const res = await api.post(refreshEndpoint, undefined, {
      idempotencyKey: createIdempotencyKey(),
    });
    if (accessToken) accessToken.set(parseResponse(tokensSchema, res.data, refreshEndpoint));
  }

  async function refreshOnce() {
    try {
      await postRefresh();
    } catch (error) {
      // Another tab/request rotated the token first; the cookie is current now, so try once more.
      if (isApiError(error) && error.code === "auth.refresh_superseded") return postRefresh();
      throw error;
    }
  }

  let refreshing: Promise<void> | undefined;
  // Any waiter that didn't opt out of the login redirect still needs it, even if the one that
  // started the refresh did.
  let wantsRedirect = false;

  async function runRefresh() {
    try {
      await (accessToken ? withRefreshLock(refreshOnce) : refreshOnce());
    } catch (refreshError) {
      const apiError = toApiError(refreshError);
      // Only a rejected refresh means the session is gone. A dropped connection or a 429 must
      // not log the user out.
      const sessionGone = isApiError(apiError) && apiError.status < 500 && apiError.status !== 429;
      if (sessionGone) {
        accessToken?.clear();
        if (wantsRedirect) onAuthFailure(apiError);
      }
      throw apiError;
    }
  }

  /** One refresh at a time: concurrent callers share it. */
  function refresh(skipAuthRedirect?: boolean) {
    if (!skipAuthRedirect) wantsRedirect = true;
    refreshing ??= runRefresh().finally(() => {
      refreshing = undefined;
      wantsRedirect = false;
    });
    return refreshing;
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
        skipsRefresh(originalRequest.url)
      ) {
        return Promise.reject(toApiError(error));
      }

      originalRequest._retry = true;
      await refresh(originalRequest._skipAuthRedirect);
      return api(originalRequest);
    },
  );

  return refresh;
}

interface ApiClientOptions extends AuthRefreshOptions {
  /** Test seam: swap the network layer. */
  adapter?: AxiosAdapter;
  /** Sent on every request, e.g. the shop transport's X-PNL-CSRF. */
  headers?: Record<string, string>;
}

export type ApiClient = AxiosInstance & {
  /** Single-flight refresh; rejects with the API error. For the cold-start session probe. */
  refreshSession(): Promise<void>;
};

export function createApiClient({ adapter, headers, ...authOptions }: ApiClientOptions): ApiClient {
  const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...headers,
    },
    adapter,
  });

  api.interceptors.request.use(addIdempotencyKey);
  const { accessToken } = authOptions;
  if (accessToken) {
    api.interceptors.request.use((config) => {
      const current = accessToken.get();
      if (current) config.headers.set("Authorization", `Bearer ${current.token}`);
      return config;
    });
  }
  const refresh = attachAuthRefresh(api, authOptions);
  return Object.assign(api, { refreshSession: () => refresh(true) });
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
  authEndpoints: [endpoints.auth.prefix],
  accessToken: accessTokenStore,
  headers: { "X-PNL-CSRF": "1" },
  onAuthFailure() {
    queryClient.removeQueries({ queryKey: authKeys.all });
    void redirectToLogin("/login");
  },
});

export function refreshSession() {
  return api.refreshSession();
}

export const adminApi = createApiClient({
  refreshEndpoint: endpoints.admin.auth.refresh,
  authEndpoints: [endpoints.admin.auth.login],
  onAuthFailure() {
    queryClient.removeQueries({ queryKey: adminKeys.all });
    void redirectToLogin("/admin/login");
  },
});
