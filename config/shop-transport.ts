import { loadEnv, type Plugin, type ProxyOptions } from "vite-plus";

export const DEFAULT_API_PROXY_TARGET = "https://api-staging.pnlinternationalltd.com";

// The API only lets browsers call /v1/auth/* from the shop address (same-origin Origin + X-PNL-CSRF)
// and keeps the refresh token in an httpOnly cookie. localhost is neither, and the API host
// refuses any POST carrying a localhost Origin. So in dev/preview this middleware plays the shop:
// it checks the CSRF header, calls the API as an "app" (no Origin, tokens in JSON bodies) and moves
// the tokens in and out of httpOnly localhost cookies, so the SPA never sees them.
export const REFRESH_COOKIE = "pnl_dev_rt";
export const RESET_COOKIE = "pnl_dev_reset";
const RESET_COOKIE_MAX_AGE = 600;
const COOKIE_PATH = "/v1/auth";
const AUTH_PREFIX = "/v1/auth/";

type Headers_ = Record<string, string | string[] | undefined>;

export interface LocalResponse {
  status: number;
  body?: string;
  headers?: Record<string, string>;
  setCookies?: string[];
}

export function errorResponse(status: number, code: string, message: string): LocalResponse {
  return {
    status,
    body: JSON.stringify({ error: { code, message, request_id: "local-dev" } }),
    headers: { "Content-Type": "application/json" },
  };
}

/** "refresh", "password/reset/verify", ...; undefined when the request isn't an auth POST. */
export function matchAuthRoute(method: string | undefined, url: string | undefined) {
  if (method?.toUpperCase() !== "POST" || !url) return undefined;
  const path = url.split("?")[0] ?? "";
  if (!path.startsWith(AUTH_PREFIX)) return undefined;
  return path.slice(AUTH_PREFIX.length).replace(/\/+$/, "");
}

export function readCookie(header: string | undefined, name: string) {
  for (const part of header?.split(";") ?? []) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

export function serializeCookie(name: string, value: string, maxAge?: number) {
  const age = maxAge === undefined ? "" : `; Max-Age=${maxAge}`;
  return `${name}=${encodeURIComponent(value)}; Path=${COOKIE_PATH}; HttpOnly; SameSite=Strict${age}`;
}

export function clearCookie(name: string) {
  return serializeCookie(name, "", 0);
}

function firstHeader(headers: Headers_, name: string) {
  const value = headers[name];
  return Array.isArray(value) ? value[0] : value;
}

export function isBrowserOnlyHeader(name: string) {
  const lower = name.toLowerCase();
  return lower === "origin" || lower.startsWith("sec-fetch-");
}

/** Headers forwarded upstream: no browser identity (Origin, Sec-Fetch-*, Cookie) and no hop-by-hop. */
export function toUpstreamHeaders(headers: Headers_, stagingKey: string | undefined) {
  const dropped = new Set([
    "host",
    "cookie",
    "connection",
    "keep-alive",
    "transfer-encoding",
    "content-length",
    "accept-encoding",
  ]);
  const out: Record<string, string> = {};
  for (const [name, value] of Object.entries(headers)) {
    if (value === undefined || dropped.has(name) || isBrowserOnlyHeader(name)) continue;
    out[name] = Array.isArray(value) ? value.join(", ") : value;
  }
  if (stagingKey) out["X-Staging-Key"] = stagingKey;
  return out;
}

function parseObject(text: string): Record<string, unknown> | undefined {
  if (!text) return {};
  try {
    const value: unknown = JSON.parse(text);
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Puts the httpOnly cookie tokens into the request body the API expects from apps.
 * Returns a local response when the request can be answered without calling the API.
 */
export function injectCookieTokens(
  route: string,
  bodyText: string,
  cookieHeader: string | undefined,
): { body: string } | { local: LocalResponse } {
  if (route === "refresh" || route === "logout") {
    const refreshToken = readCookie(cookieHeader, REFRESH_COOKIE);
    if (!refreshToken) {
      return {
        local:
          route === "refresh"
            ? errorResponse(401, "auth.refresh_invalid", "No refresh cookie (dev shop transport).")
            : { status: 204, setCookies: [clearCookie(REFRESH_COOKIE)] },
      };
    }
    return { body: JSON.stringify({ ...parseObject(bodyText), refresh_token: refreshToken }) };
  }
  if (route === "password/reset/complete") {
    const resetToken = readCookie(cookieHeader, RESET_COOKIE);
    const parsed = parseObject(bodyText);
    if (!resetToken || !parsed) return { body: bodyText };
    return { body: JSON.stringify({ ...parsed, reset_token: resetToken }) };
  }
  return { body: bodyText };
}

/** Moves tokens from the response body into cookies and clears cookies that are used up. */
export function extractCookieTokens(route: string, status: number, bodyText: string) {
  const setCookies: string[] = [];
  const ok = status >= 200 && status < 300;
  let body = bodyText;

  const parsed = parseObject(bodyText);
  if (parsed && bodyText) {
    let changed = false;
    if (typeof parsed.refresh_token === "string") {
      setCookies.push(serializeCookie(REFRESH_COOKIE, parsed.refresh_token));
      delete parsed.refresh_token;
      changed = true;
    }
    if (route === "password/reset/verify" && typeof parsed.reset_token === "string") {
      setCookies.push(serializeCookie(RESET_COOKIE, parsed.reset_token, RESET_COOKIE_MAX_AGE));
      delete parsed.reset_token;
      changed = true;
    }
    if (changed) body = JSON.stringify(parsed);
  }

  if ((route === "logout" && ok) || (route === "refresh" && status === 401)) {
    setCookies.push(clearCookie(REFRESH_COOKIE));
  }
  if (route === "password/reset/complete" && ok) {
    setCookies.push(clearCookie(RESET_COOKIE));
  }
  return { body, setCookies };
}

const PASSTHROUGH_HEADERS = ["content-type", "retry-after", "x-request-id"];

interface ShopRequest {
  route: string;
  headers: Headers_;
  body: string;
}

interface ShopDeps {
  target: string;
  stagingKey: string | undefined;
  fetchImpl?: typeof fetch;
}

/** Framework-free core: one auth POST in, one response out. */
export async function handleShopRequest(
  { route, headers, body }: ShopRequest,
  { target, stagingKey, fetchImpl = fetch }: ShopDeps,
): Promise<LocalResponse> {
  if (firstHeader(headers, "x-pnl-csrf") !== "1") {
    return errorResponse(403, "auth.origin_refused", "Missing X-PNL-CSRF: 1 (dev shop transport).");
  }

  const injected = injectCookieTokens(route, body, firstHeader(headers, "cookie"));
  if ("local" in injected) return injected.local;

  const hasBody = injected.body !== "";
  let upstream: Response;
  try {
    upstream = await fetchImpl(`${target}/v1/auth/${route}`, {
      method: "POST",
      headers: {
        ...(hasBody ? { "content-type": "application/json" } : {}),
        ...toUpstreamHeaders(headers, stagingKey),
      },
      body: hasBody ? injected.body : undefined,
    });
  } catch {
    return errorResponse(502, "dev.upstream_unreachable", `Could not reach ${target}.`);
  }

  const text = await upstream.text();
  const { body: outBody, setCookies } = extractCookieTokens(route, upstream.status, text);
  const outHeaders: Record<string, string> = {};
  for (const name of PASSTHROUGH_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) outHeaders[name] = value;
  }
  return { status: upstream.status, body: outBody || undefined, headers: outHeaders, setCookies };
}

// Structural types: the project has no @types/node.
interface NodeRequest extends AsyncIterable<Uint8Array> {
  method?: string;
  url?: string;
  headers: Headers_;
}

interface NodeResponse {
  statusCode: number;
  setHeader(name: string, value: string | string[]): void;
  end(body?: string): void;
}

async function readBody(req: AsyncIterable<Uint8Array>) {
  const decoder = new TextDecoder();
  let text = "";
  for await (const chunk of req) text += decoder.decode(chunk, { stream: true });
  return text + decoder.decode();
}

export function createShopTransportMiddleware(deps: ShopDeps) {
  return async function shopTransport(req: NodeRequest, res: NodeResponse, next: () => void) {
    const route = matchAuthRoute(req.method, req.url);
    if (route === undefined) return next();

    let out: LocalResponse;
    try {
      out = await handleShopRequest(
        { route, headers: req.headers, body: await readBody(req) },
        deps,
      );
    } catch (error) {
      console.error("[shop-transport]", error);
      out = errorResponse(502, "dev.shop_transport_failed", "The dev shop transport failed.");
    }
    res.statusCode = out.status;
    for (const [name, value] of Object.entries(out.headers ?? {})) res.setHeader(name, value);
    if (out.setCookies?.length) res.setHeader("Set-Cookie", out.setCookies);
    res.end(out.body);
  };
}

type HttpProxy = Parameters<NonNullable<ProxyOptions["configure"]>>[0];

// Without @types/node, http-proxy's EventEmitter methods are not visible to tsc.
interface ProxyEvents {
  on(event: "proxyReq", listener: (proxyReq: ProxyRequestLike) => void): unknown;
}

interface ProxyRequestLike {
  getHeaderNames(): string[];
  removeHeader(name: string): void;
}

/** Generic /v1 proxy: strip the browser identity so the API host doesn't refuse localhost POST/DELETE. */
export function stripBrowserHeaders(proxy: HttpProxy) {
  (proxy as unknown as ProxyEvents).on("proxyReq", (proxyReq) => {
    for (const name of proxyReq.getHeaderNames()) {
      if (isBrowserOnlyHeader(name)) proxyReq.removeHeader(name);
    }
  });
}

export function shopTransport(): Plugin {
  let mode = "development";
  let target = DEFAULT_API_PROXY_TARGET;
  let stagingKey: string | undefined;

  function register(server: { middlewares: { use(handler: never): unknown } }) {
    if (mode === "test") return;
    server.middlewares.use(createShopTransportMiddleware({ target, stagingKey }) as never);
  }

  return {
    name: "shop-transport",
    config(_, env) {
      mode = env.mode;
      const vars = loadEnv(env.mode, ".", "");
      target = vars.API_PROXY_TARGET || DEFAULT_API_PROXY_TARGET;
      stagingKey = vars.STAGING_KEY;
    },
    configureServer: register,
    configurePreviewServer: register,
  };
}
