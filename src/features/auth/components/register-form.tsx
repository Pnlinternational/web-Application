import { withIdempotencyKey } from "@/api/idempotency";
import { toServerFormErrors } from "@/components/form/errors";
import { Form, FormField, useAppForm } from "@hackert-ui/form";
import { useRegisterMutation } from "../mutations";
import { type RegisterInput, registerSchema } from "../schemas";

const defaultValues: RegisterInput = { name: "", phone: "", password: "", confirmPassword: "" };

export function RegisterForm({ onSuccess }: { onSuccess: () => void | Promise<void> }) {
  const registerMutation = useRegisterMutation();

  const form = useAppForm({
    defaultValues,
    validators: {
      onChange: registerSchema,
      onSubmitAsync: async ({ value }) => {
        try {
          await registerMutation.mutateAsync(withIdempotencyKey(value));
          return undefined;
        } catch (error) {
          return toServerFormErrors(error);
        }
      },
    },
    onSubmit: () => onSuccess(),
  });

  return (
    <Form form={form} className="flex flex-col gap-4">
      <form.FormError />
      <form.AppField name="name">
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
      <form.SubmitButton className="mt-2">Create account</form.SubmitButton>
    </Form>
  );
}
