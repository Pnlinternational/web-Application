// @vitest-environment node
import { describe, expect, it, vi } from "vite-plus/test";
import {
  handleShopRequest,
  matchAuthRoute,
  readCookie,
  RESET_COOKIE,
  REFRESH_COOKIE,
} from "./shop-transport";

const TARGET = "https://api.test";
const FAKE_KEY = "fake-staging-key";

function upstream(status: number, body?: unknown, headers: Record<string, string> = {}) {
  const text = body === undefined ? null : JSON.stringify(body);
  return new Response(text, {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

// Records what the transport sends upstream and answers with `response`.
function fakeFetch(response: () => Response = () => upstream(204)) {
  return vi.fn<typeof fetch>(async () => response());
}

function sentInit(fetchImpl: ReturnType<typeof fakeFetch>) {
  const init = fetchImpl.mock.calls[0]?.[1];
  return {
    url: fetchImpl.mock.calls[0]?.[0],
    headers: (init?.headers ?? {}) as Record<string, string>,
    body: typeof init?.body === "string" ? (JSON.parse(init.body) as unknown) : undefined,
  };
}

function send(
  route: string,
  fetchImpl: ReturnType<typeof fakeFetch>,
  { headers = {}, body = "" }: { headers?: Record<string, string>; body?: string } = {},
) {
  return handleShopRequest(
    { route, headers: { "x-pnl-csrf": "1", ...headers }, body },
    { target: TARGET, stagingKey: FAKE_KEY, fetchImpl },
  );
}

const tokens = {
  access_token: "at-1",
  access_expires_in: 900,
  access_expires_at: "2026-01-01T00:15:00Z",
  session_expires_at: "2026-02-01T00:00:00Z",
};

describe("matchAuthRoute", () => {
  it("returns the auth route of a POST, without query or trailing slash", () => {
    expect(matchAuthRoute("post", "/v1/auth/password/reset/verify/?x=1")).toBe(
      "password/reset/verify",
    );
  });

  it.each([
    ["GET", "/v1/auth/refresh"],
    ["POST", "/v1/me/sessions"],
  ])("ignores %s %s", (method, url) => {
    expect(matchAuthRoute(method, url)).toBeUndefined();
  });
});

describe("readCookie", () => {
  it("reads and decodes one cookie from the header", () => {
    expect(readCookie(`a=1; ${REFRESH_COOKIE}=rt%3D%3D; b=2`, REFRESH_COOKIE)).toBe("rt==");
  });
});

describe("CSRF check", () => {
  it("refuses an auth POST without X-PNL-CSRF like the real shop", async () => {
    const fetchImpl = fakeFetch();

    const res = await handleShopRequest(
      { route: "login", headers: {}, body: "{}" },
      { target: TARGET, stagingKey: FAKE_KEY, fetchImpl },
    );

    expect(res.status).toBe(403);
    expect(JSON.parse(res.body ?? "")).toMatchObject({ error: { code: "auth.origin_refused" } });
  });

  it("does not call the API when the CSRF header is missing", async () => {
    const fetchImpl = fakeFetch();
    await handleShopRequest(
      { route: "login", headers: {}, body: "{}" },
      { target: TARGET, stagingKey: FAKE_KEY, fetchImpl },
    );
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe("upstream request", () => {
  const browserHeaders = {
    origin: "http://localhost:5173",
    "sec-fetch-site": "same-origin",
    "sec-fetch-mode": "cors",
    cookie: "other=1",
    host: "localhost:5173",
    "idempotency-key": "key-from-tap-0001",
    authorization: "Bearer at-0",
  };

  it("posts to the same auth route on the target", async () => {
    const fetchImpl = fakeFetch(() => upstream(202, {}));
    await send("login", fetchImpl, { body: "{}" });
    expect(sentInit(fetchImpl).url).toBe(`${TARGET}/v1/auth/login`);
  });

  it("drops the browser identity and hop-by-hop headers", async () => {
    const fetchImpl = fakeFetch(() => upstream(202, {}));

    await send("login", fetchImpl, { headers: browserHeaders, body: "{}" });

    const names = Object.keys(sentInit(fetchImpl).headers).map((name) => name.toLowerCase());
    expect(names.filter((name) => ["origin", "cookie", "host"].includes(name))).toEqual([]);
    expect(names.filter((name) => name.startsWith("sec-fetch-"))).toEqual([]);
  });

  it("keeps the idempotency key and bearer and adds the staging key", async () => {
    const fetchImpl = fakeFetch(() => upstream(202, {}));

    await send("login", fetchImpl, { headers: browserHeaders, body: "{}" });

    expect(sentInit(fetchImpl).headers).toMatchObject({
      "idempotency-key": "key-from-tap-0001",
      authorization: "Bearer at-0",
      "X-Staging-Key": FAKE_KEY,
    });
  });

  it("answers 502 when the API can't be reached", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      throw new TypeError("fetch failed");
    });
    const res = await send("login", fetchImpl, { body: "{}" });
    expect(res.status).toBe(502);
  });
});

describe("refresh token cookie", () => {
  it("removes the refresh token from the response body", async () => {
    const fetchImpl = fakeFetch(() => upstream(200, { ...tokens, refresh_token: "rt-1" }));

    const res = await send("login", fetchImpl, { body: "{}" });

    expect(JSON.parse(res.body ?? "")).toEqual(tokens);
  });

  it("keeps it in an httpOnly, strict, auth-path-only cookie", async () => {
    const fetchImpl = fakeFetch(() => upstream(200, { ...tokens, refresh_token: "rt-1" }));

    const res = await send("login/verify", fetchImpl, { body: "{}" });

    expect(res.setCookies).toEqual([
      `${REFRESH_COOKIE}=rt-1; Path=/v1/auth; HttpOnly; SameSite=Strict`,
    ]);
  });

  it.each(["refresh", "logout"])("sends the cookie as {refresh_token} to %s", async (route) => {
    const fetchImpl = fakeFetch(() => upstream(204));

    await send(route, fetchImpl, { headers: { cookie: `${REFRESH_COOKIE}=rt-1` } });

    expect(sentInit(fetchImpl).body).toEqual({ refresh_token: "rt-1" });
  });

  it("answers a refresh without the cookie locally with 401 auth.refresh_invalid", async () => {
    const fetchImpl = fakeFetch();

    const res = await send("refresh", fetchImpl);

    expect(res.status).toBe(401);
    expect(JSON.parse(res.body ?? "")).toMatchObject({ error: { code: "auth.refresh_invalid" } });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("answers a logout without the cookie locally with 204", async () => {
    const fetchImpl = fakeFetch();

    const res = await send("logout", fetchImpl);

    expect(res.status).toBe(204);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("clears the cookie after a successful logout", async () => {
    const fetchImpl = fakeFetch(() => upstream(204));

    const res = await send("logout", fetchImpl, { headers: { cookie: `${REFRESH_COOKIE}=rt-1` } });

    expect(res.setCookies).toContain(
      `${REFRESH_COOKIE}=; Path=/v1/auth; HttpOnly; SameSite=Strict; Max-Age=0`,
    );
  });

  it("clears the cookie when the API rejects the refresh", async () => {
    const fetchImpl = fakeFetch(() =>
      upstream(401, { error: { code: "auth.refresh_invalid", message: "no", request_id: "r" } }),
    );

    const res = await send("refresh", fetchImpl, { headers: { cookie: `${REFRESH_COOKIE}=rt-1` } });

    expect(res.setCookies).toContain(
      `${REFRESH_COOKIE}=; Path=/v1/auth; HttpOnly; SameSite=Strict; Max-Age=0`,
    );
  });
});

describe("reset token cookie", () => {
  it("moves the reset token from the verify response into a 10-minute cookie", async () => {
    const fetchImpl = fakeFetch(() =>
      upstream(200, { next: "set_password", reset_token: "reset-1" }),
    );

    const res = await send("password/reset/verify", fetchImpl, { body: "{}" });

    expect(JSON.parse(res.body ?? "")).toEqual({ next: "set_password" });
    expect(res.setCookies).toEqual([
      `${RESET_COOKIE}=reset-1; Path=/v1/auth; HttpOnly; SameSite=Strict; Max-Age=600`,
    ]);
  });

  it("sends the cookie as reset_token with the new password", async () => {
    const fetchImpl = fakeFetch(() => upstream(204));

    await send("password/reset/complete", fetchImpl, {
      headers: { cookie: `${RESET_COOKIE}=reset-1` },
      body: JSON.stringify({ client_key: "ck", password: "new-password" }),
    });

    expect(sentInit(fetchImpl).body).toEqual({
      client_key: "ck",
      password: "new-password",
      reset_token: "reset-1",
    });
  });

  it("clears the cookie once the reset is complete", async () => {
    const fetchImpl = fakeFetch(() => upstream(204));

    const res = await send("password/reset/complete", fetchImpl, {
      headers: { cookie: `${RESET_COOKIE}=reset-1` },
      body: "{}",
    });

    expect(res.setCookies).toEqual([
      `${RESET_COOKIE}=; Path=/v1/auth; HttpOnly; SameSite=Strict; Max-Age=0`,
    ]);
  });
});

describe("response passthrough", () => {
  it("passes the status, Retry-After and X-Request-Id through", async () => {
    const fetchImpl = fakeFetch(() =>
      upstream(
        429,
        { error: { code: "rate_limited", message: "slow down", request_id: "req-9" } },
        { "retry-after": "30", "x-request-id": "req-9" },
      ),
    );

    const res = await send("login", fetchImpl, { body: "{}" });

    expect(res.status).toBe(429);
    expect(res.headers).toMatchObject({ "retry-after": "30", "x-request-id": "req-9" });
  });
});
