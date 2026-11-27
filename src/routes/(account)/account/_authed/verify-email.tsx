import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/features/account/components/coming-soon";

// Placeholder: linked from the Account area; the feature isn't built yet.
export const Route = createFileRoute("/(account)/account/_authed/verify-email")({
  head: () => ({ meta: [{ title: "Verify email — PNL Store" }] }),
  staticData: { account: { title: "Verify email", mobileBar: "back", backTo: "/account/profile" } },
  component: () => <ComingSoon title="Verify email" message="Email verification is coming soon." />,
});
