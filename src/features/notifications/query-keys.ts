export const notificationKeys = {
  all: (userId: string) => ["notifications", userId] as const,
  list: (userId: string) => [...notificationKeys.all(userId), "list"] as const,
  unreadCount: (userId: string) => [...notificationKeys.all(userId), "unread-count"] as const,
};
