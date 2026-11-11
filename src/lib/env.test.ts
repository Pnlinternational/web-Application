import { expect, it } from "vite-plus/test";
import { parseEnv } from "./env";

it("applies defaults for optional variables", () => {
  expect(parseEnv({})).toEqual({ VITE_DEFAULT_CURRENCY: "USD" });
});

it("fails fast with the offending variable named", () => {
  expect(() => parseEnv({ VITE_DEFAULT_CURRENCY: "DOLLARS" })).toThrow(/VITE_DEFAULT_CURRENCY/);
});
