// Phone numbers for the markets we sell in. The API takes E.164 (+234…, +233…); people type
// local numbers ("0803 123 4567"), numbers without the trunk 0, or paste the full international form.

export type Market = "NG" | "GH";

interface MarketPhone {
  readonly name: string;
  readonly dialCode: string;
  /** Mobile numbers after the country code (no trunk 0). */
  readonly national: RegExp;
  readonly invalidMessage: string;
}

export const MARKET_PHONES: Record<Market, MarketPhone> = {
  NG: {
    name: "Nigeria",
    dialCode: "234",
    national: /^[789][01]\d{8}$/,
    invalidMessage: "Enter a valid Nigerian number, like 0803 123 4567",
  },
  GH: {
    name: "Ghana",
    dialCode: "233",
    national: /^[25]\d{8}$/,
    invalidMessage: "Enter a valid Ghanaian number, like 024 123 4567",
  },
};

export const MARKETS = Object.keys(MARKET_PHONES) as Market[];

function nationalNumber(market: Market, input: string) {
  const digits = input.replace(/\D/g, "");
  const { dialCode } = MARKET_PHONES[market];
  if (digits.startsWith(dialCode) && digits.length > dialCode.length + 8) {
    return digits.slice(dialCode.length);
  }
  return digits.startsWith("0") ? digits.slice(1) : digits;
}

/** Undefined when valid; otherwise the message to show under the field. */
export function phoneError(market: Market, input: string) {
  if (input.trim() === "") return "Enter your phone number";
  const phone = MARKET_PHONES[market];
  return phone.national.test(nationalNumber(market, input)) ? undefined : phone.invalidMessage;
}

export function toE164(market: Market, input: string) {
  if (phoneError(market, input)) {
    throw new Error(`Not a valid ${market} phone number`);
  }
  return `+${MARKET_PHONES[market].dialCode}${nationalNumber(market, input)}`;
}

const DISPLAY_GROUPS: Record<string, RegExp> = {
  "234": /^(\d{3})(\d{3})(\d{4})$/,
  "233": /^(\d{2})(\d{3})(\d{4})$/,
};

/** "+2348031234567" → "+234 803 123 4567". Unknown formats come back unchanged. */
export function formatE164(e164: string) {
  const dialCode = e164.slice(1, 4);
  const groups = DISPLAY_GROUPS[dialCode]?.exec(e164.slice(4));
  return groups ? `+${dialCode} ${groups.slice(1).join(" ")}` : e164;
}
