import { createFileRoute } from "@tanstack/react-router";
import { AccountLayout } from "@/features/account/components/account-layout";

// The Account area has its own shell (design: web Account), separate from the shop header.
// Guests can open /account and /account/favourites; everything under _authed needs sign-in.
export const Route = createFileRoute("/(account)/account")({
  component: AccountLayout,
});
