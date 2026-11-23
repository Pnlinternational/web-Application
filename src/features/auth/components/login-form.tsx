import { Form, FormField, useAppForm } from "@hackert-ui/form";
import { useRef } from "react";
import { type Idempotent, withIdempotencyKey } from "@/api/idempotency";
import { toAuthFormErrors } from "../errors";
import { type LoginInput, loginSchema } from "../schemas";

const defaultValues: LoginInput = { phone: "", password: "" };

interface LoginFormProps<TResult> {
  /** A login mutation's mutateAsync (customer or admin). */
  onLogin: (variables: Idempotent<LoginInput>) => Promise<TResult>;
  /** Gets what onLogin resolved with (the customer flow may still need a code). */
  onSuccess: (result: TResult) => void | Promise<void>;
}

export function LoginForm<TResult>({ onLogin, onSuccess }: LoginFormProps<TResult>) {
  const result = useRef<TResult>(undefined as TResult);
  const form = useAppForm({
    defaultValues,
    validators: {
      onChange: loginSchema,
      // The request runs as the submit validator so API errors land on the form.
      // Each submit is a new user action, so it gets a new idempotency key.
      onSubmitAsync: async ({ value }) => {
        try {
          result.current = await onLogin(withIdempotencyKey(value));
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
