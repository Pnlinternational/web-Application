import { expect, it } from "vite-plus/test";
import { checkPassword, isStrongPassword } from "./password";

it("reports each rule as met or not", () => {
  expect(checkPassword("abc")).toEqual([
    { label: "8+ characters", met: false },
    { label: "A letter", met: true },
    { label: "A number", met: false },
  ]);
});

it("needs a letter, a number and 8 characters", () => {
  expect(isStrongPassword("secret12")).toBe(true);
  expect(isStrongPassword("secretpw")).toBe(false);
  expect(isStrongPassword("12345678")).toBe(false);
  expect(isStrongPassword("abc12")).toBe(false);
});
