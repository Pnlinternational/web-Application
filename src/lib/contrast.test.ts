import { expect, it } from "vite-plus/test";
import { contrastRatio } from "./contrast";

it("returns 21 for black on white", () => {
  expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
});

it("is symmetric", () => {
  expect(contrastRatio("#ffffff", "#263782")).toBeCloseTo(contrastRatio("#263782", "#ffffff"), 10);
});

it("matches the brand red figure from the brief", () => {
  expect(contrastRatio("#ED1D24", "#ffffff")).toBeCloseTo(4.37, 2);
});

it("rejects colours it cannot parse", () => {
  expect(() => contrastRatio("red", "#ffffff")).toThrow(/red/);
});
