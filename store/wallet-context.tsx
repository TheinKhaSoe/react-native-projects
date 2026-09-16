import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { DB } from "@/lib/db";
import { getDB } from "@/lib/db";
import * as wallet from "@/lib/wallet";
import { listTransactions } from "@/lib/wallet";
import { applyTheme, resolveScheme, watchSystemTheme } from "@/lib/theme";
import {
  addMonths,
  currentMonthKey,
  daysLeftInMonth,
  shiftDays,
  startOfWeek,
  todayISO,
} from "@/lib/dates";
import type { BotData } from "@/lib/chatbot";
import { resolveLang, t as translate, type Lang, type TKey } from "@/lib/i18n";
import type {
  AppSettings,
  CategoryTotal,
  DayTotal,
  LanguageMode,
  MonthSummary,
  NewTransaction,
  ThemeMode,
  Transaction,
} from "@/lib/types";

export interface WalletContextValue {
  ready: boolean;
  currency: string;
  theme: ThemeMode;
  resolved: "light" | "dark";
  username: string;
  /** Language preference ("system" follows the device). */
  language: LanguageMode;
  /** Concretely resolved language for translations. */
  lang: Lang;
  fixedIncomeDefault: number;
  fixedIncomeThisMonth: number;
  summary: MonthSummary;
  todaySpent: number;
  recent: Transaction[];
  refresh: () => Promise<void>;
  addTransaction: (input: NewTransaction) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
  setThemeMode: (mode: ThemeMode) => void;
  setCurrency: (v: string) => Promise<void>;
  setFixedIncomeDefault: (v: number) => Promise<void>;
  setUsername: (name: string) => Promise<void>;
  setLanguage: (mode: LanguageMode) => Promise<void>;
  resetAll: () => Promise<void>;
  monthSummaryFor: (month: string) => Promise<MonthSummary>;
  transactionsFor: (month: string) => Promise<Transaction[]>;
  categoryTotalsFor: (month: string, type: NewTransaction["type"]) => Promise<CategoryTotal[]>;
  dailyTotalsFor: (month: string) => Promise<DayTotal[]>;
  buildBotContext: () => Promise<BotData>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

const EMPTY_SUMMARY: MonthSummary = {
  month: "",
  fixedIncome: 0,
  extraIncome: 0,
  income: 0,
  expense: 0,
  left: 0,
};

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const dbRef = useRef<DB | null>(null);
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    currency: "$",
    theme: "system",
    fixedIncomeDefault: 0,
    username: "",
    language: "system",
  });
  const [resolved, setResolved] = useState<"light" | "dark">("light");
  const [summary, setSummary] = useState<MonthSummary>(EMPTY_SUMMARY);
  const [todaySpent, setTodaySpent] = useState(0);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [lang, setLang] = useState<Lang>("en");

  const refreshInto = useCallback(async (db: DB) => {
    const month = currentMonthKey();
    const [sum, spent, recentTxs] = await Promise.all([
      wallet.getMonthSummary(db, month),
      wallet.spentBetween(db, todayISO(), todayISO()),
      wallet.getRecentTransactions(db, 6),
    ]);
    setSummary(sum);
    setTodaySpent(spent);
    setRecent(recentTxs);
  }, []);

  const refresh = useCallback(async () => {
    if (!dbRef.current) return;
    await refreshInto(dbRef.current);
  }, [refreshInto]);

  /* ---- boot ------------------------------------------------------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const db = await getDB();
      if (cancelled) return;
      dbRef.current = db;
      const s = await wallet.loadSettings(db);
      if (cancelled) return;
      setSettings(s);
      setLang(resolveLang(s.language));
      applyTheme(s.theme);
      setResolved(resolveScheme(s.theme));
      await refreshInto(db);
      if (!cancelled) setReady(true);
    })();
    const unwatch = watchSystemTheme((scheme) => setResolved(scheme));
    return () => {
      cancelled = true;
      unwatch();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- actions ------------------------------------------------------ */
  const addTransaction = useCallback(
    async (input: NewTransaction) => {
      const db = dbRef.current;
      if (!db) return;
      await wallet.addTransaction(db, input);
      await refresh();
    },
    [refresh]
  );

  const deleteTransaction = useCallback(
    async (id: number) => {
      const db = dbRef.current;
      if (!db) return;
      await wallet.softDeleteTransaction(db, id);
      await refresh();
    },
    [refresh]
  );

  const setSettingsState = useCallback(
    (patch: Partial<AppSettings>) => setSettings((prev) => ({ ...prev, ...patch })),
    []
  );

  const setThemeMode = useCallback((mode: ThemeMode) => {
    applyTheme(mode);
    setResolved(resolveScheme(mode));
    setSettingsState({ theme: mode });
    const db = dbRef.current;
    if (db) {
      void wallet.setSetting(db, "theme", mode);
    }
  }, [setSettingsState]);

  const setCurrency = useCallback(
    async (v: string) => {
      const db = dbRef.current;
      if (!db) return;
      await wallet.setSetting(db, "currency", v);
      setSettingsState({ currency: v });
    },
    [setSettingsState]
  );

  const setUsername = useCallback(
    async (name: string) => {
      const db = dbRef.current;
      if (!db) return;
      await wallet.setUsername(db, name);
      setSettingsState({ username: name });
    },
    [setSettingsState]
  );

  const setFixedIncomeDefault = useCallback(
    async (v: number) => {
      const db = dbRef.current;
      if (!db) return;
      await wallet.setFixedIncomeDefault(db, v);
      setSettings((prev) => ({ ...prev, fixedIncomeDefault: v }));
      await refresh();
    },
    [refresh]
  );

  const setLanguage = useCallback(
    async (mode: LanguageMode) => {
      const db = dbRef.current;
      if (!db) return;
      await wallet.setLanguage(db, mode);
      setSettingsState({ language: mode });
      setLang(resolveLang(mode));
    },
    [setSettingsState]
  );

  const resetAll = useCallback(async () => {
    const db = dbRef.current;
    if (!db) return;
    await wallet.resetAllData(db);
    // Back to first-run state: the name is cleared too, so the welcome
    // onboarding screen shows again and the wallet can be set up fresh.
    setSettingsState({ username: "", fixedIncomeDefault: 0 });
    await refresh();
  }, [refresh, setSettingsState]);

  /* ---- helpers for screens ------------------------------------------ */
  const monthSummaryFor = useCallback(
    async (month: string) => {
      const db = dbRef.current;
      if (!db) return EMPTY_SUMMARY;
      return wallet.getMonthSummary(db, month);
    },
    []
  );

  const transactionsFor = useCallback(async (month: string) => {
    const db = dbRef.current;
    if (!db) return [];
    return listTransactions(db, { month, limit: 400 });
  }, []);

  const categoryTotalsFor = useCallback(
    async (month: string, type: NewTransaction["type"]) => {
      const db = dbRef.current;
      if (!db) return [];
      return wallet.categoryTotals(db, month, type);
    },
    []
  );

  const dailyTotalsFor = useCallback(async (month: string) => {
    const db = dbRef.current;
    if (!db) return [];
    return wallet.dailyExpenseTotals(db, month);
  }, []);

  const buildBotContext = useCallback(async (): Promise<BotData> => {
    const db = dbRef.current;
    if (!db) throw new Error("DB not ready");
    const month = currentMonthKey();
    const today = todayISO();
    const yesterday = shiftDays(today, -1);
    const weekStart = startOfWeek(today);
    const lastMonthKey = addMonths(month, -1);

    const [sum, todayS, yesterdayS, weekS, lastMonthSum, cats, biggest, count] =
      await Promise.all([
        wallet.getMonthSummary(db, month),
        wallet.spentBetween(db, today, today),
        wallet.spentBetween(db, yesterday, yesterday),
        wallet.spentBetween(db, weekStart, today),
        wallet.getMonthSummary(db, lastMonthKey),
        wallet.categoryTotals(db, month, "expense"),
        wallet.getBiggestExpense(db, `${month}-01`, today),
        wallet.countTransactions(db, month),
      ]);

    return {
      currency: settings.currency,
      today,
      month,
      daysLeft: daysLeftInMonth(today),
      fixedIncome: sum.fixedIncome,
      lang,
      summary: { income: sum.income, expense: sum.expense, left: sum.left },
      todaySpent: todayS,
      yesterdaySpent: yesterdayS,
      weekSpent: weekS,
      lastMonth: {
        income: lastMonthSum.income,
        expense: lastMonthSum.expense,
        left: lastMonthSum.left,
      },
      categories: cats,
      biggest,
      txCount: count,
      addExpense: (amount, category, note, date) => {
        void addTransaction({ type: "expense", amount, category, note, date });
      },
      addIncome: (amount, category, note, date) => {
        void addTransaction({ type: "income", amount, category, note, date });
      },
    };
  }, [settings.currency, addTransaction, lang]);

  const value: WalletContextValue = {
    ready,
    currency: settings.currency,
    theme: settings.theme,
    resolved,
    username: settings.username,
    language: settings.language,
    lang,
    fixedIncomeDefault: settings.fixedIncomeDefault,
    fixedIncomeThisMonth: summary.fixedIncome,
    summary,
    todaySpent,
    recent,
    refresh,
    addTransaction,
    deleteTransaction,
    setThemeMode,
    setCurrency,
    setFixedIncomeDefault,
    setUsername,
    setLanguage,
    resetAll,
    monthSummaryFor,
    transactionsFor,
    categoryTotalsFor,
    dailyTotalsFor,
    buildBotContext,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside <WalletProvider>");
  return ctx;
}

/** Translation hook: `const t = useT()` → `t("add.title")`. */
export function useT() {
  const { lang } = useWallet();
  return useCallback(
    (key: TKey, params?: Record<string, string | number>) => translate(lang, key, params),
    [lang]
  );
}