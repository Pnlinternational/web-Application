import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { sessionQueryOptions } from "@/features/auth/queries";

// Customer-only area (account, checkout). Guests go to /login and come back afterwards.
export const Route = createFileRoute("/(shop)/_authed")({
  beforeLoad: async ({ context, location }) => {
    const user = await context.queryClient.query({ ...sessionQueryOptions(), staleTime: "static" });
    if (!user) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
    return { user };
  },
  component: Outlet,
});
