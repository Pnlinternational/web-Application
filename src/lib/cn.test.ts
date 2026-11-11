import { expect, it } from "vite-plus/test";
import { cn } from "./cn";

function badgeClasses(hidden: boolean) {
  return cn("px-2 py-1", hidden && "hidden", { "text-sm": true }, "px-4");
}

it("merges conditional classes and resolves Tailwind conflicts", () => {
  expect(badgeClasses(false)).toBe("py-1 text-sm px-4");
  expect(badgeClasses(true)).toBe("py-1 hidden text-sm px-4");
});
