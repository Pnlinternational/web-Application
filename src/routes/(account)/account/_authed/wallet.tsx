import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/features/account/components/coming-soon";

// Placeholder: linked from the Account area; the feature isn't built yet.
export const Route = createFileRoute("/(account)/account/_authed/wallet")({
  head: () => ({ meta: [{ title: "Wallet — PNL Store" }] }),
  staticData: { account: { title: "Wallet", mobileBar: "back" } },
  component: () => (
    <ComingSoon title="Wallet" message="Top-ups and wallet history are coming soon." />
  ),
});
