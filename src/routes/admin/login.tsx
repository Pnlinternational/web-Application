import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { Brand } from "@/components/layout/brand";
import { useAdminLoginMutation } from "@/features/admin-auth/mutations";
import { adminSessionQueryOptions } from "@/features/admin-auth/queries";
import { LoginForm } from "@/features/auth/components/login-form";
import { redirectSearchSchema } from "@/features/auth/schemas";

export const Route = createFileRoute("/admin/login")({
  validateSearch: redirectSearchSchema,
  beforeLoad: async ({ context, search }) => {
    const admin = await context.queryClient.query({
      ...adminSessionQueryOptions(),
      staleTime: "static",
    });
    if (admin) {
      throw redirect({ href: search.redirect ?? "/admin" });
    }
  },
  head: () => ({ meta: [{ title: "Admin sign in — PNL Store" }] }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const router = useRouter();
  const { redirect: redirectTo } = Route.useSearch();
  const login = useAdminLoginMutation();

  return (
    <div className="grid min-h-dvh place-items-center bg-muted/40 px-4">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="text-center">
          <Brand to="/admin" />
          <p className="mt-1 text-sm text-muted-foreground">Admin</p>
        </div>
        <div className="rounded-lg border border-border bg-background p-6 shadow-sm">
          <LoginForm
            onLogin={login.mutateAsync}
            onSuccess={() => router.navigate({ href: redirectTo ?? "/admin" })}
          />
        </div>
      </div>
    </div>
  );
}
