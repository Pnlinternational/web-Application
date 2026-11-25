import { Form, FormField, useAppForm } from "@hackert-ui/form";
import { type ReactNode, useRef } from "react";
import { withIdempotencyKey } from "@/api/idempotency";
import { CheckboxInput } from "@/components/form/checkbox-input";
import { clearSubmitErrors } from "@/components/form/errors";
import { PhoneInput } from "@/components/form/phone-input";
import { toE164 } from "@/lib/phone";
import { PRIVACY_URL, TERMS_URL } from "../constants";
import { PHONE_TAKEN_MESSAGE, toAuthFormErrors } from "../errors";
import { useRegisterMutation } from "../mutations";
import { type OtpChallenge, type SignupFormValues, signupFormSchema } from "../schemas";
import { AUTH_BANNER, AUTH_PRIMARY_BUTTON, PasswordChecks } from "./auth-ui";

const defaultValues: SignupFormValues = {
  fullName: "",
  email: "",
  market: "NG",
  phone: "",
  password: "",
  acceptTerms: false,
};

interface SignupFormProps {
  onSuccess: (challenge: OtpChallenge, phone: string) => void;
  /** Shown after "This number already has an account." (a Sign in link). */
  phoneTakenAction?: ReactNode;
}

export function SignupForm({ onSuccess, phoneTakenAction }: SignupFormProps) {
  const registerMutation = useRegisterMutation();
  const sent = useRef<{ challenge: OtpChallenge; phone: string }>(undefined);

  const form = useAppForm({
    defaultValues,
    validators: {
      onChange: signupFormSchema,
      onSubmitAsync: async ({ value }) => {
        const phone = toE164(value.market, value.phone);
        try {
          const challenge = await registerMutation.mutateAsync(
            withIdempotencyKey({
              fullName: value.fullName,
              phone,
              email: value.email,
              password: value.password,
              acceptTerms: value.acceptTerms,
              marketingEmail: false,
              marketingSms: false,
            }),
          );
          sent.current = { challenge, phone };
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
      <form.AppField name="fullName">
        {(field) => (
          <FormField>
            <FormField.Label>Full name</FormField.Label>
            <field.TextInput autoComplete="name" placeholder="Your full name" />
            <FormField.Error />
          </FormField>
        )}
      </form.AppField>
      <form.AppField name="email">
        {(field) => (
          <FormField>
            <FormField.Label>Email (optional)</FormField.Label>
            <field.TextInput type="email" autoComplete="email" placeholder="you@example.com" />
            <FormField.Error />
          </FormField>
        )}
      </form.AppField>
      <form.AppField name="phone">
        {(field) => (
          <FormField>
            <FormField.Label>Phone number</FormField.Label>
            <PhoneInput />
            <div className="flex flex-wrap items-baseline gap-x-1">
              <FormField.Error />
              {field.state.meta.errors.includes(PHONE_TAKEN_MESSAGE) ? phoneTakenAction : null}
            </div>
          </FormField>
        )}
      </form.AppField>
      <form.AppField name="password">
        {(field) => (
          <FormField>
            <FormField.Label>Password</FormField.Label>
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
      <form.AppField name="acceptTerms">
        {() => (
          <FormField>
            <CheckboxInput>
              I agree to the{" "}
              <a
                href={TERMS_URL}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-primary"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href={PRIVACY_URL}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-primary"
              >
                Privacy Policy
              </a>
              , and consent to PNL processing my data.
            </CheckboxInput>
            <FormField.Error />
          </FormField>
        )}
      </form.AppField>
      <form.SubmitButton radius="lg" className={AUTH_PRIMARY_BUTTON}>
        Create account
      </form.SubmitButton>
    </Form>
  );
}
