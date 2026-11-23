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

  it("shows other API errors as a form message", () => {
    expect(toAuthFormErrors(apiError("auth.invalid_credentials", "wrong", 401))).toEqual({
      form: "wrong",
      fields: {},
    });
  });

  it("shows a generic form message when the request never reached the API", () => {
    const errors = toAuthFormErrors(new NetworkError(new Error("offline")));
    expect(errors.fields).toEqual({});
    expect(errors.form).toBeTruthy();
  });
});
