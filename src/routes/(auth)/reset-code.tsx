import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { AuthScreen } from "@/features/auth/components/auth-screen";
import { AUTH_LINK } from "@/features/auth/components/auth-ui";
import { VerifyCodeForm } from "@/features/auth/components/verify-code-form";
import { useResendCodeMutation, useVerifyPasswordResetMutation } from "@/features/auth/mutations";
import { useGoBack } from "@/features/auth/use-go-back";
import { formatE164 } from "@/lib/phone";

export const Route = createFileRoute("/(auth)/reset-code")({
  head: () => ({ meta: [{ title: "Enter your code — PNL Store" }] }),
  beforeLoad: ({ location }) => {
    const flow = location.state.authFlow;
    if (flow?.kind !== "reset") throw redirect({ to: "/forgot-password" });
    return { flow };
  },
  component: ResetCodePage,
});

function ResetCodePage() {
  const router = useRouter();
  const { flow } = Route.useRouteContext();
  const goBack = useGoBack("/forgot-password");
  const verify = useVerifyPasswordResetMutation();
  const resend = useResendCodeMutation();
  const [needsSupport, setNeedsSupport] = useState(false);
  const challengeId = flow.challenge.challenge_id;

  if (needsSupport) {
    return (
      <AuthScreen
        title="We can't reset this account online"
        subtitle="This account has been inactive for a while. Please contact support to recover it."
        backFallback="/login"
      >
        <Link to="/login" className={`${AUTH_LINK} self-center`}>
          Back to sign in
        </Link>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title="Enter your code"
      subtitle={`We sent a 6-digit code to ${formatE164(flow.phone)}.`}
      backFallback="/forgot-password"
    >
      <VerifyCodeForm
        resendAfter={flow.challenge.resend_after}
        submitLabel="Continue"
        onVerify={({ data, idempotencyKey }) =>
          verify.mutateAsync({
            data: { challengeId, code: data.code, clientKey: flow.clientKey },
            idempotencyKey,
          })
        }
        onResend={(idempotencyKey) => resend.mutateAsync({ data: { challengeId }, idempotencyKey })}
        onSuccess={(granted) =>
          granted.next === "set_password"
            ? router.navigate({
                to: "/new-password",
                replace: true,
                state: {
                  authFlow: { kind: "reset-granted", phone: flow.phone, clientKey: flow.clientKey },
                },
              })
            : setNeedsSupport(true)
        }
        onChangePhone={goBack}
      />
    </AuthScreen>
  );
}
