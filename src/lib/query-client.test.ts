import { describe, expect, it, vi } from "vite-plus/test";
import { createQueryClient, shouldRetry } from "./query-client";
import { ApiError, NetworkError } from "@/api/errors";

describe("shouldRetry", () => {
  it("retries transient errors up to twice and never client errors", () => {
    const transient = new NetworkError(new TypeError());
    expect(shouldRetry(0, transient)).toBe(true);
    expect(shouldRetry(1, transient)).toBe(true);
    expect(shouldRetry(2, transient)).toBe(false);
    expect(shouldRetry(0, new ApiError({ status: 422, message: "Invalid" }))).toBe(false);
  });
});

describe("global error notifications", () => {
  it("does not toast first-load query failures (the boundary shows them)", async () => {
    const notifyError = vi.fn();
    const client = createQueryClient({ notifyError });
    vi.spyOn(console, "error").mockImplementation(() => {});

    await client
      .query({
        queryKey: ["x"],
        queryFn: () => Promise.reject(new ApiError({ status: 400, message: "Bad" })),
      })
      .catch(() => {});

    expect(notifyError).not.toHaveBeenCalled();
  });

  it("toasts background refetch failures when data is already shown", async () => {
    const notifyError = vi.fn();
    const client = createQueryClient({ notifyError });
    vi.spyOn(console, "error").mockImplementation(() => {});
    client.setQueryData(["x"], "cached");

    await client
      .query({
        queryKey: ["x"],
        staleTime: 0,
        queryFn: () => Promise.reject(new ApiError({ status: 400, message: "Bad request" })),
      })
      .catch(() => {});

    expect(notifyError).toHaveBeenCalledWith("Bad request");
  });

  it("toasts mutation errors unless the mutation is silent", async () => {
    const notifyError = vi.fn();
    const client = createQueryClient({ notifyError });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fail = () => Promise.reject(new ApiError({ status: 409, message: "Out of stock" }));

    await client
      .getMutationCache()
      .build(client, { mutationFn: fail })
      .execute(undefined)
      .catch(() => {});
    await client
      .getMutationCache()
      .build(client, { mutationFn: fail, meta: { silent: true } })
      .execute(undefined)
      .catch(() => {});

    expect(notifyError).toHaveBeenCalledTimes(1);
    expect(notifyError).toHaveBeenCalledWith("Out of stock");
  });
});

describe("mutation retries", () => {
  // Mutations retry like queries because every POST carries an Idempotency-Key.
  it("retries a mutation after a dropped connection, but not after a 4xx", async () => {
    const client = createQueryClient({ notifyError: vi.fn() });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const flaky = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new NetworkError(new TypeError("offline")))
      .mockResolvedValueOnce("ok");
    const rejected = vi.fn(() =>
      Promise.reject(new ApiError({ status: 409, message: "Out of stock" })),
    );
    const instant = { retryDelay: 0 };

    await expect(
      client
        .getMutationCache()
        .build(client, { mutationFn: flaky, ...instant })
        .execute(undefined),
    ).resolves.toBe("ok");
    await client
      .getMutationCache()
      .build(client, { mutationFn: rejected, ...instant })
      .execute(undefined)
      .catch(() => {});

    expect(flaky).toHaveBeenCalledTimes(2);
    expect(rejected).toHaveBeenCalledTimes(1);
  });
});
