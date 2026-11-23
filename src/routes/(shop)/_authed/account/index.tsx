import { createFileRoute, Link } from "@tanstack/react-router";
import { createIdempotencyKey } from "@/api/idempotency";
import { Button } from "@hackert-ui/ui";
import { DevicesSection } from "@/features/auth/components/devices-section";
import { useLogoutMutation } from "@/features/auth/mutations";

export const Route = createFileRoute("/(shop)/_authed/account/")({
  head: () => ({ meta: [{ title: "Account — PNL Store" }] }),
  component: AccountPage,
});

function AccountPage() {
  const { user } = Route.useRouteContext();
  const logout = useLogoutMutation();

  return (
    <div className="flex max-w-xl flex-col items-start gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Your account</h1>
        <p className="text-sm text-muted-foreground">{user.phone}</p>
      </div>
      <DevicesSection />
      <Link to="/account/orders" className="text-sm font-medium text-accent">
        View your orders
      </Link>
      <Button
        variant="secondary"
        loading={logout.isPending}
        onClick={() => logout.mutate(createIdempotencyKey())}
      >
        Sign out
      </Button>
    </div>
  );
}
