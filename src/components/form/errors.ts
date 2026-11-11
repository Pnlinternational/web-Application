import { getErrorMessage, isApiError } from "@/api/errors";

/** Field errors can be strings (custom validators) or Standard Schema issues (zod). */
export function toErrorMessages(errors: readonly unknown[]): string[] {
  const messages = errors.flatMap((error) => {
    if (typeof error === "string") return [error];
    if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      typeof error.message === "string"
    ) {
      return [error.message];
    }
    return [];
  });
  return [...new Set(messages)];
}

export interface ServerFormErrors {
  form?: string;
  fields: Record<string, string>;
}

/**
 * Maps an API failure onto the form: field errors go next to their inputs, anything else
 * becomes a form-level message. Return it from `validators.onSubmitAsync`.
 */
export function toServerFormErrors(error: unknown): ServerFormErrors {
  if (isApiError(error) && Object.keys(error.fieldErrors).length > 0) {
    const fields = Object.fromEntries(
      Object.entries(error.fieldErrors).map(([name, messages]) => [name, messages.join(". ")]),
    );
    return { fields };
  }
  // In a form, a 4xx (including 401 "Invalid credentials") is a direct answer to the submission.
  const message = isApiError(error) && error.status < 500 ? error.message : getErrorMessage(error);
  return { form: message, fields: {} };
}
