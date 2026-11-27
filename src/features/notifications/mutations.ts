import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Idempotent } from "@/api/idempotency";
import type { User } from "@/features/auth/schemas";
import { notificationKeys } from "./query-keys";
import type { AppNotification } from "./schemas";
import { getNotificationsService } from "./services";

// Reading is optimistic so the dot and the header bell update at once; the server's
// state is refetched afterwards either way.
function useOptimisticRead(user: User) {
  const queryClient = useQueryClient();
  const listKey = notificationKeys.list(user.id);
  const countKey = notificationKeys.unreadCount(user.id);

  /** `isTarget` picks what becomes read; `countWithoutList` updates the bell when no list is cached. */
  async function apply(
    isTarget: (item: AppNotification) => boolean,
    countWithoutList: (count: number) => number,
  ) {
    await queryClient.cancelQueries({ queryKey: notificationKeys.all(user.id) });
    const previous = {
      list: queryClient.getQueryData<AppNotification[]>(listKey),
      count: queryClient.getQueryData<number>(countKey),
    };
    if (previous.list) {
      const list = previous.list.map((item) => (isTarget(item) ? { ...item, read: true } : item));
      queryClient.setQueryData(listKey, list);
      queryClient.setQueryData(countKey, list.filter((item) => !item.read).length);
    } else if (previous.count !== undefined) {
      queryClient.setQueryData(countKey, countWithoutList(previous.count));
    }
    return previous;
  }

  function rollback(previous: { list?: AppNotification[]; count?: number } | undefined) {
    if (previous?.list) queryClient.setQueryData(listKey, previous.list);
    if (previous?.count !== undefined) queryClient.setQueryData(countKey, previous.count);
  }

  function settle() {
    return queryClient.invalidateQueries({ queryKey: notificationKeys.all(user.id) });
  }

  return { apply, rollback, settle };
}

export function useMarkReadMutation(user: User) {
  const optimistic = useOptimisticRead(user);

  return useMutation({
    mutationFn: ({ data, idempotencyKey }: Idempotent<{ id: string }>) =>
      getNotificationsService(user).markRead(data.id, idempotencyKey),
    onMutate: ({ data }) =>
      optimistic.apply(
        (item) => item.id === data.id,
        (count) => Math.max(0, count - 1),
      ),
    onError: (_error, _variables, previous) => optimistic.rollback(previous),
    onSettled: optimistic.settle,
  });
}

export function useMarkAllReadMutation(user: User) {
  const optimistic = useOptimisticRead(user);

  return useMutation({
    mutationFn: (idempotencyKey: string) =>
      getNotificationsService(user).markAllRead(idempotencyKey),
    onMutate: () =>
      optimistic.apply(
        () => true,
        () => 0,
      ),
    onError: (_error, _key, previous) => optimistic.rollback(previous),
    onSettled: optimistic.settle,
  });
}
