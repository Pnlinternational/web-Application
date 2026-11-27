import { useNavigate } from "@tanstack/react-router";
import { useId } from "react";
import { createIdempotencyKey, withIdempotencyKey } from "@/api/idempotency";
import { Icon } from "@/components/icons/icon";
import { EmptyState } from "@/components/ui/empty-state";
import { StaleNote } from "@/components/ui/stale-note";
import { Tabs } from "@/components/ui/tabs";
import type { User } from "@/features/auth/schemas";
import { cn } from "@/lib/cn";
import { destinationLink } from "../destinations";
import { groupByDay, notificationTime } from "../grouping";
import { useMarkAllReadMutation, useMarkReadMutation } from "../mutations";
import { useNotifications } from "../queries";
import { type AppNotification, NOTIFICATION_GROUPS, type NotificationGroup } from "../schemas";

export type NotificationTab = "all" | NotificationGroup;

export const NOTIFICATION_TABS: readonly { id: NotificationTab; label: string }[] = [
  { id: "all", label: "All" },
  ...NOTIFICATION_GROUPS.map(({ id, label }) => ({ id, label })),
];

const GROUP = Object.fromEntries(NOTIFICATION_GROUPS.map((group) => [group.id, group])) as Record<
  NotificationGroup,
  (typeof NOTIFICATION_GROUPS)[number]
>;

function NotificationRow({
  item,
  now,
  onOpen,
}: {
  item: AppNotification;
  now: number;
  onOpen: () => void;
}) {
  const group = GROUP[item.group];
  const time = notificationTime(item.createdAt, now);

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${item.read ? "" : "Unread. "}${item.title}. ${item.body}. ${time}`}
      className={cn(
        "flex w-full items-start gap-3 border-t border-tint px-4 py-3.5 text-left text-ink transition-colors duration-150 ease-out first:border-t-0 hover-pointer:bg-surface",
        item.read ? "bg-surface/40" : "bg-card",
      )}
    >
      <span
        aria-hidden="true"
        className="grid size-10 shrink-0 place-items-center rounded-md bg-tint text-primary"
      >
        <Icon name={group.icon} size={20} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={cn("text-body-sm", item.read ? "font-medium" : "font-semibold")}>
          {item.title}
        </span>
        <span className="text-label font-normal text-muted">{item.body}</span>
        <span className="text-meta font-normal text-muted">
          {group.label}, {time}
        </span>
      </span>
      {item.read ? null : (
        <span
          aria-hidden="true"
          data-testid="unread-dot"
          className="mt-1.5 size-2.25 shrink-0 rounded-full bg-danger"
        />
      )}
    </button>
  );
}

interface NotificationsCenterProps {
  user: User;
  tab: NotificationTab;
  onTabChange: (tab: NotificationTab) => void;
  /** Injectable for tests; the device clock otherwise. */
  now?: number;
}

/**
 * Notifications by group tab, then Today / Earlier. Tapping a row marks it read and opens its
 * destination; "Mark all read" covers every group and updates the header bell at once.
 */
export function NotificationsCenter({
  user,
  tab,
  onTabChange,
  now = Date.now(),
}: NotificationsCenterProps) {
  const panelId = useId();
  const navigate = useNavigate();
  const { data: items, isRefetchError } = useNotifications(user);
  const markRead = useMarkReadMutation(user);
  const markAll = useMarkAllReadMutation(user);

  const shown = items.filter((item) => tab === "all" || item.group === tab);
  const sections = groupByDay(shown, now);
  const hasUnread = items.some((item) => !item.read);
  const tabLabel = NOTIFICATION_TABS.find((item) => item.id === tab)?.label ?? "All";

  function open(item: AppNotification) {
    if (!item.read) markRead.mutate(withIdempotencyKey({ id: item.id }));
    const link = destinationLink(item.destination);
    if (link) void navigate(link);
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Tabs
          label="Notification groups"
          tabs={NOTIFICATION_TABS}
          value={tab}
          onChange={onTabChange}
          panelId={panelId}
          className="min-w-0 flex-1"
        />
        {hasUnread ? (
          <button
            type="button"
            disabled={markAll.isPending}
            onClick={() => markAll.mutate(createIdempotencyKey())}
            className="inline-flex h-11 shrink-0 items-center rounded-sm px-2 text-label text-primary hover-pointer:underline disabled:opacity-60"
          >
            Mark all read
          </button>
        ) : null}
      </div>
      <div role="tabpanel" id={panelId} aria-label={tabLabel} className="flex flex-col gap-4">
        {sections.length === 0 ? (
          <EmptyState
            icon={<Icon name="bell" size={40} />}
            title={
              tab === "all" ? "No notifications yet" : `No ${tabLabel.toLowerCase()} notifications`
            }
            message="We'll let you know here when something changes."
          />
        ) : (
          sections.map((section) => (
            <section
              key={section.title}
              aria-labelledby={`${panelId}-${section.title}`}
              className="flex flex-col gap-2"
            >
              <h2 id={`${panelId}-${section.title}`} className="mt-1 text-section-sm">
                {section.title}
              </h2>
              <div className="overflow-hidden rounded-xl bg-card">
                {section.items.map((item) => (
                  <NotificationRow key={item.id} item={item} now={now} onOpen={() => open(item)} />
                ))}
              </div>
            </section>
          ))
        )}
        <StaleNote refetchFailed={isRefetchError} />
      </div>
    </>
  );
}
