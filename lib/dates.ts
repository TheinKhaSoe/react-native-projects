/** All dates are handled in the device's local timezone as ISO "YYYY-MM-DD". */

import { Lang, monthLabel as i18nMonthLabel } from "./i18n";

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function dateFromISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map((v) => Number(v));
  return new Date(y, (m || 1) - 1, d || 1);
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function shiftDays(iso: string, delta: number): string {
  const d = dateFromISO(iso);
  d.setDate(d.getDate() + delta);
  return toISODate(d);
}

export function currentMonthKey(): string {
  return toISODate(new Date()).slice(0, 7);
}

export function monthKeyOf(iso: string): string {
  return iso.slice(0, 7);
}

export function addMonths(month: string, delta: number): string {
  const [y, m] = month.split("-").map((v) => Number(v));
  const d = new Date(y, m - 1 + delta, 1);
  const yy = d.getFullYear();
  const mm = `${d.getMonth() + 1}`.padStart(2, "0");
  return `${yy}-${mm}`;
}

export function monthLabel(month: string, lang?: Lang): string {
  return i18nMonthLabel(month, lang ?? "en");
}

export function shortMonthLabel(month: string, lang?: Lang): string {
  return monthLabel(month, lang);
}

export function shortDateLabel(iso: string, lang?: Lang): string {
  const d = dateFromISO(iso);
  const monthName = monthLabel(`${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}`, lang);
  if (lang === "my") {
    return `${d.getDate()} ${monthName} ${d.getFullYear()}`;
  }
  return d.toLocaleDateString(lang ?? "en", {
    month: "short",
    day: "numeric",
  });
}

export function friendlyDateLabel(iso: string, lang?: Lang): string {
  const today = todayISO();
  if (iso === today) return lang === "my" ? "ဒီနေ့" : "Today";
  if (iso === shiftDays(today, -1)) return lang === "my" ? "မနေ့က" : "Yesterday";
  if (iso === shiftDays(today, 1)) return lang === "my" ? "မနေ့မန်း" : "Tomorrow";
  return shortDateLabel(iso, lang);
}

export function daysInMonth(month: string): number {
  const [y, m] = month.split("-").map((v) => Number(v));
  return new Date(y, m, 0).getDate();
}

export function daysLeftInMonth(iso: string): number {
  const d = dateFromISO(iso);
  const total = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return Math.max(1, total - d.getDate() + 1);
}

/** Week starts on Monday. */
export function startOfWeek(iso: string): string {
  const d = dateFromISO(iso);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return toISODate(d);
}

export function relativeDay(iso: string): "today" | "yesterday" | "other" {
  const today = todayISO();
  if (iso === today) return "today";
  if (iso === shiftDays(today, -1)) return "yesterday";
  return "other";
}
