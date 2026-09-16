export type TransactionType = "income" | "expense";

export type ThemeMode = "system" | "light" | "dark";

/** UI language preference. "system" follows the device/browser language. */
export type LanguageMode = "system" | "en" | "my";

export interface Transaction {
  id: number;
  uuid: string;
  type: TransactionType;
  amount: number;
  category: string;
  note: string | null;
  /** Local calendar date, format YYYY-MM-DD */
  date: string;
  deleted: number;
  createdAt: string;
  updatedAt: string;
}

export interface NewTransaction {
  type: TransactionType;
  amount: number;
  category: string;
  note?: string | null;
  date: string;
}

export interface MonthSummary {
  month: string;
  /** Fixed income assigned to this month (override or default) */
  fixedIncome: number;
  /** Sum of ad-hoc income transactions in this month */
  extraIncome: number;
  /** fixed + extra */
  income: number;
  expense: number;
  /** income - expense */
  left: number;
}

export interface CategoryTotal {
  category: string;
  total: number;
}

export interface DayTotal {
  date: string;
  total: number;
}

export interface AppSettings {
  currency: string;
  theme: ThemeMode;
  fixedIncomeDefault: number;
  /** Owner of this wallet, shown in the UI. Empty until the user sets it. */
  username: string;
  /** UI language (Myanmar Burmese / English). */
  language: LanguageMode;
}
