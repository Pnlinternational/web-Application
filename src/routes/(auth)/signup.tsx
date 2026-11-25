import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { AuthScreen } from "@/features/auth/components/auth-screen";
import { AUTH_LINK, AuthAlternatives } from "@/features/auth/components/auth-ui";
import { SignupForm } from "@/features/auth/components/signup-form";

export const Route = createFileRoute("/(auth)/signup")({
  head: () => ({ meta: [{ title: "Create account — PNL Store" }] }),
  component: SignupPage,
});

function SignupPage() {
  const router = useRouter();
  const { redirect } = Route.useSearch();

  return (
    <AuthScreen
      title="Create your account"
      subtitle="Shop global stores and pay in naira or cedis."
    >
      <SignupForm
        onSuccess={(challenge, phone) =>
          router.navigate({
            to: "/verify",
            search: { redirect },
            state: { authFlow: { kind: "signup", challenge, phone } },
          })
        }
        phoneTakenAction={
          <Link
            to="/login"
            search={{ redirect }}
            className="text-caption font-bold text-danger-ink underline"
          >
            Sign in
          </Link>
        }
      />
      <AuthAlternatives
        switchPrompt="Already have an account?"
        switchLink={
          <Link to="/login" search={{ redirect }} className={`${AUTH_LINK} font-bold`}>
            Sign in
          </Link>
        }
      />
    </AuthScreen>
  );
}
