import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { AuthScreen } from "@/features/auth/components/auth-screen";
import { VerifyCodeForm } from "@/features/auth/components/verify-code-form";
import {
  useResendCodeMutation,
  useVerifyLoginMutation,
  useVerifySignupMutation,
} from "@/features/auth/mutations";
import { formatE164 } from "@/lib/phone";

// After sign-up, and after sign-in when the API asks for a code (202).
export const Route = createFileRoute("/(auth)/verify")({
  head: () => ({ meta: [{ title: "Verify your account — PNL Store" }] }),
  beforeLoad: ({ location }) => {
    const flow = location.state.authFlow;
    if (flow?.kind !== "login" && flow?.kind !== "signup") throw redirect({ to: "/login" });
    return { flow };
  },
  component: VerifyPage,
});

function VerifyPage() {
  const router = useRouter();
  const { redirect } = Route.useSearch();
  const { flow } = Route.useRouteContext();
  const verifyLogin = useVerifyLoginMutation();
  const verifySignup = useVerifySignupMutation();
  const resend = useResendCodeMutation();
  const verify = flow.kind === "login" ? verifyLogin : verifySignup;
  const challengeId = flow.challenge.challenge_id;

  return (
    <AuthScreen
      title="Verify your account"
      subtitle={`We sent a 6-digit code to ${formatE164(flow.phone)}.`}
    >
      <VerifyCodeForm
        resendAfter={flow.challenge.resend_after}
        onVerify={({ data, idempotencyKey }) =>
          verify.mutateAsync({ data: { challengeId, code: data.code }, idempotencyKey })
        }
        onResend={(idempotencyKey) => resend.mutateAsync({ data: { challengeId }, idempotencyKey })}
        onSuccess={() =>
          flow.kind === "signup"
            ? router.navigate({ to: "/verify-identity", replace: true })
            : router.navigate({ href: redirect ?? "/", replace: true })
        }
        onChangePhone={() => router.history.back()}
      />
    </AuthScreen>
  );
}
