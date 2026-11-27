import { Link } from "@tanstack/react-router";
import { Icon } from "@/components/icons/icon";
import type { User } from "@/features/auth/schemas";
import { cn } from "@/lib/cn";
import { useUnreadCount } from "../queries";

/** Header bell with an unread dot; the label carries the count. */
export function NotificationBell({ user, className }: { user: User; className?: string }) {
  const { data: unread = 0 } = useUnreadCount(user);

  return (
    <Link
      to="/account/notifications"
      aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
      className={cn(
        "relative grid size-11 place-items-center rounded-sm text-ink transition-colors duration-150 ease-out hover-pointer:bg-surface",
        className,
      )}
    >
      <Icon name="bell" />
      {unread > 0 ? (
        <span
          aria-hidden="true"
          className="absolute top-2.5 right-2.75 size-2.5 rounded-full border-2 border-card bg-danger"
        />
      ) : null}
    </Link>
  );
}
