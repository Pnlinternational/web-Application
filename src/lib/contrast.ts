// WCAG 2.x contrast ratio for opaque hex colours (#rgb or #rrggbb).
const HEX_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function channels(hex: string) {
  const match = HEX_PATTERN.exec(hex.trim());
  if (!match?.[1]) {
    throw new Error(`contrastRatio: expected #rgb or #rrggbb, received "${hex}"`);
  }
  const digits = match[1].length === 3 ? match[1].replace(/./g, "$&$&") : match[1];
  return [0, 2, 4].map((index) => Number.parseInt(digits.slice(index, index + 2), 16) / 255);
}

function linear(channel: number) {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string) {
  const [r = 0, g = 0, b = 0] = channels(hex).map(linear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(first: string, second: string) {
  const a = relativeLuminance(first);
  const b = relativeLuminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
