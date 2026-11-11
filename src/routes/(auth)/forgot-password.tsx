import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/(auth)/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — PNL Store" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold tracking-tight">Reset your password</h1>
      <p className="text-sm text-muted-foreground">Password reset isn't available yet.</p>
      <Link to="/login" className="text-sm font-medium text-accent">
        Back to sign in
      </Link>
    </div>
  );
}
