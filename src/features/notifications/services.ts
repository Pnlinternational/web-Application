import type { User } from "@/features/auth/schemas";
import { clone, mockDb, mockLatency } from "@/features/account/mock-backend";
import type { AppNotification } from "./schemas";

export interface NotificationsService {
  /** Newest first. */
  list(): Promise<AppNotification[]>;
  unreadCount(): Promise<number>;
  markRead(id: string, idempotencyKey: string): Promise<void>;
  /** Every group, not only the visible tab. */
  markAllRead(idempotencyKey: string): Promise<void>;
}

// No notifications endpoints yet: served by the in-memory mock.
export function getNotificationsService(user: User): NotificationsService {
  return {
    async list() {
      await mockLatency();
      return clone(mockDb(user).notifications).toSorted((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      );
    },
    async unreadCount() {
      await mockLatency();
      return mockDb(user).notifications.filter((item) => !item.read).length;
    },
    async markRead(id) {
      await mockLatency();
      const item = mockDb(user).notifications.find((notification) => notification.id === id);
      if (item) item.read = true;
    },
    async markAllRead() {
      await mockLatency();
      for (const item of mockDb(user).notifications) item.read = true;
    },
  };
}
