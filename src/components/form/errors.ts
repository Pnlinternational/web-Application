import { getErrorMessage, isApiError } from "@/api/errors";

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

interface ErrorMapApi {
  setErrorMap: (errorMap: { onSubmit: undefined }) => void;
}

/**
 * Use as the form's `listeners.onChange`: an edit clears the API's answer to the last submit
 * (the form banner and that field's message), so the user can retry, even with the same value.
 */
export function clearSubmitErrors({
  formApi,
  fieldApi,
}: {
  formApi: ErrorMapApi;
  fieldApi: ErrorMapApi;
}) {
  formApi.setErrorMap({ onSubmit: undefined });
  fieldApi.setErrorMap({ onSubmit: undefined });
}
