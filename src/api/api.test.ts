import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { AxiosError, CanceledError } from "axios";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { createApiClient } from "./api";
import { ApiError, NetworkError } from "./errors";

type Reply = { status: number; data?: unknown } | Error;

function reply(
  config: InternalAxiosRequestConfig,
  { status, data }: { status: number; data?: unknown },
) {
  const response: AxiosResponse = { status, statusText: "", data, headers: {}, config };
  if (status >= 400) {
    throw new AxiosError("Request failed", undefined, config, undefined, response);
  }
  return response;
}

// Routes requests by URL to queued replies, recording every request the client sends.
function setup(routes: Record<string, Reply[]>) {
  const sent: InternalAxiosRequestConfig[] = [];
  const adapter: AxiosAdapter = async (config) => {
    sent.push(config);
    const next = routes[config.url ?? ""]?.shift();
    if (!next) throw new Error(`Unexpected request to ${config.url}`);
    if (next instanceof Error) throw next;
    return reply(config, next);
  };
  const onAuthFailure = vi.fn();
  const api = createApiClient({
    refreshEndpoint: "auth/refresh",
    authEndpoints: ["auth/login"],
    onAuthFailure,
    adapter,
  });
  return { api, sent, onAuthFailure };
}

const requestsTo = (sent: InternalAxiosRequestConfig[], url: string) =>
  sent.filter((c) => c.url === url);

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
