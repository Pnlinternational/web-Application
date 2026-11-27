import { createFileRoute } from "@tanstack/react-router";
import { AccountOverview } from "@/features/account/components/overview";
import { GuestAccount } from "@/features/account/components/guest-account";
import { useSession } from "@/features/auth/queries";

export const Route = createFileRoute("/(account)/account/")({
  head: () => ({ meta: [{ title: "Account — PNL Store" }] }),
  staticData: { account: { title: "Overview", mobileBar: "tabs", overview: true } },
  component: AccountPage,
});

// The layout handles loading/failed session checks; here it is a user or null.
function AccountPage() {
  const { data: user } = useSession();
  return user ? <AccountOverview user={user} /> : <GuestAccount />;
}
