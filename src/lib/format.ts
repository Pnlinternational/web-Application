// Intl constructors are expensive; cache one instance per locale + options.
const dateFormatters = new Map<string, Intl.DateTimeFormat>();
const numberFormatters = new Map<string, Intl.NumberFormat>();
const relativeFormatters = new Map<string, Intl.RelativeTimeFormat>();

function cached<T>(cache: Map<string, T>, key: string, create: () => T) {
  let value = cache.get(key);
  if (!value) {
    value = create();
    cache.set(key, value);
  }
  return value;
}

type DateInput = Date | string | number;

function toDate(value: DateInput) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${String(value)}`);
  }
  return date;
}

export function formatDate(
  value: DateInput,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
  locale?: string,
) {
  const key = `${locale ?? ""}|${JSON.stringify(options)}`;
  return cached(dateFormatters, key, () => new Intl.DateTimeFormat(locale, options)).format(
    toDate(value),
  );
}

export function formatNumber(
  value: number,
  options: Intl.NumberFormatOptions = {},
  locale?: string,
) {
  const key = `${locale ?? ""}|${JSON.stringify(options)}`;
  return cached(numberFormatters, key, () => new Intl.NumberFormat(locale, options)).format(value);
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_536_000],
  ["month", 2_592_000],
  ["week", 604_800],
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
  ["second", 1],
];

export function formatRelative(value: DateInput, now: DateInput = Date.now(), locale?: string) {
  const seconds = Math.round((toDate(value).getTime() - toDate(now).getTime()) / 1000);
  const formatter = cached(
    relativeFormatters,
    locale ?? "",
    () => new Intl.RelativeTimeFormat(locale, { numeric: "auto" }),
  );

  for (const [unit, size] of RELATIVE_UNITS) {
    if (Math.abs(seconds) >= size || unit === "second") {
      return formatter.format(Math.round(seconds / size), unit);
    }
  }
  return formatter.format(0, "second");
}
