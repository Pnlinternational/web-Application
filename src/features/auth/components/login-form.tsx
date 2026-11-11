import { type Idempotent, withIdempotencyKey } from "@/api/idempotency";
import { toServerFormErrors } from "@/components/form/errors";
import { useAppForm } from "@/components/form/form";
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
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.AppForm>
        <form.FormError />
        <form.AppField name="phone">
          {(field) => <field.TextField label="Phone number" type="tel" autoComplete="tel" />}
        </form.AppField>
        <form.AppField name="password">
          {(field) => (
            <field.TextField label="Password" type="password" autoComplete="current-password" />
          )}
        </form.AppField>
        <form.SubmitButton className="mt-2">Sign in</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
