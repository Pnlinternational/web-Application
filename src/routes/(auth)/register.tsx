import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { RegisterForm } from "@/features/auth/components/register-form";
import { VerifyCodeForm } from "@/features/auth/components/verify-code-form";
import { useResendCodeMutation, useVerifySignupMutation } from "@/features/auth/mutations";
import type { OtpChallenge } from "@/features/auth/schemas";

export const Route = createFileRoute("/(auth)/register")({
  head: () => ({ meta: [{ title: "Create account — PNL Store" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const router = useRouter();
  const { redirect } = Route.useSearch();
  const verify = useVerifySignupMutation();
  const resend = useResendCodeMutation();
  const [challenge, setChallenge] = useState<OtpChallenge>();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">
        {challenge ? "Verify your phone" : "Create your account"}
      </h1>
      {challenge ? (
        <VerifyCodeForm
          resendAfter={challenge.resend_after}
          onVerify={({ data, idempotencyKey }) =>
            verify.mutateAsync({
              data: { challengeId: challenge.challenge_id, code: data.code },
              idempotencyKey,
            })
          }
          onResend={(idempotencyKey) =>
            resend.mutateAsync({ data: { challengeId: challenge.challenge_id }, idempotencyKey })
          }
          onSuccess={() => router.navigate({ href: redirect ?? "/account" })}
          onStartAgain={() => setChallenge(undefined)}
          submitLabel="Create account"
        />
      ) : (
        <RegisterForm onSuccess={setChallenge} />
      )}
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" search={{ redirect }} className="font-medium text-accent">
          Sign in
        </Link>
      </p>
    </div>
  );
}
