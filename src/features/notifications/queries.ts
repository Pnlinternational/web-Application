import { skipToken, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import type { User } from "@/features/auth/schemas";
import { notificationKeys } from "./query-keys";
import { getNotificationsService } from "./services";

export function useNotifications(user: User) {
  return useSuspenseQuery({
    queryKey: notificationKeys.list(user.id),
    queryFn: () => getNotificationsService(user).list(),
  });
}

/** Header bell; non-suspense so the header never waits on it. */
export function useUnreadCount(user: User | null | undefined) {
  return useQuery({
    queryKey: notificationKeys.unreadCount(user?.id ?? "guest"),
    queryFn: user ? () => getNotificationsService(user).unreadCount() : skipToken,
  });
}
