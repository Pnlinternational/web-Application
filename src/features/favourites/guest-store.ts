import { useSyncExternalStore } from "react";
import { z } from "zod";
import { createPersistedValue } from "@/lib/storage";
import { type Favourite, favouriteSchema } from "./schemas";

// A guest's favourites live in this browser until they sign in (then FavouritesSync merges them).
const stored = createPersistedValue({
  key: "pnl.favourites",
  version: 1,
  schema: z.array(favouriteSchema),
});
const listeners = new Set<() => void>();
// One array per change, so useSyncExternalStore sees a stable snapshot between writes.
let snapshot: Favourite[] | null = null;

function read() {
  snapshot ??= stored.read() ?? [];
  return snapshot;
}

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const guestFavourites = {
  read,
  write(items: Favourite[]) {
    snapshot = items;
    stored.write(items);
    emit();
  },
  clear() {
    snapshot = [];
    stored.clear();
    emit();
  },
  /** Tests: forget the in-memory copy so the next read comes from storage. */
  reload() {
    snapshot = null;
    emit();
  },
};

export function useGuestFavourites() {
  return useSyncExternalStore(subscribe, read);
}

/** Insert at `index` (Undo puts an item back where it was), without duplicates. */
export function insertFavourite(items: readonly Favourite[], item: Favourite, index = 0) {
  const rest = items.filter((existing) => existing.productId !== item.productId);
  return [...rest.slice(0, index), item, ...rest.slice(index)];
}
