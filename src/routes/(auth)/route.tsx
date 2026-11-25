import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { sessionQueryOptions } from "@/features/auth/queries";
import { redirectSearchSchema } from "@/features/auth/schemas";

// Guest-only pages. Signed-in users are sent back where they came from.
// Each page renders its own AuthScreen (navy header/panel + form sheet).
export const Route = createFileRoute("/(auth)")({
  validateSearch: redirectSearchSchema,
  beforeLoad: async ({ context, search }) => {
    const user = await context.queryClient.query({ ...sessionQueryOptions(), staleTime: "static" });
    if (user) {
      throw redirect({ href: search.redirect ?? "/account" });
    }
  },
  component: Outlet,
});
