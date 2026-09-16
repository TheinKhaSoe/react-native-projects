import type { DB } from "./db";
import type {
  AppSettings,
  CategoryTotal,
  DayTotal,
  LanguageMode,
  MonthSummary,
  NewTransaction,
  ThemeMode,
  Transaction,
  TransactionType,
} from "./types";
import { nowISO } from "./dates";
import { uuid } from "./uuid";

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

export type SettingKey =
  | "currency"
  | "theme"
  | "fixed_income_default"
  | "username"
  | "language";

export async function loadSettings(db: DB): Promise<AppSettings> {
  const rows = await db.getAllAsync<{ key: string; value: string | null }>(
    `SELECT key, value FROM settings`
  );
  const map: Record<string, string | null> = {};
  for (const row of rows) map[row.key] = row.value;

  const theme: ThemeMode =
    map.theme === "light" || map.theme === "dark" ? map.theme : "system";
  const language: LanguageMode =
    map.language === "en" || map.language === "my" ? map.language : "system";
  return {
    currency: map.currency ?? "$",
    theme,
    fixedIncomeDefault: Number(map.fixed_income_default ?? 0) || 0,
    username: map.username ?? "",
    language,
  };
}

export async function getSetting(db: DB, key: SettingKey): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string | null }>(
    `SELECT value FROM settings WHERE key = ?`,
    [key]
  );
  return row?.value ?? null;
}

export async function setSetting(
  db: DB,
  key: SettingKey,
  value: string | null
): Promise<void> {
  await db.runAsync(
    `INSERT INTO settings (key, value, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET
       value = excluded.value, updated_at = excluded.updated_at`,
    [key, value, nowISO()]
  );
}

/* ------------------------------------------------------------------ */
/* Fixed income                                                        */
/* ------------------------------------------------------------------ */

/** Fixed income for a month: per-month override, else the default. */
export async function getFixedIncomeForMonth(db: DB, month: string): Promise<number> {
  const override = await db.getFirstAsync<{ amount: number }>(
    `SELECT amount FROM fixed_income WHERE month = ?`,
    [month]
  );
  if (override) return override.amount;
  const def = await getSetting(db, "fixed_income_default");
  return Number(def ?? 0) || 0;
}

export async function setFixedIncomeDefault(db: DB, amount: number): Promise<void> {
  await setSetting(db, "fixed_income_default", String(amount));
}

export async function setUsername(db: DB, name: string): Promise<void> {
  await setSetting(db, "username", name);
}

export async function setLanguage(db: DB, mode: LanguageMode): Promise<void> {
  await setSetting(db, "language", mode);
}

export async function setFixedIncomeForMonth(
  db: DB,
  month: string,
  amount: number
): Promise<void> {
  await db.runAsync(
    `INSERT INTO fixed_income (month, amount, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(month) DO UPDATE SET
       amount = excluded.amount, updated_at = excluded.updated_at`,
    [month, amount, nowISO()]
  );
}

/* ------------------------------------------------------------------ */
/* Transactions                                                        */
/* ------------------------------------------------------------------ */

interface TxRow {
  id: number;
  uuid: string;
  type: TransactionType;
  amount: number;
  category: string;
  note: string | null;
  date: string;
  deleted: number;
  created_at: string;
  updated_at: string;
}

function rowToTransaction(r: TxRow): Transaction {
  return {
    id: r.id,
    uuid: r.uuid,
    type: r.type,
    amount: r.amount,
    category: r.category,
    note: r.note,
    date: r.date,
    deleted: r.deleted,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function addTransaction(db: DB, input: NewTransaction): Promise<Transaction> {
  const now = nowISO();
  const newUuid = uuid();
  const result = await db.runAsync(
    `INSERT INTO transactions (uuid, type, amount, category, note, date, deleted, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
    [newUuid, input.type, input.amount, input.category, input.note ?? null, input.date, now, now]
  );
  return {
    id: Number(result.lastInsertRowId),
    uuid: newUuid,
    type: input.type,
    amount: input.amount,
    category: input.category,
    note: input.note ?? null,
    date: input.date,
    deleted: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export async function softDeleteTransaction(db: DB, id: number): Promise<void> {
  await db.runAsync(
    `UPDATE transactions SET deleted = 1, updated_at = ? WHERE id = ?`,
    [nowISO(), id]
  );
}

export interface ListOptions {
  month?: string;
  from?: string;
  to?: string;
  limit?: number;
  includeDeleted?: boolean;
}

export async function listTransactions(db: DB, opts: ListOptions = {}): Promise<Transaction[]> {
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (!opts.includeDeleted) where.push(`deleted = 0`);
  if (opts.month) {
    where.push(`substr(date, 1, 7) = ?`);
    params.push(opts.month);
  }
  if (opts.from) {
    where.push(`date >= ?`);
    params.push(opts.from);
  }
  if (opts.to) {
    where.push(`date <= ?`);
    params.push(opts.to);
  }
  params.push(opts.limit ?? 500);
  const rows = await db.getAllAsync<TxRow>(
    `SELECT * FROM transactions
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY date DESC, id DESC
     LIMIT ?`,
    params
  );
  return rows.map(rowToTransaction);
}

export async function getRecentTransactions(db: DB, limit: number): Promise<Transaction[]> {
  return listTransactions(db, { limit });
}

/* ------------------------------------------------------------------ */
/* Summaries                                                           */
/* ------------------------------------------------------------------ */

export async function getMonthSummary(db: DB, month: string): Promise<MonthSummary> {
  const fixed = await getFixedIncomeForMonth(db, month);
  const row = await db.getFirstAsync<{ income: number | null; expense: number | null }>(
    `SELECT
       SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
       SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense
     FROM transactions
     WHERE deleted = 0 AND substr(date, 1, 7) = ?`,
    [month]
  );
  const extraIncome = row?.income ?? 0;
  const expense = row?.expense ?? 0;
  const income = fixed + extraIncome;
  return { month, fixedIncome: fixed, extraIncome, income, expense, left: income - expense };
}

export async function spentBetween(db: DB, from: string, to: string): Promise<number> {
  const row = await db.getFirstAsync<{ total: number | null }>(
    `SELECT SUM(amount) AS total FROM transactions
     WHERE deleted = 0 AND type = 'expense' AND date >= ? AND date <= ?`,
    [from, to]
  );
  return row?.total ?? 0;
}

export async function incomeBetween(db: DB, from: string, to: string): Promise<number> {
  const row = await db.getFirstAsync<{ total: number | null }>(
    `SELECT SUM(amount) AS total FROM transactions
     WHERE deleted = 0 AND type = 'income' AND date >= ? AND date <= ?`,
    [from, to]
  );
  return row?.total ?? 0;
}

export async function categoryTotals(
  db: DB,
  month: string,
  type: TransactionType
): Promise<CategoryTotal[]> {
  const rows = await db.getAllAsync<{ category: string; total: number }>(
    `SELECT category, SUM(amount) AS total
     FROM transactions
     WHERE deleted = 0 AND type = ? AND substr(date, 1, 7) = ?
     GROUP BY category
     ORDER BY total DESC`,
    [type, month]
  );
  return rows.map((r) => ({ category: r.category, total: r.total }));
}

export async function dailyExpenseTotals(db: DB, month: string): Promise<DayTotal[]> {
  const rows = await db.getAllAsync<{ date: string; total: number }>(
    `SELECT date, SUM(amount) AS total
     FROM transactions
     WHERE deleted = 0 AND type = 'expense' AND substr(date, 1, 7) = ?
     GROUP BY date
     ORDER BY date`,
    [month]
  );
  return rows.map((r) => ({ date: r.date, total: r.total }));
}

export interface BiggestExpense {
  amount: number;
  category: string;
  note: string | null;
  date: string;
}

export async function getBiggestExpense(
  db: DB,
  from: string,
  to: string
): Promise<BiggestExpense | null> {
  const row = await db.getFirstAsync<{
    amount: number;
    category: string;
    note: string | null;
    date: string;
  }>(
    `SELECT amount, category, note, date FROM transactions
     WHERE deleted = 0 AND type = 'expense' AND date >= ? AND date <= ?
     ORDER BY amount DESC LIMIT 1`,
    [from, to]
  );
  return row ?? null;
}

export async function countTransactions(db: DB, month: string): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM transactions
     WHERE deleted = 0 AND substr(date, 1, 7) = ?`,
    [month]
  );
  return row?.count ?? 0;
}

/** Wipe everything the user created: transactions, fixed income (default and
 * per-month overrides) and personal data (name, budget). Appearance prefs
 * (theme, currency) are kept so the app doesn't lose its look after a reset. */
export async function resetAllData(db: DB): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync(`DELETE FROM transactions`);
    await db.runAsync(`DELETE FROM fixed_income`);
    await db.runAsync(
      `DELETE FROM settings WHERE key IN ('username', 'fixed_income_default')`
    );
  });
}
