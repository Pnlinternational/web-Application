import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { NotFound } from "@/components/errors/not-found";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { Button } from "@hackert-ui/ui";
import { createIdempotencyKey } from "@/api/idempotency";
import { useAdminLogoutMutation } from "@/features/admin-auth/mutations";
import { adminSessionQueryOptions } from "@/features/admin-auth/queries";

// Admin-only area with its own session (separate from customer auth).
export const Route = createFileRoute("/admin/_authed")({
  beforeLoad: async ({ context, location }) => {
    const admin = await context.queryClient.query({
      ...adminSessionQueryOptions(),
      staleTime: "static",
    });
    if (!admin) {
      throw redirect({ to: "/admin/login", search: { redirect: location.href } });
    }
    return { admin };
  },
  notFoundComponent: () => <NotFound homeTo="/admin" homeLabel="Back to dashboard" />,
  component: AdminLayout,
});

function AdminLayout() {
  const { admin } = Route.useRouteContext();
  const logout = useAdminLogoutMutation();

  return (
    <div className="flex min-h-dvh">
      <AdminSidebar
        footer={
          <div className="flex flex-col gap-2 text-body-sm">
            <span className="truncate text-muted">{admin.name}</span>
            <Button
              variant="primary"
              size="sm"
              radius="md"
              loading={logout.isPending}
              onClick={() => logout.mutate(createIdempotencyKey())}
            >
              Sign out
            </Button>
          </div>
        }
      />
      <main className="flex-1 overflow-x-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
