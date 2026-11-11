import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { LoginForm } from "@/features/auth/components/login-form";
import { useLoginMutation } from "@/features/auth/mutations";

export const Route = createFileRoute("/(auth)/login")({
  head: () => ({ meta: [{ title: "Sign in — PNL Store" }] }),
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const { redirect } = Route.useSearch();
  const login = useLoginMutation();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
      <LoginForm
        onLogin={login.mutateAsync}
        onSuccess={() => router.navigate({ href: redirect ?? "/account" })}
      />
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
