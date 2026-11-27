import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/features/account/components/coming-soon";

// Placeholder: linked from the Account area; the feature isn't built yet.
export const Route = createFileRoute("/(account)/account/_authed/phone")({
  head: () => ({ meta: [{ title: "Change phone number — PNL Store" }] }),
  staticData: {
    account: { title: "Change phone number", mobileBar: "back", backTo: "/account/profile" },
  },
  component: () => (
    <ComingSoon
      title="Change phone number"
      message="Changing your number needs a code sent to the new number. This is coming soon."
    />
  ),
});
