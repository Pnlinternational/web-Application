import { createFileRoute, Link, useLocation, useRouter } from "@tanstack/react-router";
import { AuthScreen } from "@/features/auth/components/auth-screen";
import { AUTH_LINK, AuthAlternatives, AuthNotice } from "@/features/auth/components/auth-ui";
import { AFTER_SIGN_IN_PATH } from "@/features/auth/constants";
import { LoginForm } from "@/features/auth/components/login-form";
import { useLoginMutation } from "@/features/auth/mutations";

export const Route = createFileRoute("/(auth)/login")({
  head: () => ({ meta: [{ title: "Sign in — PNL Store" }] }),
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const { redirect } = Route.useSearch();
  const notice = useLocation({ select: (location) => location.state.authNotice });
  const login = useLoginMutation();

  return (
    <AuthScreen title="Welcome back" subtitle="Sign in to track orders and check out faster.">
      <AuthNotice>{notice}</AuthNotice>
      <LoginForm
        onLogin={login.mutateAsync}
        onSuccess={(result, input) =>
          result.kind === "code_sent"
            ? router.navigate({
                to: "/verify",
                search: { redirect },
                state: {
                  authFlow: { kind: "login", challenge: result.challenge, phone: input.phone },
                },
              })
            : router.navigate({ href: redirect ?? AFTER_SIGN_IN_PATH })
        }
        passwordHelp={
          <Link to="/forgot-password" className={`${AUTH_LINK} text-label`}>
            Forgot password?
          </Link>
        }
      />
      <AuthAlternatives
        switchPrompt="Don't have an account?"
        switchLink={
          <Link to="/signup" search={{ redirect }} className={`${AUTH_LINK} font-bold`}>
            Sign up
          </Link>
        }
      />
    </AuthScreen>
  );
}
