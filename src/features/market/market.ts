import { useSyncExternalStore } from "react";
import { z } from "zod";
import type { User } from "@/features/auth/schemas";
import { formatMoney, type Money } from "@/lib/currency";
import { type Market, MARKET_PHONES, MARKETS } from "@/lib/phone";
import { createPersistedValue } from "@/lib/storage";

export const MARKET_CURRENCY: Record<Market, string> = { NG: "NGN", GH: "GHS" };

/** Shop amounts as the design shows them: "₦24,500", "GH₵245.50". Always from API Money. */
export function formatPrice(money: Money) {
  return formatMoney(money, { display: "narrowSymbol", trimZeroFraction: true });
}

/** "Nigeria, NGN" (design copy). */
export function marketLabel(market: Market) {
  return `${MARKET_PHONES[market].name}, ${MARKET_CURRENCY[market]}`;
}

// A guest's "Shopping from" choice; it sets the currency they see. Signed-in users use user.market.
const storedMarket = createPersistedValue({
  key: "pnl.market",
  version: 1,
  schema: z.enum(MARKETS),
});
const DEFAULT_MARKET: Market = "NG";
const listeners = new Set<() => void>();

export function setGuestMarket(market: Market) {
  storedMarket.write(market);
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readGuestMarket() {
  return storedMarket.read() ?? DEFAULT_MARKET;
}

export function useGuestMarket() {
  return useSyncExternalStore(subscribe, readGuestMarket);
}

/** The market prices and forms use: the account's for signed-in users, else the guest's choice. */
export function useMarket(user: User | null | undefined) {
  const guestMarket = useGuestMarket();
  return user ? user.market : guestMarket;
}
