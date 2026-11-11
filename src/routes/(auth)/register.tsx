import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { RegisterForm } from "@/features/auth/components/register-form";

export const Route = createFileRoute("/(auth)/register")({
  head: () => ({ meta: [{ title: "Create account — PNL Store" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const router = useRouter();
  const { redirect } = Route.useSearch();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">Create your account</h1>
      <RegisterForm onSuccess={() => router.navigate({ href: redirect ?? "/account" })} />
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" search={{ redirect }} className="font-medium text-accent">
          Sign in
        </Link>
      </p>
    </div>
  );
}
