import { beforeEach, expect, it } from "vite-plus/test";
import { z } from "zod";
import { createPersistedValue } from "./storage";

const schema = z.object({ items: z.array(z.string()) });

beforeEach(() => {
  window.localStorage.clear();
});

it("round-trips a value", () => {
  const cart = createPersistedValue({ key: "cart", version: 1, schema });
  cart.write({ items: ["a"] });
  expect(cart.read()).toEqual({ items: ["a"] });
});

it("ignores values written by an older version", () => {
  createPersistedValue({ key: "cart", version: 1, schema }).write({ items: ["a"] });
  expect(createPersistedValue({ key: "cart", version: 2, schema }).read()).toBeNull();
});

it("ignores corrupt or invalid data", () => {
  window.localStorage.setItem("cart", "{not json");
  expect(createPersistedValue({ key: "cart", version: 1, schema }).read()).toBeNull();

  window.localStorage.setItem("cart", JSON.stringify({ v: 1, data: { items: [1] } }));
  expect(createPersistedValue({ key: "cart", version: 1, schema }).read()).toBeNull();
});
