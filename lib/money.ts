/** Format an amount with thousand separators and the currency symbol as prefix. */
export function formatMoney(amount: number, currency: string): string {
  const rounded = Math.round(amount * 100) / 100;
  const hasCents = Math.abs(rounded % 1) > 0.0001;
  const formatted = Math.abs(rounded).toLocaleString(undefined, {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  });
  const sign = rounded < 0 ? "-" : "";
  return `${sign}${currency}${formatted}`;
}

/** Compact format for chips/labels: 1.2k, 3.5m */
export function formatCompact(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}${trim(abs / 1_000_000)}m`;
  if (abs >= 1_000) return `${sign}${trim(abs / 1_000)}k`;
  return `${sign}${trim(abs)}`;
}

function trim(n: number): string {
  const s = n >= 100 ? n.toFixed(0) : n.toFixed(1);
  return s.replace(/\.0$/, "");
}

/**
 * Parse human amount text: "5000", "5,000", "5k", "1.5k", "2m", "$300".
 * Returns null when no amount is found.
 */
export function parseAmount(text: string): number | null {
  const match = text.match(/(\d+(?:[.,]\d+)?)\s*(k|m)?/i);
  if (!match) return null;
  let value = Number(match[1].replace(/,/g, ""));
  if (Number.isNaN(value)) return null;
  const suffix = match[2]?.toLowerCase();
  if (suffix === "k") value *= 1_000;
  if (suffix === "m") value *= 1_000_000;
  return Math.round(value * 100) / 100;
}
