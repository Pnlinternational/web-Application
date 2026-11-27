import type { User } from "@/features/auth/schemas";
import { clone, mockDb, mockLatency } from "@/features/account/mock-backend";
import { insertFavourite } from "./guest-store";
import type { Favourite } from "./schemas";

export interface FavouritesService {
  list(): Promise<Favourite[]>;
  add(item: Favourite, idempotencyKey: string): Promise<void>;
  remove(productId: string, idempotencyKey: string): Promise<void>;
  /** Adds a guest's favourites to the account, skipping ones already there; returns the list. */
  merge(items: readonly Favourite[], idempotencyKey: string): Promise<Favourite[]>;
}

// No favourites endpoints yet: served by the in-memory mock.
export function getFavouritesService(user: User): FavouritesService {
  return {
    async list() {
      await mockLatency();
      return clone(mockDb(user).favourites);
    },
    async add(item) {
      await mockLatency();
      const db = mockDb(user);
      db.favourites = insertFavourite(db.favourites, clone(item));
    },
    async remove(productId) {
      await mockLatency();
      const db = mockDb(user);
      db.favourites = db.favourites.filter((item) => item.productId !== productId);
    },
    async merge(items) {
      await mockLatency();
      const db = mockDb(user);
      const known = new Set(db.favourites.map((item) => item.productId));
      const added = items.filter((item) => !known.has(item.productId));
      db.favourites = [...clone(added), ...db.favourites];
      return clone(db.favourites);
    },
  };
}
