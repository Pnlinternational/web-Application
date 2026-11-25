import { describe, expect, it } from "vite-plus/test";
import { ApiError, NetworkError } from "@/api/errors";
import { toAuthFormErrors } from "./errors";

function apiError(code: string, message = `${code} message`, status = 422) {
  return new ApiError({ status, code, message });
}

describe("toAuthFormErrors", () => {
  it.each([
    ["auth.invalid_phone", "phone"],
    ["auth.weak_password", "password"],
    ["auth.invalid_code", "code"],
  ])("puts %s next to the %s field", (code, field) => {
    expect(toAuthFormErrors(apiError(code))).toEqual({ fields: { [field]: `${code} message` } });
  });

  it("shows wrong credentials as the design's banner copy", () => {
    expect(toAuthFormErrors(apiError("auth.invalid_credentials", "wrong", 401))).toEqual({
      form: "Phone number or password is incorrect. Check them and try again.",
      fields: {},
    });
  });

  it("puts a taken phone number on the phone field", () => {
    expect(toAuthFormErrors(apiError("auth.phone_taken", "taken", 409))).toEqual({
      fields: { phone: "This number already has an account." },
    });
  });

  it("shows an expired code as a form message", () => {
    expect(toAuthFormErrors(apiError("auth.code_expired", "expired", 410))).toEqual({
      form: "This code has expired. Send a new one to continue.",
      fields: {},
    });
  });

  it("shows other API errors as a form message", () => {
    expect(toAuthFormErrors(apiError("auth.rate_limited", "slow down", 429))).toEqual({
      form: "slow down",
      fields: {},
    });
  });

  it("shows a generic form message when the request never reached the API", () => {
    const errors = toAuthFormErrors(new NetworkError(new Error("offline")));
    expect(errors.fields).toEqual({});
    expect(errors.form).toBeTruthy();
  });
});
