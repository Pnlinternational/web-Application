import { expect, it } from "vite-plus/test";
import { cn } from "./cn";

function badgeClasses(hidden: boolean) {
  return cn("px-2 py-1", hidden && "hidden", { "text-sm": true }, "px-4");
}

it("merges conditional classes and resolves Tailwind conflicts", () => {
  expect(badgeClasses(false)).toBe("py-1 text-sm px-4");
  expect(badgeClasses(true)).toBe("py-1 hidden text-sm px-4");
});

it("keeps a type-scale size alongside a neutral text colour", () => {
  expect(cn("text-h1 text-ink")).toBe("text-h1 text-ink");
});

it("lets a later type-scale size win", () => {
  expect(cn("text-body text-h2")).toBe("text-h2");
});

it("treats sheet radii as radius values", () => {
  expect(cn("rounded-t-2xl rounded-t-sheet")).toBe("rounded-t-sheet");
});
