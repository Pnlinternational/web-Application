import { Form, FormField, useAppForm } from "@hackert-ui/form";
import { Button } from "@hackert-ui/ui";
import { useEffect, useRef, useState } from "react";
import { getErrorMessage } from "@/api/errors";
import { createIdempotencyKey, type Idempotent, withIdempotencyKey } from "@/api/idempotency";
import { toAuthFormErrors } from "../errors";
import { type CodeInput, codeSchema } from "../schemas";

const defaultValues: CodeInput = { code: "" };

function useCountdown(initialSeconds: number) {
  const [remaining, setRemaining] = useState(initialSeconds);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setTimeout(() => setRemaining(remaining - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining]);

  return [remaining, setRemaining] as const;
}

interface VerifyCodeFormProps<TResult> {
  /** Seconds until the first resend is allowed (the challenge's resend_after). */
  resendAfter: number;
  onVerify: (variables: Idempotent<{ code: string }>) => Promise<TResult>;
  /** Resolves with the new resend_after. Gets a key made for this tap. */
  onResend: (idempotencyKey: string) => Promise<{ resend_after: number }>;
  onSuccess: (result: TResult) => void | Promise<void>;
  onStartAgain: () => void;
  submitLabel?: string;
}

export function VerifyCodeForm<TResult>({
  resendAfter,
  onVerify,
  onResend,
  onSuccess,
  onStartAgain,
  submitLabel = "Verify",
}: VerifyCodeFormProps<TResult>) {
  const result = useRef<TResult>(undefined as TResult);
  const [remaining, setRemaining] = useCountdown(resendAfter);
  const [resending, setResending] = useState(false);
  const [resendError, setResendError] = useState<string>();

  const form = useAppForm({
    defaultValues,
    validators: {
      onChange: codeSchema,
      // Each submit is a new user action, so it gets a new idempotency key.
      onSubmitAsync: async ({ value }) => {
        try {
          result.current = await onVerify(withIdempotencyKey({ code: value.code }));
          return undefined;
        } catch (error) {
          return toAuthFormErrors(error);
        }
      },
    },
    onSubmit: () => onSuccess(result.current),
  });

  async function resend() {
    setResending(true);
    setResendError(undefined);
    try {
      const accepted = await onResend(createIdempotencyKey());
      setRemaining(accepted.resend_after);
    } catch (error) {
      setResendError(getErrorMessage(error));
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Form form={form} className="flex flex-col gap-4">
        <form.FormError />
        <form.AppField name="code">
          {(field) => (
            <FormField>
              <FormField.Label>Verification code</FormField.Label>
              <field.TextInput inputMode="numeric" autoComplete="one-time-code" />
              <FormField.Description>Enter the 6-digit code we sent you.</FormField.Description>
              <FormField.Error />
            </FormField>
          )}
        </form.AppField>
        <form.SubmitButton className="mt-2">{submitLabel}</form.SubmitButton>
      </Form>
      {resendError ? (
        <p role="alert" className="text-xs text-danger">
          {resendError}
        </p>
      ) : null}
      <div className="flex items-center justify-between text-sm">
        <Button
          variant="secondary"
          size="sm"
          loading={resending}
          disabled={remaining > 0}
          onClick={() => void resend()}
        >
          {remaining > 0 ? `Resend code in ${remaining}s` : "Resend code"}
        </Button>
        <button type="button" className="text-muted-foreground" onClick={onStartAgain}>
          Start again
        </button>
      </div>
    </div>
  );
}
