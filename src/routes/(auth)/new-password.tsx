import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { AuthScreen } from "@/features/auth/components/auth-screen";
import { NewPasswordForm } from "@/features/auth/components/reset-password-forms";
import { useCompletePasswordResetMutation } from "@/features/auth/mutations";
import type { ResetCompleteResult } from "@/features/auth/services";
import { DATE_TIME_FORMAT, formatDate } from "@/lib/format";
import { formatE164 } from "@/lib/phone";

export const Route = createFileRoute("/(auth)/new-password")({
  head: () => ({ meta: [{ title: "Set a new password — PNL Store" }] }),
  beforeLoad: ({ location }) => {
    const flow = location.state.authFlow;
    if (flow?.kind !== "reset-granted") throw redirect({ to: "/forgot-password" });
    return { flow };
  },
  component: NewPasswordPage,
});

function noticeFor(result: ResetCompleteResult) {
  return result.kind === "held"
    ? `For your security, your new password applies on ${formatDate(result.appliesAt, DATE_TIME_FORMAT)}. Until then, keep using your current password.`
    : "Password updated. Sign in with your new password.";
}

function NewPasswordPage() {
  const router = useRouter();
  const { flow } = Route.useRouteContext();
  const complete = useCompletePasswordResetMutation();

  return (
    <AuthScreen
      title="Set a new password"
      subtitle={`Choose a new password for ${formatE164(flow.phone)}.`}
      backFallback="/forgot-password"
    >
      <NewPasswordForm
        onComplete={({ data, idempotencyKey }) =>
          complete.mutateAsync({
            data: { clientKey: flow.clientKey, password: data.password },
            idempotencyKey,
          })
        }
        onSuccess={(result) =>
          router.navigate({ to: "/login", replace: true, state: { authNotice: noticeFor(result) } })
        }
      />
    </AuthScreen>
  );
}
