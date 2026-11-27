import type { IconName } from "@/components/icons/icon";

// Live chat has no provider yet; the row stays hidden until one is wired up.
export const SHOW_LIVE_CHAT = false;

type AccountRoute =
  | "/account"
  | "/account/profile"
  | "/account/addresses"
  | "/account/favourites"
  | "/account/notifications"
  | "/account/security"
  | "/verify-identity"
  | "/help";

export interface AccountNavItem {
  label: string;
  icon: IconName;
  to: AccountRoute;
}

/** Signed-in navigation: desktop sidebar and the mobile overview's list rows. */
export const ACCOUNT_NAV: readonly AccountNavItem[] = [
  { label: "Overview", icon: "home", to: "/account" },
  { label: "Edit profile", icon: "person", to: "/account/profile" },
  { label: "Saved addresses", icon: "pin", to: "/account/addresses" },
  { label: "Favourites", icon: "heart", to: "/account/favourites" },
  { label: "Notifications", icon: "bell", to: "/account/notifications" },
  { label: "Password and security", icon: "lock", to: "/account/security" },
  { label: "Identity verification", icon: "shield", to: "/verify-identity" },
  { label: "Help and FAQs", icon: "doc", to: "/help" },
];
