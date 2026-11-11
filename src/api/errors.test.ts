import { expect, it } from "vite-plus/test";
import { ApiError, getErrorMessage, isRetryableError, NetworkError, ParseError } from "./errors";

it("only retries network and server errors", () => {
  expect(isRetryableError(new NetworkError(new TypeError("offline")))).toBe(true);
  expect(isRetryableError(new ApiError({ status: 503, message: "Unavailable" }))).toBe(true);
  expect(isRetryableError(new ApiError({ status: 404, message: "Missing" }))).toBe(false);
  expect(isRetryableError(new ParseError("/x", []))).toBe(false);
  expect(isRetryableError(new Error("bug"))).toBe(false);
});

it("gives users a readable message without leaking internals", () => {
  expect(getErrorMessage(new ApiError({ status: 400, message: "Coupon expired" }))).toBe(
    "Coupon expired",
  );
  expect(getErrorMessage(new ApiError({ status: 500, message: "NullPointerException" }))).toMatch(
    /Something went wrong/,
  );
  expect(getErrorMessage(new NetworkError(new TypeError()))).toMatch(/connection/);
  expect(getErrorMessage(new Error("TypeError: x is undefined"))).toMatch(/Something went wrong/);
});
