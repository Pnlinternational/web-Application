import { withIdempotencyKey } from "@/api/idempotency";
import { toServerFormErrors } from "@/components/form/errors";
import { useAppForm } from "@/components/form/form";
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
        <form.AppField name="name">
          {(field) => <field.TextField label="Full name" autoComplete="name" />}
        </form.AppField>
        <form.AppField name="phone">
          {(field) => <field.TextField label="Phone number" type="tel" autoComplete="tel" />}
        </form.AppField>
        <form.AppField name="password">
          {(field) => (
            <field.TextField
              label="Password"
              type="password"
              autoComplete="new-password"
              description="At least 8 characters."
            />
          )}
        </form.AppField>
        <form.AppField name="confirmPassword">
          {(field) => (
            <field.TextField label="Confirm password" type="password" autoComplete="new-password" />
          )}
        </form.AppField>
        <form.SubmitButton className="mt-2">Create account</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}
