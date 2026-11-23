import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { LoginForm } from "@/features/auth/components/login-form";
import { VerifyCodeForm } from "@/features/auth/components/verify-code-form";
import {
  useLoginMutation,
  useResendCodeMutation,
  useVerifyLoginMutation,
} from "@/features/auth/mutations";
import type { OtpChallenge } from "@/features/auth/schemas";

export const Route = createFileRoute("/(auth)/login")({
  head: () => ({ meta: [{ title: "Sign in — PNL Store" }] }),
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const { redirect } = Route.useSearch();
  const login = useLoginMutation();
  const verify = useVerifyLoginMutation();
  const resend = useResendCodeMutation();
  // Local on purpose: a reload or back navigation starts over at the credentials.
  const [challenge, setChallenge] = useState<OtpChallenge>();

  function goToDestination() {
    return router.navigate({ href: redirect ?? "/account" });
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
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
          onSuccess={goToDestination}
          onStartAgain={() => setChallenge(undefined)}
          submitLabel="Sign in"
        />
      ) : (
        <LoginForm
          onLogin={login.mutateAsync}
          onSuccess={(result) =>
            result.kind === "code_sent" ? setChallenge(result.challenge) : goToDestination()
          }
        />
      )}
      <div className="flex justify-between text-sm">
        <Link to="/forgot-password" className="text-muted-foreground hover-pointer:text-foreground">
          Forgot password?
        </Link>
        <Link to="/register" search={{ redirect }} className="font-medium text-accent">
          Create account
        </Link>
      </div>
    </div>
  );
}
