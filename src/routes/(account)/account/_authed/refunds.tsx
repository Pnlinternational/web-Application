import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/features/account/components/coming-soon";

// Placeholder: linked from the Account area; the feature isn't built yet.
export const Route = createFileRoute("/(account)/account/_authed/refunds")({
  head: () => ({ meta: [{ title: "Refunds — PNL Store" }] }),
  staticData: { account: { title: "Refunds", mobileBar: "back" } },
  component: () => (
    <ComingSoon title="Refunds" message="You'll be able to track refunds here soon." />
  ),
});
