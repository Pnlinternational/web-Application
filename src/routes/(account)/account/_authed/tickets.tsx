import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/features/account/components/coming-soon";

// Placeholder: linked from the Account area; the feature isn't built yet.
export const Route = createFileRoute("/(account)/account/_authed/tickets")({
  head: () => ({ meta: [{ title: "Support tickets — PNL Store" }] }),
  staticData: { account: { title: "Support tickets", mobileBar: "back" } },
  component: () => (
    <ComingSoon
      title="Support tickets"
      message="You'll be able to see your support tickets here soon."
    />
  ),
});
