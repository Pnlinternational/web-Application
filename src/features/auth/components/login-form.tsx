import { type Idempotent, withIdempotencyKey } from "@/api/idempotency";
import { toServerFormErrors } from "@/components/form/errors";
import { Form, FormField, useAppForm } from "@hackert-ui/form";
import { type LoginInput, loginSchema } from "../schemas";

const defaultValues: LoginInput = { phone: "", password: "" };

interface LoginFormProps {
  /** A login mutation's mutateAsync (customer or admin). */
  onLogin: (variables: Idempotent<LoginInput>) => Promise<unknown>;
  onSuccess: () => void | Promise<void>;
}

export function LoginForm({ onLogin, onSuccess }: LoginFormProps) {
  const form = useAppForm({
    defaultValues,
    validators: {
      onChange: loginSchema,
      // The request runs as the submit validator so API errors land on the form.
      // Each submit is a new user action, so it gets a new idempotency key.
      onSubmitAsync: async ({ value }) => {
        try {
          await onLogin(withIdempotencyKey(value));
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
            <field.TextInput type="password" autoComplete="current-password" />
            <FormField.Error />
          </FormField>
        )}
      </form.AppField>
      <form.SubmitButton className="mt-2">Sign in</form.SubmitButton>
    </Form>
  );
}
