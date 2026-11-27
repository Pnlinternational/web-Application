import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { createIdempotencyKey } from "@/api/idempotency";
import { useSession } from "@/features/auth/queries";
import { logger } from "@/lib/logger";
import { guestFavourites, useGuestFavourites } from "../guest-store";
import { favouriteKeys } from "../query-keys";
import { getFavouritesService } from "../services";

/**
 * After sign-in, moves a guest's browser favourites into the account (the server skips
 * duplicates). The browser list is cleared only once the merge succeeds, so a failure retries
 * on the next visit. Renders nothing; mounted by the customer layouts.
 */
export function FavouritesSync() {
  const user = useSession().data;
  const guestItems = useGuestFavourites();
  const queryClient = useQueryClient();
  const merging = useRef(false);

  useEffect(() => {
    if (!user || guestItems.length === 0 || merging.current) return;
    merging.current = true;
    getFavouritesService(user)
      .merge(guestItems, createIdempotencyKey())
      .then((items) => {
        queryClient.setQueryData(favouriteKeys.list(user.id), items);
        guestFavourites.clear();
      })
      .catch((error: unknown) => logger.warn("Could not merge guest favourites", { error }))
      .finally(() => {
        merging.current = false;
      });
  }, [user, guestItems, queryClient]);

  return null;
}
