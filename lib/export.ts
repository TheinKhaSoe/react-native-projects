import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as MediaLibrary from "expo-media-library";
import { Platform } from "react-native";
import type { CategoryTotal, MonthSummary, Transaction } from "./types";
import { formatMoney } from "./money";
import { monthLabel } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { categoryLabel } from "@/lib/i18n";

export type ExportFormat = "txt" | "csv";

export interface ReportData {
  month: string;
  summary: MonthSummary;
  expenseByCategory: CategoryTotal[];
  incomeByCategory: CategoryTotal[];
  biggestExpense: Transaction | null;
  currency: string;
  lang: Lang;
}

function pad(str: string, len: number): string {
  const s = String(str);
  return s.length >= len ? s : s + " ".repeat(len - s.length);
}

function padStartNum(str: string, len: number): string {
  const s = String(str);
  return s.length >= len ? s : " ".repeat(len - s.length) + s;
}

export function generateTxtReport(data: ReportData): string {
  const { month, summary, expenseByCategory, incomeByCategory, biggestExpense, currency, lang } = data;
  const monthDisp = monthLabel(month, lang);
  const lines: string[] = [];
  const W = 40;

  lines.push("=".repeat(W));
  lines.push(pad(`Expense Report - ${monthDisp}`, W));
  lines.push("=".repeat(W));
  lines.push("");

  lines.push("--- Summary ---");
  lines.push(`  ${pad("Total Income:", 22)} ${padStartNum(formatMoney(summary.income, currency), 14)}`);
  lines.push(`  ${pad("Total Expense:", 22)} ${padStartNum(formatMoney(summary.expense, currency), 14)}`);
  lines.push(`  ${pad("Budget Left:", 22)} ${padStartNum(formatMoney(summary.left, currency), 14)}`);
  lines.push("");

  lines.push("--- Income by Category ---");
  if (incomeByCategory.length === 0) {
    lines.push("  (none)");
  } else {
    for (const c of incomeByCategory) {
      lines.push(`  ${pad(categoryLabel(lang, c.category), 20)} ${padStartNum(formatMoney(c.total, currency), 14)}`);
    }
  }
  lines.push("");

  lines.push("--- Expense by Category ---");
  if (expenseByCategory.length === 0) {
    lines.push("  (none)");
  } else {
    const expTotal = summary.expense;
    const max = Math.max(...expenseByCategory.map((c) => c.category.length));
    for (const c of expenseByCategory) {
      const pct = expTotal > 0 ? Math.round((c.total / expTotal) * 100) : 0;
      lines.push(
        `  ${pad(categoryLabel(lang, c.category), max)} ${padStartNum(formatMoney(c.total, currency), 14)}  (${pct}%)`
      );
    }
  }
  lines.push("");

  lines.push("--- Largest Expense ---");
  if (biggestExpense) {
    lines.push(`  ${pad("Date:", 16)} ${biggestExpense.date}`);
    lines.push(`  ${pad("Category:", 16)} ${categoryLabel(lang, biggestExpense.category)}`);
    lines.push(`  ${pad("Amount:", 16)} ${padStartNum(formatMoney(biggestExpense.amount, currency), 14)}`);
  } else {
    lines.push("  (none)");
  }
  lines.push("");

  lines.push("=".repeat(W));
  lines.push(pad(`Generated: ${new Date().toISOString().slice(0, 10)}`, W));
  lines.push("=".repeat(W));

  return lines.join("\n");
}

export function generateCsvReport(data: ReportData): string {
  const { month, summary, expenseByCategory, incomeByCategory, biggestExpense, currency, lang } = data;
  const monthDisp = monthLabel(month, lang);
  const rows: string[] = [];

  rows.push(`"Expense Report - ${monthDisp}"`);
  rows.push("");
  rows.push("Section,Item,Amount,Percentage");

  rows.push(`"Summary","Total Income","${formatMoney(summary.income, currency)}",""`);
  rows.push(`"Summary","Total Expense","${formatMoney(summary.expense, currency)}",""`);
  rows.push(`"Summary","Budget Left","${formatMoney(summary.left, currency)}",""`);
  rows.push("");

  if (incomeByCategory.length > 0) {
    rows.push('"Income by Category",Category,Total,%');
    for (const c of incomeByCategory) {
      rows.push(`"Income by Category","${categoryLabel(lang, c.category)}","${formatMoney(c.total, currency)}",""`);
    }
    rows.push("");
  }

  if (expenseByCategory.length > 0) {
    rows.push('"Expense by Category",Category,Total,%');
    const expTotal = summary.expense;
    for (const c of expenseByCategory) {
      const pct = expTotal > 0 ? Math.round((c.total / expTotal) * 100) : 0;
      rows.push(`"Expense by Category","${categoryLabel(lang, c.category)}","${formatMoney(c.total, currency)}","${pct}%"`);
    }
    rows.push("");
  }

  if (biggestExpense) {
    rows.push('"Largest Expense",Date,Category,Amount');
    rows.push(
      `"Largest Expense","${biggestExpense.date}","${categoryLabel(lang, biggestExpense.category)}","${formatMoney(biggestExpense.amount, currency)}"`
    );
    rows.push("");
  }

  return rows.join("\n");
}

function buildFilename(month: string, format: ExportFormat): string {
  const ts = new Date().toISOString().replace(/:/g, "-").slice(0, 19);
  return `expense-report-${month}-${ts}.${format}`;
}

const ALBUM_NAME = "Expense Reports";

/** Save file to device. Uses MediaLibrary on mobile (Documents/Dashboard accessible), Blob on web. */
export async function saveReportToDevice(
  data: ReportData,
  format: ExportFormat,
): Promise<string> {
  const content = format === "txt" ? generateTxtReport(data) : generateCsvReport(data);
  const filename = buildFilename(data.month, format);

  if (Platform.OS === "web") {
    void content;
    void filename;
    return "downloaded";
  }

  const file = new FileSystem.File(FileSystem.Paths.document, filename);
  file.write(content);

  const permission = await MediaLibrary.requestPermissionsAsync(true);
  if (!permission.granted) {
    return file.uri;
  }

  try {
    await MediaLibrary.createAssetAsync(file.uri, ALBUM_NAME);
    return file.uri;
  } catch {
    return file.uri;
  }
}

export async function shareReport(
  data: ReportData,
  format: ExportFormat,
): Promise<void> {
  const content = format === "txt" ? generateTxtReport(data) : generateCsvReport(data);
  const filename = buildFilename(data.month, format);

  if (Platform.OS === "web") {
    const blob = new Blob([content], { type: format === "txt" ? "text/plain" : "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }

  const file = new FileSystem.File(FileSystem.Paths.document, filename);
  file.write(content);
  await Sharing.shareAsync(file.uri, {
    dialogTitle: `Export ${format.toUpperCase()}`,
    mimeType: format === "txt" ? "text/plain" : "text/csv",
  });
}
