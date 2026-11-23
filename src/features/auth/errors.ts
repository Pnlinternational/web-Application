import { type ServerFormErrors, toServerFormErrors } from "@/components/form/errors";
import { isApiError } from "@/api/errors";

const FIELD_BY_CODE: Record<string, string> = {
  "auth.invalid_phone": "phone",
  "auth.weak_password": "password",
  "auth.invalid_code": "code",
};

/** Puts known auth error codes next to their input; everything else is a form-level message. */
export function toAuthFormErrors(error: unknown): ServerFormErrors {
  const field = isApiError(error) && error.code ? FIELD_BY_CODE[error.code] : undefined;
  if (field && isApiError(error)) return { fields: { [field]: error.message } };
  return toServerFormErrors(error);
}
