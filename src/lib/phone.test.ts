import { describe, expect, it } from "vite-plus/test";
import { formatE164, phoneError, toE164 } from "./phone";

describe("Nigeria (+234)", () => {
  it("accepts a local number with its trunk 0", () => {
    expect(phoneError("NG", "0803 123 4567")).toBeUndefined();
    expect(toE164("NG", "0803 123 4567")).toBe("+2348031234567");
  });

  it("accepts the number without the 0", () => {
    expect(toE164("NG", "8031234567")).toBe("+2348031234567");
  });

  it("accepts a number pasted with the country code", () => {
    expect(toE164("NG", "+234 803 123 4567")).toBe("+2348031234567");
  });

  it.each(["080312345", "080312345678", "0603 123 4567", "0823 123 4567"])(
    "rejects %s (wrong length or prefix)",
    (input) => {
      expect(phoneError("NG", input)).toBe("Enter a valid Nigerian number, like 0803 123 4567");
    },
  );

  it("rejects a Ghanaian number", () => {
    expect(phoneError("NG", "024 123 4567")).toBeDefined();
  });
});

describe("Ghana (+233)", () => {
  it("accepts a local number with its trunk 0", () => {
    expect(phoneError("GH", "024 123 4567")).toBeUndefined();
    expect(toE164("GH", "024 123 4567")).toBe("+233241234567");
  });

  it("accepts a number pasted with the country code", () => {
    expect(toE164("GH", "+233 55 123 4567")).toBe("+233551234567");
  });

  it.each(["024 123 456", "024 123 45678", "0141234567"])("rejects %s", (input) => {
    expect(phoneError("GH", input)).toBe("Enter a valid Ghanaian number, like 024 123 4567");
  });

  it("rejects a Nigerian number", () => {
    expect(phoneError("GH", "0803 123 4567")).toBeDefined();
  });
});

it("asks for a number when the field is empty", () => {
  expect(phoneError("NG", "  ")).toBe("Enter your phone number");
});

it("refuses to convert an invalid number", () => {
  expect(() => toE164("NG", "123")).toThrow(/NG/);
});

it("formats E.164 numbers for display", () => {
  expect(formatE164("+2348031234567")).toBe("+234 803 123 4567");
  expect(formatE164("+233241234567")).toBe("+233 24 123 4567");
  expect(formatE164("+15550001111")).toBe("+15550001111");
});
