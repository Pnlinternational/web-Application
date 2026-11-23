import { expect, it } from "vite-plus/test";
import { createClientKey } from "./client-key";

it("is base64url without padding", () => {
  expect(createClientKey()).toMatch(/^[A-Za-z0-9_-]+$/);
});

it("is at least 22 characters long", () => {
  expect(createClientKey().length).toBeGreaterThanOrEqual(22);
});

it("differs on every call", () => {
  expect(createClientKey()).not.toBe(createClientKey());
});
