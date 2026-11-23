import { Form, FormField, useAppForm } from "@hackert-ui/form";
import { useRef } from "react";
import { type Idempotent, withIdempotencyKey } from "@/api/idempotency";
import { toAuthFormErrors } from "../errors";
import {
  type NewPasswordInput,
  newPasswordSchema,
  type OtpChallenge,
  type ResetRequestInput,
  resetRequestSchema,
} from "../schemas";
import type { ResetCompleteResult } from "../services";

interface RequestResetFormProps {
  onRequest: (variables: Idempotent<ResetRequestInput>) => Promise<OtpChallenge>;
  onSuccess: (challenge: OtpChallenge) => void;
}

export function RequestResetForm({ onRequest, onSuccess }: RequestResetFormProps) {
  const challenge = useRef<OtpChallenge>(undefined as unknown as OtpChallenge);

  const form = useAppForm({
    defaultValues: { phone: "" } satisfies ResetRequestInput,
    validators: {
      onChange: resetRequestSchema,
      onSubmitAsync: async ({ value }) => {
        try {
          challenge.current = await onRequest(withIdempotencyKey(value));
          return undefined;
        } catch (error) {
          return toAuthFormErrors(error);
        }
      },
    },
    onSubmit: () => onSuccess(challenge.current),
  });

  return (
    <Form form={form} className="flex flex-col gap-4">
      <form.FormError />
      <form.AppField name="phone">
        {(field) => (
          <FormField>
            <FormField.Label>Phone number</FormField.Label>
            <field.TextInput type="tel" autoComplete="tel" />
            <FormField.Error />
          </FormField>
        )}
      </form.AppField>
      <form.SubmitButton className="mt-2">Send code</form.SubmitButton>
    </Form>
  );
}

const newPasswordDefaults: NewPasswordInput = { password: "", confirmPassword: "" };

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
    onSubmit: () => onSuccess(result.current),
  });

  return (
    <Form form={form} className="flex flex-col gap-4">
      <form.FormError />
      <form.AppField name="password">
        {(field) => (
          <FormField>
            <FormField.Label>New password</FormField.Label>
            <field.TextInput type="password" autoComplete="new-password" />
            <FormField.Description>At least 8 characters.</FormField.Description>
            <FormField.Error />
          </FormField>
        )}
      </form.AppField>
      <form.AppField name="confirmPassword">
        {(field) => (
          <FormField>
            <FormField.Label>Confirm password</FormField.Label>
            <field.TextInput type="password" autoComplete="new-password" />
            <FormField.Error />
          </FormField>
        )}
      </form.AppField>
      <form.SubmitButton className="mt-2">Change password</form.SubmitButton>
    </Form>
  );
}
