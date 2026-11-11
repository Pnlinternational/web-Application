import { describe, expect, it } from "vite-plus/test";
import {
  addMoney,
  convertMoney,
  createStaticRatesProvider,
  CurrencyMismatchError,
  currencyExponent,
  formatMoney,
  fromMinor,
  multiplyMoney,
  sumMoney,
  toMinor,
} from "./currency";

describe("currencyExponent", () => {
  it.each([
    ["USD", 2],
    ["JPY", 0],
    ["KWD", 3],
  ])("%s has %i minor digits", (currency, exponent) => {
    expect(currencyExponent(currency)).toBe(exponent);
  });
});

describe("formatMoney", () => {
  it("formats minor units using the currency exponent", () => {
    expect(formatMoney({ amount: 123456, currency: "USD" }, { locale: "en-US" })).toBe("$1,234.56");
    expect(formatMoney({ amount: 1234, currency: "JPY" }, { locale: "en-US" })).toBe("¥1,234");
    const kwd = formatMoney(
      { amount: 1234, currency: "KWD" },
      { locale: "en-US", display: "code" },
    );
    expect(kwd.replace(/\s/g, " ")).toBe("KWD 1.234");
  });

  it("rejects non-integer minor amounts", () => {
    expect(() => formatMoney({ amount: 10.5, currency: "USD" })).toThrow(/integer/);
  });
});

describe("toMinor / fromMinor", () => {
  it("parses decimal strings without float drift", () => {
    expect(toMinor("19.99", "USD")).toEqual({ amount: 1999, currency: "USD" });
    expect(toMinor("0.07", "USD").amount).toBe(7);
    expect(toMinor("-4.50", "USD").amount).toBe(-450);
  });

  it("parses numbers that are not exactly representable in binary", () => {
    expect(toMinor(0.1 + 0.2, "USD").amount).toBe(30);
    expect(toMinor(1.005, "USD").amount).toBe(101);
  });

  it("rounds half-up beyond the currency exponent", () => {
    expect(toMinor("2.345", "USD").amount).toBe(235);
    expect(toMinor("1234.5", "JPY").amount).toBe(1235);
  });

  it("throws on invalid input", () => {
    expect(() => toMinor("12,34", "USD")).toThrow(/Invalid money amount/);
    expect(() => toMinor(Number.NaN, "USD")).toThrow(/Invalid money amount/);
  });

  it("converts minor units back to a major number", () => {
    expect(fromMinor({ amount: 1999, currency: "USD" })).toBe(19.99);
    expect(fromMinor({ amount: 1999, currency: "JPY" })).toBe(1999);
  });
});

describe("arithmetic", () => {
  it("adds, multiplies and sums money in the same currency", () => {
    const price = { amount: 1999, currency: "USD" };
    expect(addMoney(price, price).amount).toBe(3998);
    expect(multiplyMoney(price, 3).amount).toBe(5997);
    expect(sumMoney([price, price, price], "USD").amount).toBe(5997);
    expect(sumMoney([], "USD")).toEqual({ amount: 0, currency: "USD" });
  });

  it("throws when currencies differ", () => {
    expect(() => addMoney({ amount: 1, currency: "USD" }, { amount: 1, currency: "EUR" })).toThrow(
      CurrencyMismatchError,
    );
  });

  it("rejects fractional quantities", () => {
    expect(() => multiplyMoney({ amount: 100, currency: "USD" }, 1.5)).toThrow(/integer/);
  });
});

describe("convertMoney", () => {
  const rates = createStaticRatesProvider("USD", { USD: 1, EUR: 0.9, JPY: 150, KWD: 0.307 });

  it("returns the same money for the same currency", () => {
    const money = { amount: 1000, currency: "USD" };
    expect(convertMoney(money, "USD", rates)).toBe(money);
  });

  it("converts across exponents and rounds half-up", () => {
    expect(convertMoney({ amount: 1000, currency: "USD" }, "JPY", rates)).toEqual({
      amount: 1500,
      currency: "JPY",
    });
    expect(convertMoney({ amount: 1000, currency: "USD" }, "KWD", rates)).toEqual({
      amount: 3070,
      currency: "KWD",
    });
    expect(convertMoney({ amount: 1500, currency: "JPY" }, "EUR", rates).amount).toBe(900);
  });

  it("throws for unknown currencies", () => {
    expect(() => convertMoney({ amount: 1, currency: "USD" }, "GBP", rates)).toThrow(/GBP/);
  });
});
