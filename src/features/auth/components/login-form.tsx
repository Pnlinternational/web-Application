import { Form, FormField, useAppForm } from "@hackert-ui/form";
import { type ReactNode, useRef } from "react";
import { type Idempotent, withIdempotencyKey } from "@/api/idempotency";
import { clearSubmitErrors } from "@/components/form/errors";
import { PhoneInput } from "@/components/form/phone-input";
import { toE164 } from "@/lib/phone";
import { toAuthFormErrors } from "../errors";
import { type LoginFormValues, type LoginInput, loginFormSchema } from "../schemas";
import { AUTH_BANNER, AUTH_PRIMARY_BUTTON } from "./auth-ui";

const defaultValues: LoginFormValues = { market: "NG", phone: "", password: "" };

interface LoginFormProps<TResult> {
  /** A login mutation's mutateAsync (customer or admin). */
  onLogin: (variables: Idempotent<LoginInput>) => Promise<TResult>;
  /** Gets what onLogin resolved with (the customer flow may still need a code) and what was sent. */
  onSuccess: (result: TResult, input: LoginInput) => void | Promise<void>;
  /** Shown under the password field, e.g. a "Forgot password?" link. */
  passwordHelp?: ReactNode;
}

export function LoginForm<TResult>({ onLogin, onSuccess, passwordHelp }: LoginFormProps<TResult>) {
  const sent = useRef<{ result: TResult; input: LoginInput }>(undefined);
  const form = useAppForm({
    defaultValues,
    validators: {
      onChange: loginFormSchema,
      // The request runs as the submit validator so API errors land on the form.
      // Each submit is a new user action, so it gets a new idempotency key.
      onSubmitAsync: async ({ value }) => {
        const input = { phone: toE164(value.market, value.phone), password: value.password };
        try {
          sent.current = { result: await onLogin(withIdempotencyKey(input)), input };
          return undefined;
        } catch (error) {
          return toAuthFormErrors(error);
        }
      },
    },
    listeners: { onChange: clearSubmitErrors },
    onSubmit: () => {
      if (sent.current) return onSuccess(sent.current.result, sent.current.input);
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
      <form.AppField name="password">
        {(field) => (
          <FormField>
            <FormField.Label>Password</FormField.Label>
            <field.TextInput
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
            />
            <FormField.Error />
            {passwordHelp ? <div className="-mb-2 flex justify-end">{passwordHelp}</div> : null}
          </FormField>
        )}
      </form.AppField>
      <form.SubmitButton radius="lg" className={AUTH_PRIMARY_BUTTON}>
        Sign in
      </form.SubmitButton>
    </Form>
  );
}
