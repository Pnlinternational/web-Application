import { createFileRoute, Link } from "@tanstack/react-router";
import { createIdempotencyKey } from "@/api/idempotency";
import { Button } from "@/components/ui/button";
import { useLogoutMutation } from "@/features/auth/mutations";

export const Route = createFileRoute("/(shop)/_authed/account/")({
  head: () => ({ meta: [{ title: "Account — PNL Store" }] }),
  component: AccountPage,
});

function AccountPage() {
  const { user } = Route.useRouteContext();
  const logout = useLogoutMutation();

  return (
    <div className="flex flex-col items-start gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hi, {user.name}</h1>
        <p className="text-sm text-muted-foreground">{user.phone}</p>
      </div>
      <Link to="/account/orders" className="text-sm font-medium text-accent">
        View your orders
      </Link>
      <Button
        variant="outline"
        loading={logout.isPending}
        onClick={() => logout.mutate(createIdempotencyKey())}
      >
        Sign out
      </Button>
    </div>
  );
}
