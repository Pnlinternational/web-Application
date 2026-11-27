import { createFileRoute } from "@tanstack/react-router";
import { SecuritySettings } from "@/features/account/components/security";

export const Route = createFileRoute("/(account)/account/_authed/security")({
  head: () => ({ meta: [{ title: "Password and security — PNL Store" }] }),
  staticData: { account: { title: "Password and security", mobileBar: "back" } },
  component: SecurityPage,
});

function SecurityPage() {
  const { user } = Route.useRouteContext();
  return <SecuritySettings user={user} />;
}
