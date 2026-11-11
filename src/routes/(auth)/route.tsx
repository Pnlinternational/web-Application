import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Brand } from "@/components/layout/brand";
import { sessionQueryOptions } from "@/features/auth/queries";
import { redirectSearchSchema } from "@/features/auth/schemas";

// Guest-only pages. Signed-in users are sent back where they came from.
export const Route = createFileRoute("/(auth)")({
  validateSearch: redirectSearchSchema,
  beforeLoad: async ({ context, search }) => {
    const user = await context.queryClient.query({ ...sessionQueryOptions(), staleTime: "static" });
    if (user) {
      throw redirect({ href: search.redirect ?? "/account" });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="grid min-h-dvh place-items-center bg-muted/40 px-4">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="text-center">
          <Brand />
        </div>
        <div className="rounded-lg border border-border bg-background p-6 shadow-sm">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
