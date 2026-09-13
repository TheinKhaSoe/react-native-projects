import * as SQLite from "expo-sqlite";

export type DB = SQLite.SQLiteDatabase;

let dbPromise: Promise<DB> | null = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('income','expense')),
  amount REAL NOT NULL,
  category TEXT NOT NULL DEFAULT 'Other',
  note TEXT,
  date TEXT NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions (date);

CREATE TABLE IF NOT EXISTS fixed_income (
  month TEXT PRIMARY KEY,
  amount REAL NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT NOT NULL
);
`;

export async function openWalletDB(): Promise<DB> {
  const db = await SQLite.openDatabaseAsync("wallet.db");
  await db.execAsync(`PRAGMA journal_mode = WAL;`);
  await db.execAsync(SCHEMA);
  return db;
}

// On web, expo-sqlite uses wa-sqlite on the browser's Origin Private File
// System (OPFS). OPFS allows only one "SyncAccessHandle" per file at a time,
// so opening a database can fail with NoModificationAllowedError when a stale
// handle is still held — e.g. by another tab/window, or a page/worker that was
// just closed or reloaded during development.
const OPFS_ACCESS_HANDLE_ERROR = /createSyncAccessHandle|NoModificationAllowedError/i;

/** Opens (or reuses) the app database. */
export function getDB(): Promise<DB> {
  if (!dbPromise) {
    dbPromise = (async () => {
      try {
        return await openWalletDB();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        // Transient OPFS lock: wait for the stale handle to be released,
        // then retry once before giving up.
        if (OPFS_ACCESS_HANDLE_ERROR.test(message)) {
          await new Promise((resolve) => setTimeout(resolve, 750));
          try {
            return await openWalletDB();
          } catch {
            dbPromise = null; // let a later call try again from scratch
            throw new Error(
              "The local database is already open in another tab/window. " +
                "Close other tabs with this app open, then reload."
            );
          }
        }

        dbPromise = null;
        throw error;
      }
    })();
  }
  return dbPromise;
}
