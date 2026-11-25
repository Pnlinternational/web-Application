import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { AuthScreen } from "@/features/auth/components/auth-screen";
import { AUTH_LINK } from "@/features/auth/components/auth-ui";
import { createClientKey } from "@/features/auth/client-key";
import { RequestResetForm } from "@/features/auth/components/reset-password-forms";
import { useRequestPasswordResetMutation } from "@/features/auth/mutations";

export const Route = createFileRoute("/(auth)/forgot-password")({
  head: () => ({ meta: [{ title: "Forgot password — PNL Store" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const router = useRouter();
  // One key per reset flow: the API ties the code check to the password change with it.
  const [clientKey] = useState(createClientKey);
  const request = useRequestPasswordResetMutation();

  return (
    <AuthScreen
      title="Forgot password?"
      subtitle="Enter the phone number on your account and we will text you a code."
      backFallback="/login"
    >
      <RequestResetForm
        onRequest={request.mutateAsync}
        onSuccess={(challenge, phone) =>
          router.navigate({
            to: "/reset-code",
            state: { authFlow: { kind: "reset", challenge, phone, clientKey } },
          })
        }
      />
      <Link to="/login" className={`${AUTH_LINK} self-center`}>
        Back to sign in
      </Link>
    </AuthScreen>
  );
}
