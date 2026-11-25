import { Form, FormField, useAppForm } from "@hackert-ui/form";
import { Button } from "@hackert-ui/ui";
import { useSelector } from "@tanstack/react-form";
import { useEffect, useRef, useState } from "react";
import { getErrorMessage } from "@/api/errors";
import { createIdempotencyKey, type Idempotent, withIdempotencyKey } from "@/api/idempotency";
import { clearSubmitErrors } from "@/components/form/errors";
import { cn } from "@/lib/cn";
import { AUTH_ERROR_CODES, hasAuthErrorCode, toAuthFormErrors } from "../errors";
import { type CodeInput, codeSchema } from "../schemas";
import { AUTH_BANNER, AUTH_LINK, AUTH_PRIMARY_BUTTON } from "./auth-ui";
import { CODE_LENGTH, OtpInput } from "./otp-input";

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

function formatCountdown(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

interface VerifyCodeFormProps<TResult> {
  /** Seconds until the first resend is allowed (the challenge's resend_after). */
  resendAfter: number;
  onVerify: (variables: Idempotent<{ code: string }>) => Promise<TResult>;
  /** Resolves with the new resend_after. Gets a key made for this tap. */
  onResend: (idempotencyKey: string) => Promise<{ resend_after: number }>;
  onSuccess: (result: TResult) => void | Promise<void>;
  onChangePhone: () => void;
  submitLabel?: string;
}

export function VerifyCodeForm<TResult>({
  resendAfter,
  onVerify,
  onResend,
  onSuccess,
  onChangePhone,
  submitLabel = "Verify",
}: VerifyCodeFormProps<TResult>) {
  const result = useRef<TResult>(undefined as TResult);
  const [remaining, setRemaining] = useCountdown(resendAfter);
  const [resending, setResending] = useState(false);
  const [resendError, setResendError] = useState<string>();
  const [expired, setExpired] = useState(false);
  const [notice, setNotice] = useState("");
  const codeRef = useRef<HTMLDivElement>(null);

  const form = useAppForm({
    defaultValues,
    validators: {
      onSubmit: codeSchema,
      // Each submit is a new user action, so it gets a new idempotency key.
      onSubmitAsync: async ({ value }) => {
        try {
          result.current = await onVerify(withIdempotencyKey({ code: value.code }));
          return undefined;
        } catch (error) {
          if (hasAuthErrorCode(error, AUTH_ERROR_CODES.codeExpired)) setExpired(true);
          return toAuthFormErrors(error);
        }
      },
    },
    listeners: { onChange: clearSubmitErrors },
    onSubmit: () => onSuccess(result.current),
  });
  const incomplete = useSelector(form.store, (state) => state.values.code.length < CODE_LENGTH);

  async function resend() {
    setResending(true);
    setResendError(undefined);
    setNotice("");
    try {
      const accepted = await onResend(createIdempotencyKey());
      setRemaining(accepted.resend_after);
      setExpired(false);
      form.reset();
      setNotice("We sent a new code.");
      codeRef.current?.querySelector("input")?.focus();
    } catch (error) {
      setResendError(getErrorMessage(error));
    } finally {
      setResending(false);
    }
  }

  return (
    <Form form={form} className="flex flex-col gap-4">
      <form.FormError className={AUTH_BANNER} />
      <form.AppField
        name="code"
        listeners={{
          // Digits only (paste "482 196" works); a full code submits itself.
          onChange: ({ value, fieldApi }) => {
            const digits = value.replace(/\D/g, "").slice(0, CODE_LENGTH);
            if (digits !== value) fieldApi.setValue(digits, { dontRunListeners: true });
            if (digits.length === CODE_LENGTH && !form.state.isSubmitting && !expired) {
              void form.handleSubmit();
            }
          },
        }}
      >
        {() => (
          <div ref={codeRef}>
            <FormField>
              <FormField.Label>Verification code</FormField.Label>
              <OtpInput />
              <FormField.Error className="text-label font-normal" />
            </FormField>
          </div>
        )}
      </form.AppField>

      <p role="status" className="sr-only">
        {notice}
      </p>

      {expired ? (
        <Button
          radius="lg"
          className={AUTH_PRIMARY_BUTTON}
          loading={resending}
          onClick={() => void resend()}
        >
          Resend code
        </Button>
      ) : (
        <form.SubmitButton
          radius="lg"
          className={cn(AUTH_PRIMARY_BUTTON, incomplete && "cursor-not-allowed opacity-50")}
          aria-disabled={incomplete}
          onClick={(event) => {
            if (incomplete) event.preventDefault();
          }}
        >
          {submitLabel}
        </form.SubmitButton>
      )}

      {resendError ? (
        <p role="alert" className="text-caption text-danger-ink">
          {resendError}
        </p>
      ) : null}
      <div className="flex flex-col items-center">
        {remaining > 0 ? (
          <p className="flex h-11 items-center text-body-sm text-muted" aria-live="off">
            Resend code in {formatCountdown(remaining)}
          </p>
        ) : expired ? null : (
          <button
            type="button"
            className={AUTH_LINK}
            disabled={resending}
            onClick={() => void resend()}
          >
            Resend code
          </button>
        )}
        <button type="button" className={AUTH_LINK} onClick={onChangePhone}>
          Change phone number
        </button>
      </div>
    </Form>
  );
}
