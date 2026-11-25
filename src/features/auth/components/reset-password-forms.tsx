import { Form, FormField, useAppForm } from "@hackert-ui/form";
import { useRef } from "react";
import { type Idempotent, withIdempotencyKey } from "@/api/idempotency";
import { clearSubmitErrors } from "@/components/form/errors";
import { PhoneInput } from "@/components/form/phone-input";
import { toE164 } from "@/lib/phone";
import { toAuthFormErrors } from "../errors";
import {
  type NewPasswordInput,
  newPasswordSchema,
  type OtpChallenge,
  type ResetRequestFormValues,
  type ResetRequestInput,
  resetRequestFormSchema,
} from "../schemas";
import type { ResetCompleteResult } from "../services";
import { AUTH_BANNER, AUTH_PRIMARY_BUTTON, PasswordChecks } from "./auth-ui";

interface RequestResetFormProps {
  onRequest: (variables: Idempotent<ResetRequestInput>) => Promise<OtpChallenge>;
  onSuccess: (challenge: OtpChallenge, phone: string) => void;
}

const requestDefaults: ResetRequestFormValues = { market: "NG", phone: "" };

export function RequestResetForm({ onRequest, onSuccess }: RequestResetFormProps) {
  const sent = useRef<{ challenge: OtpChallenge; phone: string }>(undefined);

  const form = useAppForm({
    defaultValues: requestDefaults,
    validators: {
      onChange: resetRequestFormSchema,
      onSubmitAsync: async ({ value }) => {
        const phone = toE164(value.market, value.phone);
        try {
          sent.current = { challenge: await onRequest(withIdempotencyKey({ phone })), phone };
          return undefined;
        } catch (error) {
          return toAuthFormErrors(error);
        }
      },
    },
    listeners: { onChange: clearSubmitErrors },
    onSubmit: () => {
      if (sent.current) onSuccess(sent.current.challenge, sent.current.phone);
    },
  });

  return (
    <Form form={form} className="flex flex-col gap-4">
      <form.FormError className={AUTH_BANNER} />
      <form.AppField name="phone">
        {() => (
          <FormField>
            <FormField.Label>Phone number</FormField.Label>
            <PhoneInput />
            <FormField.Error />
          </FormField>
        )}
      </form.AppField>
      <form.SubmitButton radius="lg" className={AUTH_PRIMARY_BUTTON}>
        Send code
      </form.SubmitButton>
    </Form>
  );
}

const newPasswordDefaults: NewPasswordInput = { password: "" };

interface NewPasswordFormProps {
  onComplete: (variables: Idempotent<{ password: string }>) => Promise<ResetCompleteResult>;
  onSuccess: (result: ResetCompleteResult) => void;
}

export function NewPasswordForm({ onComplete, onSuccess }: NewPasswordFormProps) {
  const result = useRef<ResetCompleteResult>({ kind: "done" });

  const form = useAppForm({
    defaultValues: newPasswordDefaults,
    validators: {
      onChange: newPasswordSchema,
      onSubmitAsync: async ({ value }) => {
        try {
          result.current = await onComplete(withIdempotencyKey({ password: value.password }));
          return undefined;
        } catch (error) {
          return toAuthFormErrors(error);
        }
      },
    },
    listeners: { onChange: clearSubmitErrors },
    onSubmit: () => onSuccess(result.current),
  });

  return (
    <Form form={form} className="flex flex-col gap-4">
      <form.FormError className={AUTH_BANNER} />
      <form.AppField name="password">
        {(field) => (
          <FormField>
            <FormField.Label>New password</FormField.Label>
            <field.TextInput
              type="password"
              autoComplete="new-password"
              placeholder="Create a password"
            />
            <PasswordChecks />
            <FormField.Error />
          </FormField>
        )}
      </form.AppField>
      <form.SubmitButton radius="lg" className={AUTH_PRIMARY_BUTTON}>
        Update password
      </form.SubmitButton>
    </Form>
  );
}
