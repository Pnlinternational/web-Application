import dayjs from "dayjs";
import { describe, expect, it } from "vite-plus/test";
import { groupByDay, notificationTime } from "./grouping";
import type { AppNotification } from "./schemas";

// Local time on purpose: grouping follows the device's time zone.
const now = dayjs("2026-11-26T09:00:00").valueOf();

function note(id: string, createdAt: string): AppNotification {
  return {
    id,
    group: "orders",
    title: id,
    body: "",
    createdAt: dayjs(createdAt).toISOString(),
    read: false,
    destination: { kind: "unknown" },
  };
}

describe("groupByDay", () => {
  it("splits at local midnight into Today and Earlier", () => {
    const sections = groupByDay(
      [
        note("this-morning", "2026-11-26T00:05:00"),
        note("late-last-night", "2026-11-25T23:55:00"),
        note("last-week", "2026-11-19T12:00:00"),
      ],
      now,
    );

    expect(
      sections.map((section) => [section.title, section.items.map((item) => item.id)]),
    ).toEqual([
      ["Today", ["this-morning"]],
      ["Earlier", ["late-last-night", "last-week"]],
    ]);
  });

  it("drops empty sections", () => {
    expect(
      groupByDay([note("old", "2026-10-01T12:00:00")], now).map((section) => section.title),
    ).toEqual(["Earlier"]);
  });
});

describe("notificationTime", () => {
  it("is relative today, then Yesterday, then a date", () => {
    expect(notificationTime(dayjs("2026-11-26T08:48:00").toISOString(), now)).toBe(
      "12 minutes ago",
    );
    expect(notificationTime(dayjs("2026-11-25T08:00:00").toISOString(), now)).toBe("Yesterday");
    expect(notificationTime(dayjs("2026-11-02T08:00:00").toISOString(), now)).toBe("2 Nov");
  });
});
