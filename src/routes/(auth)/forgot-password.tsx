import { createFileRoute, Link } from "@tanstack/react-router";
import { ResetPasswordFlow } from "@/features/auth/components/reset-password-flow";

export const Route = createFileRoute("/(auth)/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — PNL Store" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">Reset your password</h1>
      <ResetPasswordFlow />
      <Link to="/login" className="text-sm font-medium text-accent">
        Back to sign in
      </Link>
    </div>
  );
}
