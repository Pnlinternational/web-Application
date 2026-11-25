import { type ServerFormErrors, toServerFormErrors } from "@/components/form/errors";
import { isApiError } from "@/api/errors";

// Confirmed on staging: invalid_credentials, invalid_code, invalid_phone, weak_password.
// UNCONFIRMED guesses (the staging OpenAPI was unreachable): phone_taken, code_expired.
// Confirm both with the API team; until then those two states only show if the names match.
export const AUTH_ERROR_CODES = {
  invalidCredentials: "auth.invalid_credentials",
  invalidCode: "auth.invalid_code",
  invalidPhone: "auth.invalid_phone",
  weakPassword: "auth.weak_password",
  phoneTaken: "auth.phone_taken",
  codeExpired: "auth.code_expired",
} as const;

export const PHONE_TAKEN_MESSAGE = "This number already has an account.";

// Design copy for codes whose API message isn't meant to be shown as-is.
const COPY_BY_CODE: Record<string, string> = {
  [AUTH_ERROR_CODES.invalidCredentials]:
    "Phone number or password is incorrect. Check them and try again.",
  [AUTH_ERROR_CODES.phoneTaken]: PHONE_TAKEN_MESSAGE,
  [AUTH_ERROR_CODES.codeExpired]: "This code has expired. Send a new one to continue.",
};

const FIELD_BY_CODE: Record<string, string> = {
  [AUTH_ERROR_CODES.invalidPhone]: "phone",
  [AUTH_ERROR_CODES.weakPassword]: "password",
  [AUTH_ERROR_CODES.invalidCode]: "code",
  [AUTH_ERROR_CODES.phoneTaken]: "phone",
};

export function hasAuthErrorCode(error: unknown, code: string) {
  return isApiError(error) && error.code === code;
}

/** Puts known auth error codes next to their input; everything else is a form-level message. */
export function toAuthFormErrors(error: unknown): ServerFormErrors {
  if (!isApiError(error) || !error.code) return toServerFormErrors(error);
  const message = COPY_BY_CODE[error.code] ?? error.message;
  const field = FIELD_BY_CODE[error.code];
  if (field) return { fields: { [field]: message } };
  if (COPY_BY_CODE[error.code]) return { form: message, fields: {} };
  return toServerFormErrors(error);
}
