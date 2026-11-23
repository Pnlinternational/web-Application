import { expect, it } from "vite-plus/test";
import { DATE_TIME_FORMAT, formatDate, formatNumber, formatRelative } from "./format";

it("formats dates in local time with dayjs templates", () => {
  expect(formatDate("2026-01-15T12:00:00")).toBe("Jan 15, 2026");
  expect(formatDate("2026-01-15T15:30:00", DATE_TIME_FORMAT)).toBe("Jan 15, 2026 3:30 PM");
});

it("formats numbers for a locale", () => {
  expect(formatNumber(1234567.891, { maximumFractionDigits: 1 }, "en-US")).toBe("1,234,567.9");
});

it("describes a time relative to now", () => {
  const now = new Date("2026-01-15T12:00:00Z");
  expect(formatRelative(new Date("2026-01-14T12:00:00Z"), now)).toBe("a day ago");
  expect(formatRelative(new Date("2026-01-15T11:55:00Z"), now)).toBe("5 minutes ago");
});

it("throws on invalid dates", () => {
  expect(() => formatDate("nope")).toThrow(/Invalid date/);
});
