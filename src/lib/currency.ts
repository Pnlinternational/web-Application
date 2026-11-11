// Money is always stored as an integer count of minor units (cents, fils, yen) to avoid float drift.
// Exponents come from Intl, so JPY = 0, USD = 2, KWD = 3 without a hand-maintained table.

export type CurrencyCode = string;

export interface Money {
  readonly amount: number;
  readonly currency: CurrencyCode;
}

export interface RatesProvider {
  getRate(from: CurrencyCode, to: CurrencyCode): number;
}

export class CurrencyMismatchError extends Error {
  override readonly name = "CurrencyMismatchError";

  constructor(a: CurrencyCode, b: CurrencyCode) {
    super(`Cannot combine ${a} with ${b}; convert first`);
  }
}

type CurrencyDisplay = "symbol" | "narrowSymbol" | "code" | "name";

export interface FormatMoneyOptions {
  locale?: string;
  display?: CurrencyDisplay;
}

const formatters = new Map<string, Intl.NumberFormat>();

function getFormatter(
  locale: string | undefined,
  currency: CurrencyCode,
  display: CurrencyDisplay,
) {
  const key = `${locale ?? ""}|${currency}|${display}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: display,
    });
    formatters.set(key, formatter);
  }
  return formatter;
}

export function currencyExponent(currency: CurrencyCode) {
  return getFormatter("en-US", currency, "code").resolvedOptions().maximumFractionDigits ?? 2;
}

function assertInteger(value: number, label: string) {
  if (!Number.isInteger(value)) {
    throw new Error(`${label} must be an integer, received ${value}`);
  }
}

function assertSameCurrency(a: Money, b: Money) {
  if (a.currency !== b.currency) {
    throw new CurrencyMismatchError(a.currency, b.currency);
  }
}

export function fromMinor(money: Money) {
  return money.amount / 10 ** currencyExponent(money.currency);
}

export function formatMoney(money: Money, { locale, display = "symbol" }: FormatMoneyOptions = {}) {
  assertInteger(money.amount, "Money amount (minor units)");
  return getFormatter(locale, money.currency, display).format(fromMinor(money));
}

const DECIMAL_PATTERN = /^(-)?(\d+)(?:\.(\d+))?$/;

// String(number) gives the shortest round-trip form, so 1.005 stays "1.005" instead of 1.00499…
function numberToDecimalString(value: number) {
  const text = String(value);
  return text.includes("e") ? value.toFixed(20) : text;
}

export function toMinor(value: string | number, currency: CurrencyCode): Money {
  const text = typeof value === "number" ? numberToDecimalString(value) : value.trim();
  const match = Number.isFinite(Number(text)) ? DECIMAL_PATTERN.exec(text) : null;
  if (!match) {
    throw new Error(`Invalid money amount "${String(value)}" for ${currency}`);
  }

  const [, sign, whole = "0", fraction = ""] = match;
  const exponent = currencyExponent(currency);
  const kept = fraction.slice(0, exponent).padEnd(exponent, "0");
  const roundsUp = Number(fraction[exponent] ?? "0") >= 5;
  const magnitude = Number(whole + kept) + (roundsUp ? 1 : 0);

  return { amount: sign && magnitude !== 0 ? -magnitude : magnitude, currency };
}

export function addMoney(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return { amount: a.amount + b.amount, currency: a.currency };
}

export function subtractMoney(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return { amount: a.amount - b.amount, currency: a.currency };
}

export function multiplyMoney(money: Money, quantity: number): Money {
  assertInteger(quantity, "Quantity");
  return { amount: money.amount * quantity, currency: money.currency };
}

export function sumMoney(items: readonly Money[], currency: CurrencyCode): Money {
  return items.reduce(addMoney, { amount: 0, currency });
}

function roundHalfUp(value: number) {
  const magnitude = Math.round(Math.abs(value) * (1 + Number.EPSILON));
  return value < 0 ? -magnitude : magnitude;
}

export function convertMoney(money: Money, to: CurrencyCode, rates: RatesProvider): Money {
  if (money.currency === to) {
    return money;
  }

  const rate = rates.getRate(money.currency, to);
  const scale = 10 ** (currencyExponent(to) - currencyExponent(money.currency));
  return { amount: roundHalfUp(money.amount * rate * scale), currency: to };
}

// Rates are expressed relative to `base` (base = 1). Swap for an API-backed provider later.
export function createStaticRatesProvider(
  base: CurrencyCode,
  rates: Readonly<Record<CurrencyCode, number>>,
): RatesProvider {
  function rateOf(currency: CurrencyCode) {
    const rate = currency === base ? 1 : rates[currency];
    if (rate === undefined || rate <= 0) {
      throw new Error(`No exchange rate for ${currency} (base ${base})`);
    }
    return rate;
  }

  return {
    getRate(from, to) {
      return rateOf(to) / rateOf(from);
    },
  };
}
