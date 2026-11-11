import { expect, it } from "vite-plus/test";
import { formatDate, formatNumber, formatRelative } from "./format";

it("formats dates and numbers for a locale", () => {
  expect(
    formatDate("2026-01-15T12:00:00Z", { dateStyle: "medium", timeZone: "UTC" }, "en-US"),
  ).toBe("Jan 15, 2026");
  expect(formatNumber(1234567.891, { maximumFractionDigits: 1 }, "en-US")).toBe("1,234,567.9");
});

it("picks the largest sensible relative unit", () => {
  const now = new Date("2026-01-15T12:00:00Z");
  expect(formatRelative(new Date("2026-01-14T12:00:00Z"), now, "en-US")).toBe("yesterday");
  expect(formatRelative(new Date("2026-01-15T11:55:00Z"), now, "en-US")).toBe("5 minutes ago");
});

it("throws on invalid dates", () => {
  expect(() => formatDate("nope")).toThrow(/Invalid date/);
});
