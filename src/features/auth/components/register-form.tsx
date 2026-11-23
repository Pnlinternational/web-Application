import { Form, FormField, useAppForm } from "@hackert-ui/form";
import { useRef } from "react";
import { withIdempotencyKey } from "@/api/idempotency";
import { CheckboxInput } from "@/components/form/checkbox-input";
import { toAuthFormErrors } from "../errors";
import { useRegisterMutation } from "../mutations";
import { type OtpChallenge, type RegisterInput, registerSchema } from "../schemas";

const defaultValues: RegisterInput = {
  fullName: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
  acceptTerms: false,
  marketingEmail: false,
  marketingSms: false,
};

export function RegisterForm({ onSuccess }: { onSuccess: (challenge: OtpChallenge) => void }) {
  const registerMutation = useRegisterMutation();
  const challenge = useRef<OtpChallenge>(undefined as unknown as OtpChallenge);

  const form = useAppForm({
    defaultValues,
    validators: {
      onChange: registerSchema,
      onSubmitAsync: async ({ value }) => {
        try {
          challenge.current = await registerMutation.mutateAsync(withIdempotencyKey(value));
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
      <form.AppField name="fullName">
        {(field) => (
          <FormField>
            <FormField.Label>Full name</FormField.Label>
            <field.TextInput autoComplete="name" />
            <FormField.Error />
          </FormField>
        )}
      </form.AppField>
      <form.AppField name="phone">
        {(field) => (
          <FormField>
            <FormField.Label>Phone number</FormField.Label>
            <field.TextInput type="tel" autoComplete="tel" />
            <FormField.Error />
          </FormField>
        )}
      </form.AppField>
      <form.AppField name="email">
        {(field) => (
          <FormField>
            <FormField.Label>Email (optional)</FormField.Label>
            <field.TextInput type="email" autoComplete="email" />
            <FormField.Error />
          </FormField>
        )}
      </form.AppField>
      <form.AppField name="password">
        {(field) => (
          <FormField>
            <FormField.Label>Password</FormField.Label>
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
      <form.AppField name="acceptTerms">
        {() => (
          <FormField>
            <CheckboxInput>I accept the terms and conditions</CheckboxInput>
            <FormField.Error />
          </FormField>
        )}
      </form.AppField>
      <form.AppField name="marketingEmail">
        {() => (
          <FormField>
            <CheckboxInput>Send me offers by email</CheckboxInput>
            <FormField.Error />
          </FormField>
        )}
      </form.AppField>
      <form.AppField name="marketingSms">
        {() => (
          <FormField>
            <CheckboxInput>Send me offers by SMS</CheckboxInput>
            <FormField.Error />
          </FormField>
        )}
      </form.AppField>
      <form.SubmitButton className="mt-2">Create account</form.SubmitButton>
    </Form>
  );
}
