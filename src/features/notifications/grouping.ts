import { formatDate, formatRelative, isToday, isYesterday } from "@/lib/format";
import type { AppNotification } from "./schemas";

export interface DaySection {
  title: "Today" | "Earlier";
  items: AppNotification[];
}

/** Today / Earlier in the device's time zone; empty sections are dropped. Keeps list order. */
export function groupByDay(items: readonly AppNotification[], now: number = Date.now()) {
  const today: AppNotification[] = [];
  const earlier: AppNotification[] = [];
  for (const item of items) (isToday(item.createdAt, now) ? today : earlier).push(item);
  const sections: DaySection[] = [
    { title: "Today", items: today },
    { title: "Earlier", items: earlier },
  ];
  return sections.filter((section) => section.items.length > 0);
}

/** "12 minutes ago" today, "Yesterday", then "2 Nov". */
export function notificationTime(createdAt: string, now: number = Date.now()) {
  if (isToday(createdAt, now)) return formatRelative(createdAt, now);
  if (isYesterday(createdAt, now)) return "Yesterday";
  return formatDate(createdAt, "D MMM");
}
