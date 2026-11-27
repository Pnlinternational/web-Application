import type { NavigateOptions } from "@tanstack/react-router";
import type { NotificationDestination } from "./schemas";

// Where each notification kind opens. Orders, wallet and tickets have no detail pages yet, so
// they open their list/placeholder pages. `unknown` returns null: the row is only marked read.
export function destinationLink(destination: NotificationDestination): NavigateOptions | null {
  switch (destination.kind) {
    case "order":
      return { to: "/account/orders" };
    case "wallet_transaction":
      return { to: "/account/wallet" };
    case "ticket":
      return { to: "/account/tickets" };
    case "promotion":
      return { to: "/products" };
    case "product":
      return { to: "/products/$slug", params: { slug: destination.slug } };
    case "unknown":
      return null;
  }
}
