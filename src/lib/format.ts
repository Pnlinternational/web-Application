import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

// Intl constructors are expensive; cache one instance per locale + options.
const numberFormatters = new Map<string, Intl.NumberFormat>();

function cached<T>(cache: Map<string, T>, key: string, create: () => T) {
  let value = cache.get(key);
  if (!value) {
    value = create();
    cache.set(key, value);
  }
  return value;
}

type DateInput = Date | string | number;

function toDayjs(value: DateInput) {
  const date = dayjs(value);
  if (!date.isValid()) {
    throw new Error(`Invalid date: ${String(value)}`);
  }
  return date;
}

export const DATE_FORMAT = "MMM D, YYYY";
export const DATE_TIME_FORMAT = "MMM D, YYYY h:mm A";

/** Local time, in dayjs format tokens (https://day.js.org/docs/en/display/format). */
export function formatDate(value: DateInput, template = DATE_FORMAT) {
  return toDayjs(value).format(template);
}

export function formatNumber(
  value: number,
  options: Intl.NumberFormatOptions = {},
  locale?: string,
) {
  const key = `${locale ?? ""}|${JSON.stringify(options)}`;
  return cached(numberFormatters, key, () => new Intl.NumberFormat(locale, options)).format(value);
}

export function formatRelative(value: DateInput, now: DateInput = Date.now()) {
  return toDayjs(value).from(toDayjs(now));
}
