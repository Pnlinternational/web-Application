import type { InternalAxiosRequestConfig } from "axios";
import { AxiosError, CanceledError } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { createFakeAdapter, errorBody, type Reply, requestsTo } from "@/test/fake-api";
import { type AccessTokenStore, createAccessTokenStore, type Tokens } from "./access-token";
import { createApiClient } from "./api";
import { ApiError, NetworkError } from "./errors";

type ClientOptions = Partial<Omit<Parameters<typeof createApiClient>[0], "adapter">>;

function setup(routes: Record<string, Reply[]>, options: ClientOptions = {}) {
  const { adapter, sent } = createFakeAdapter(routes);
  const onAuthFailure = vi.fn();
  const api = createApiClient({
    refreshEndpoint: "auth/refresh",
    authEndpoints: ["auth/login"],
    onAuthFailure,
    adapter,
    ...options,
  });
  return { api, sent, onAuthFailure };
}

function tokens(accessToken: string): Tokens {
  return {
    access_token: accessToken,
    access_expires_in: 900,
    access_expires_at: "2026-01-01T00:15:00Z",
    session_expires_at: "2026-02-01T00:00:00Z",
  };
}

// The customer client: bearer from an in-memory store, shop CSRF header, any auth/ path is final.
function setupCustomer(routes: Record<string, Reply[]>, store: AccessTokenStore) {
  return setup(routes, {
    authEndpoints: ["auth/"],
    accessToken: store,
    headers: { "X-PNL-CSRF": "1" },
  });
}

function signedInStore(accessToken = "at-old") {
  const store = createAccessTokenStore();
  store.set(tokens(accessToken));
  return store;
}

function authorization(config: InternalAxiosRequestConfig | undefined) {
  return config?.headers.get("Authorization");
}

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("idempotency", () => {
  it("sends the caller's Idempotency-Key on POST", async () => {
    const { api, sent } = setup({ orders: [{ status: 201 }] });
    await api.post("orders", {}, { idempotencyKey: "key-from-tap-0001" });
    expect(sent[0]?.headers.get("Idempotency-Key")).toBe("key-from-tap-0001");
  });

  it("falls back to a generated key of 16+ characters", async () => {
    const { api, sent } = setup({ orders: [{ status: 201 }] });
    await api.post("orders", {});
    expect(String(sent[0]?.headers.get("Idempotency-Key")).length).toBeGreaterThanOrEqual(16);
  });

  it("does not add a key to GET requests", async () => {
    const { api, sent } = setup({ products: [{ status: 200, data: [] }] });
    await api.get("products");
    expect(sent[0]?.headers.has("Idempotency-Key")).toBe(false);
  });
});

describe("refresh on 401", () => {
  it("refreshes once and retries with the same idempotency key", async () => {
    const { api, sent } = setup({
      orders: [{ status: 401 }, { status: 201, data: { id: "o1" } }],
      "auth/refresh": [{ status: 204 }],
    });

    const response = await api.post("orders", {}, { idempotencyKey: "key-from-tap-0001" });

    expect(response.data).toEqual({ id: "o1" });
    const keys = requestsTo(sent, "orders").map((c) => c.headers.get("Idempotency-Key"));
    expect(keys).toEqual(["key-from-tap-0001", "key-from-tap-0001"]);
  });

  it("shares one refresh between concurrent 401s", async () => {
    const { api, sent } = setup({
      a: [{ status: 401 }, { status: 200, data: "a" }],
      b: [{ status: 401 }, { status: 200, data: "b" }],
      "auth/refresh": [{ status: 204 }],
    });

    const results = await Promise.all([api.get("a"), api.get("b")]);

    expect(results.map((r) => r.data)).toEqual(["a", "b"]);
    expect(requestsTo(sent, "auth/refresh")).toHaveLength(1);
  });

  it("never refreshes for auth endpoints like login", async () => {
    const { api, sent } = setup({
      "auth/login": [
        {
          status: 401,
          data: { error: { code: "auth.invalid_credentials", message: "wrong", request_id: "r1" } },
        },
      ],
    });

    await expect(api.post("auth/login", {})).rejects.toMatchObject({
      code: "auth.invalid_credentials",
      requestId: "r1",
    });
    expect(requestsTo(sent, "auth/refresh")).toHaveLength(0);
  });

  it("redirects to login once when the refresh is rejected", async () => {
    const { api, onAuthFailure } = setup({
      a: [{ status: 401 }],
      b: [{ status: 401 }],
      "auth/refresh": [{ status: 401 }],
    });

    const results = await Promise.allSettled([api.get("a"), api.get("b")]);

    expect(results.every((r) => r.status === "rejected")).toBe(true);
    expect(onAuthFailure).toHaveBeenCalledTimes(1);
  });

  it("skips the redirect for optional session probes", async () => {
    const { api, onAuthFailure } = setup({
      me: [{ status: 401 }],
      "auth/refresh": [{ status: 401 }],
    });

    await expect(api.get("me", { _skipAuthRedirect: true })).rejects.toBeInstanceOf(ApiError);
    expect(onAuthFailure).not.toHaveBeenCalled();
  });

  it("keeps the session when the refresh fails on a flaky network", async () => {
    const offline = new AxiosError("Network Error", "ERR_NETWORK");
    const { api, onAuthFailure } = setup({ a: [{ status: 401 }], "auth/refresh": [offline] });

    await expect(api.get("a")).rejects.toBeInstanceOf(NetworkError);
    expect(onAuthFailure).not.toHaveBeenCalled();
  });
});

describe("errors", () => {
  it("wraps responses-less failures in NetworkError", async () => {
    const { api } = setup({ a: [new AxiosError("Network Error", "ERR_NETWORK")] });
    await expect(api.get("a")).rejects.toBeInstanceOf(NetworkError);
  });

  it("passes cancellations through for TanStack Query", async () => {
    const cancel = new CanceledError();
    const { api } = setup({ a: [cancel] });
    await expect(api.get("a")).rejects.toBe(cancel);
  });
});

describe("customer token transport", () => {
  it("sends the stored access token as a bearer", async () => {
    const { api, sent } = setupCustomer({ me: [{ status: 200 }] }, signedInStore("at-1"));
    await api.get("me");
    expect(authorization(sent[0])).toBe("Bearer at-1");
  });

  it("sends no bearer while signed out", async () => {
    const { api, sent } = setupCustomer({ products: [{ status: 200 }] }, createAccessTokenStore());
    await api.get("products");
    expect(sent[0]?.headers.has("Authorization")).toBe(false);
  });

  it("sends the shop CSRF header", async () => {
    const { api, sent } = setupCustomer({ "auth/login": [{ status: 202 }] }, signedInStore());
    await api.post("auth/login", {}, { idempotencyKey: "key-from-tap-0001" });
    expect(sent[0]?.headers.get("X-PNL-CSRF")).toBe("1");
  });

  it("leaves the admin-style client (no token store) without a bearer", async () => {
    const { api, sent } = setup({ "admin/products": [{ status: 200 }] });
    await api.get("admin/products");
    expect(sent[0]?.headers.has("Authorization")).toBe(false);
  });

  it("gives DELETE requests an Idempotency-Key", async () => {
    const { api, sent } = setupCustomer({ "me/sessions/s1": [{ status: 204 }] }, signedInStore());
    await api.delete("me/sessions/s1", { idempotencyKey: "key-from-tap-0002" });
    expect(sent[0]?.headers.get("Idempotency-Key")).toBe("key-from-tap-0002");
  });

  it.each(["auth/login/verify", "auth/challenges/c1/resend"])(
    "never refreshes a 401 from %s (auth/ prefix)",
    async (url) => {
      const { api, sent } = setupCustomer(
        { [url]: [{ status: 401, data: errorBody("auth.invalid_code") }] },
        signedInStore(),
      );

      await expect(
        api.post(url, {}, { idempotencyKey: "key-from-tap-0001" }),
      ).rejects.toMatchObject({ code: "auth.invalid_code" });
      expect(requestsTo(sent, "auth/refresh")).toHaveLength(0);
    },
  );
});

describe("customer refresh", () => {
  it("stores the refreshed access token", async () => {
    const store = signedInStore("at-old");
    const { api } = setupCustomer(
      {
        me: [{ status: 401 }, { status: 200 }],
        "auth/refresh": [{ status: 200, data: tokens("at-new") }],
      },
      store,
    );

    await api.get("me");

    expect(store.get()?.token).toBe("at-new");
  });

  it("retries the request with the new access token", async () => {
    const { api, sent } = setupCustomer(
      {
        me: [{ status: 401 }, { status: 200 }],
        "auth/refresh": [{ status: 200, data: tokens("at-new") }],
      },
      signedInStore("at-old"),
    );

    await api.get("me");

    expect(requestsTo(sent, "me").map(authorization)).toEqual(["Bearer at-old", "Bearer at-new"]);
  });

  it("retries the refresh once when another tab superseded it", async () => {
    const { api, sent } = setupCustomer(
      {
        me: [{ status: 401 }, { status: 200, data: "ok" }],
        "auth/refresh": [
          { status: 409, data: errorBody("auth.refresh_superseded") },
          { status: 200, data: tokens("at-new") },
        ],
      },
      signedInStore(),
    );

    const response = await api.get("me");

    expect(response.data).toBe("ok");
    expect(requestsTo(sent, "auth/refresh")).toHaveLength(2);
  });

  it("gives up after a second superseded refresh", async () => {
    const superseded = { status: 409, data: errorBody("auth.refresh_superseded") };
    const { api, sent } = setupCustomer(
      { me: [{ status: 401 }], "auth/refresh": [superseded, superseded] },
      signedInStore(),
    );

    await expect(api.get("me")).rejects.toBeInstanceOf(ApiError);
    expect(requestsTo(sent, "auth/refresh")).toHaveLength(2);
  });

  it("clears the access token when the refresh is rejected", async () => {
    const store = signedInStore();
    const { api } = setupCustomer(
      {
        me: [{ status: 401 }],
        "auth/refresh": [{ status: 401, data: errorBody("auth.refresh_invalid") }],
      },
      store,
    );

    await expect(api.get("me")).rejects.toBeInstanceOf(ApiError);
    expect(store.get()).toBeUndefined();
  });

  it("reports the lost session once for concurrent requests", async () => {
    const { api, onAuthFailure } = setupCustomer(
      {
        a: [{ status: 401 }],
        b: [{ status: 401 }],
        "auth/refresh": [{ status: 401, data: errorBody("auth.refresh_invalid") }],
      },
      signedInStore(),
    );

    await Promise.allSettled([api.get("a"), api.get("b")]);

    expect(onAuthFailure).toHaveBeenCalledTimes(1);
  });

  it("keeps the session when the refresh is rate limited", async () => {
    const store = signedInStore("at-old");
    const { api, onAuthFailure } = setupCustomer(
      { me: [{ status: 401 }], "auth/refresh": [{ status: 429, data: errorBody("rate_limited") }] },
      store,
    );

    await expect(api.get("me")).rejects.toMatchObject({ status: 429 });
    expect(onAuthFailure).not.toHaveBeenCalled();
    expect(store.get()?.token).toBe("at-old");
  });
});

describe("refreshSession", () => {
  it("shares one refresh request between concurrent callers", async () => {
    const { api, sent } = setupCustomer(
      { "auth/refresh": [{ status: 200, data: tokens("at-new") }] },
      createAccessTokenStore(),
    );

    await Promise.all([api.refreshSession(), api.refreshSession()]);

    expect(requestsTo(sent, "auth/refresh")).toHaveLength(1);
  });

  it("rejects without the login redirect when there is no session", async () => {
    const { api, onAuthFailure } = setupCustomer(
      { "auth/refresh": [{ status: 401, data: errorBody("auth.refresh_invalid") }] },
      createAccessTokenStore(),
    );

    await expect(api.refreshSession()).rejects.toMatchObject({ code: "auth.refresh_invalid" });
    expect(onAuthFailure).not.toHaveBeenCalled();
  });

  it("refreshes without a cross-tab lock when navigator.locks is unavailable", async () => {
    const store = createAccessTokenStore();
    const { api } = setupCustomer(
      { "auth/refresh": [{ status: 200, data: tokens("at-new") }] },
      store,
    );

    await api.refreshSession();

    expect("locks" in navigator).toBe(false);
    expect(store.get()?.token).toBe("at-new");
  });

  describe("with navigator.locks", () => {
    const request = vi.fn((_name: string, callback: () => Promise<unknown>) => callback());

    beforeEach(() => {
      request.mockClear();
      Object.defineProperty(navigator, "locks", { value: { request }, configurable: true });
    });

    afterEach(() => {
      Reflect.deleteProperty(navigator, "locks");
    });

    it("refreshes inside the shared cross-tab lock", async () => {
      const { api } = setupCustomer(
        { "auth/refresh": [{ status: 200, data: tokens("at-new") }] },
        createAccessTokenStore(),
      );

      await api.refreshSession();

      expect(request).toHaveBeenCalledWith("pnl-auth-refresh", expect.any(Function));
    });
  });
});
