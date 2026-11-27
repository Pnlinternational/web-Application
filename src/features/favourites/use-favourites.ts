import { skipToken, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createIdempotencyKey } from "@/api/idempotency";
import { useSession } from "@/features/auth/queries";
import type { User } from "@/features/auth/schemas";
import { guestFavourites, insertFavourite, useGuestFavourites } from "./guest-store";
import { favouriteKeys } from "./query-keys";
import type { Favourite } from "./schemas";
import { getFavouritesService } from "./services";

export interface FavouritesStore {
  items: readonly Favourite[];
  status: "pending" | "error" | "success";
  error: unknown;
  /** True when the list on screen is cached and the last refresh failed. */
  refetchFailed: boolean;
  refetch: () => void;
  isFavourite: (productId: string) => boolean;
  /** Optimistic; `index` puts it back where it was (Undo). */
  add: (item: Favourite, index?: number) => void;
  /** Optimistic; the item comes back if the request fails, and `onError` runs. */
  remove: (productId: string, options?: { onError?: () => void }) => void;
}

function useAccountFavourites(user: User | undefined) {
  const queryClient = useQueryClient();
  const key = favouriteKeys.list(user?.id ?? "guest");
  const query = useQuery({
    queryKey: key,
    queryFn: user ? () => getFavouritesService(user).list() : skipToken,
  });

  async function snapshot() {
    await queryClient.cancelQueries({ queryKey: key });
    return queryClient.getQueryData<Favourite[]>(key);
  }

  function restore(previous: Favourite[] | undefined) {
    if (previous) queryClient.setQueryData(key, previous);
  }

  const add = useMutation({
    mutationFn: ({
      item,
      idempotencyKey,
    }: {
      item: Favourite;
      index?: number;
      idempotencyKey: string;
    }) => getFavouritesService(user as User).add(item, idempotencyKey),
    onMutate: async ({ item, index }) => {
      const previous = await snapshot();
      queryClient.setQueryData<Favourite[]>(key, (items = []) =>
        insertFavourite(items, item, index),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => restore(context?.previous),
  });

  const remove = useMutation({
    mutationFn: ({ productId, idempotencyKey }: { productId: string; idempotencyKey: string }) =>
      getFavouritesService(user as User).remove(productId, idempotencyKey),
    onMutate: async ({ productId }) => {
      const previous = await snapshot();
      queryClient.setQueryData<Favourite[]>(key, (items = []) =>
        items.filter((item) => item.productId !== productId),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => restore(context?.previous),
  });

  return { query, add, remove };
}

/**
 * The one favourites store: the account's list when signed in, this browser's list for guests.
 * Product hearts and the Favourites page both use it.
 */
export function useFavourites(): FavouritesStore {
  const session = useSession();
  const user = session.data ?? undefined;
  const guestItems = useGuestFavourites();
  const account = useAccountFavourites(user);

  if (!user) {
    return {
      items: guestItems,
      status: session.isPending ? "pending" : "success",
      error: null,
      refetchFailed: false,
      refetch: () => undefined,
      isFavourite: (productId) => guestItems.some((item) => item.productId === productId),
      add: (item, index) =>
        guestFavourites.write(insertFavourite(guestFavourites.read(), item, index)),
      remove: (productId) =>
        guestFavourites.write(
          guestFavourites.read().filter((item) => item.productId !== productId),
        ),
    };
  }

  const items = account.query.data ?? [];
  return {
    items,
    status: account.query.status,
    error: account.query.error,
    refetchFailed: account.query.isRefetchError,
    refetch: () => void account.query.refetch(),
    isFavourite: (productId) => items.some((item) => item.productId === productId),
    add: (item, index) =>
      account.add.mutate({ item, index, idempotencyKey: createIdempotencyKey() }),
    remove: (productId, options) =>
      account.remove.mutate(
        { productId, idempotencyKey: createIdempotencyKey() },
        { onError: options?.onError },
      ),
  };
}
