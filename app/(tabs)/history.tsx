import { BarRow } from "@/components/BarRow";
import { DailyBars } from "@/components/DailyBars";
import { EmptyState } from "@/components/EmptyState";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import { Screen } from "@/components/Screen";
import { TransactionRow } from "@/components/TransactionRow";
import { currentMonthKey } from "@/lib/dates";
import {
  saveReportToDevice,
  shareReport,
  type ExportFormat,
  type ReportData,
} from "@/lib/export";
import type { Lang } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import type {
  CategoryTotal,
  DayTotal,
  MonthSummary,
  Transaction,
} from "@/lib/types";
import { useT, useWallet } from "@/store/wallet-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

export default function HistoryScreen() {
  const {
    currency,
    lang,
    monthSummaryFor,
    transactionsFor,
    categoryTotalsFor,
    dailyTotalsFor,
    deleteTransaction,
  } = useWallet();

  const t = useT();

  const [month, setMonth] = useState(currentMonthKey());
  const [summary, setSummary] = useState<MonthSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenseCats, setExpenseCats] = useState<CategoryTotal[]>([]);
  const [incomeCats, setIncomeCats] = useState<CategoryTotal[]>([]);
  const [daily, setDaily] = useState<DayTotal[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportMenuVisible, setExportMenuVisible] = useState(false);

  const exportCancelled = useRef(false);

  /* -------------------------------------------------------------------------- */
  /* Data                                                                       */
  /* -------------------------------------------------------------------------- */

  const load = useCallback(async () => {
    const [sum, txs, expenses, income, dailyTotals] = await Promise.all([
      monthSummaryFor(month),
      transactionsFor(month),
      categoryTotalsFor(month, "expense"),
      categoryTotalsFor(month, "income"),
      dailyTotalsFor(month),
    ]);

    setSummary(sum);
    setTransactions(txs);
    setExpenseCats(expenses);
    setIncomeCats(income);
    setDaily(dailyTotals);
  }, [
    month,
    monthSummaryFor,
    transactionsFor,
    categoryTotalsFor,
    dailyTotalsFor,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  /* -------------------------------------------------------------------------- */
  /* Derived values                                                             */
  /* -------------------------------------------------------------------------- */

  const exportAvailable =
    transactions.length > 0 ||
    Boolean(summary?.income) ||
    Boolean(summary?.expense);

  const expensePct = summary
    ? summary.income > 0
      ? Math.min(100, Math.round((summary.expense / summary.income) * 100))
      : summary.expense > 0
        ? 100
        : 0
    : 0;

  const biggestExpense = transactions
    .filter((tx) => tx.type === "expense")
    .reduce<Transaction | null>(
      (biggest, tx) => (!biggest || tx.amount > biggest.amount ? tx : biggest),
      null,
    );

  const maxExpense =
    expenseCats.length > 0
      ? Math.max(...expenseCats.map((item) => item.total))
      : 1;

  const maxIncome =
    incomeCats.length > 0
      ? Math.max(...incomeCats.map((item) => item.total))
      : 1;

  /* -------------------------------------------------------------------------- */
  /* Delete                                                                     */
  /* -------------------------------------------------------------------------- */

  const handleDelete = useCallback(
    (id: number) => {
      Alert.alert(t("alert.delTxTitle"), t("alert.delTxMsg"), [
        {
          text: t("alert.cancel"),
          style: "cancel",
        },
        {
          text: t("alert.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              setDeletingId(id);

              await deleteTransaction(id);
              await load();
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]);
    },
    [deleteTransaction, load, t],
  );

  /* -------------------------------------------------------------------------- */
  /* Export                                                                     */
  /* -------------------------------------------------------------------------- */

  const cancelExport = useCallback(() => {
    exportCancelled.current = true;
    setExporting(false);
  }, []);

  const handleExport = useCallback(
    async (format: ExportFormat, share: boolean) => {
      if (!summary || exporting) return;

      exportCancelled.current = false;
      setExporting(true);

      try {
        const data: ReportData = {
          month,
          summary,
          expenseByCategory: expenseCats,
          incomeByCategory: incomeCats,
          biggestExpense,
          currency,
          lang,
        };

        if (share) {
          await shareReport(data, format);
        } else {
          const savedPath = await saveReportToDevice(data, format);

          if (savedPath) {
            Alert.alert(
              t("report.exportSuccess"),
              t("report.savedTo", { path: savedPath }),
            );
          }
        }
      } catch (error) {
        if (!exportCancelled.current) {
          Alert.alert(
            t("report.exportFailed"),
            error instanceof Error ? error.message : String(error),
          );
        }
      } finally {
        setExporting(false);
      }
    },
    [
      summary,
      exporting,
      month,
      expenseCats,
      incomeCats,
      biggestExpense,
      currency,
      lang,
      t,
    ],
  );

  const handleExportOption = useCallback(
    (format: ExportFormat, share: boolean) => {
      setExportMenuVisible(false);
      void handleExport(format, share);
    },
    [handleExport],
  );

  /* -------------------------------------------------------------------------- */
  /* Render                                                                     */
  /* -------------------------------------------------------------------------- */

  return (
    <Screen style={{ marginBottom: -50 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 26 }}
      >
        {/* Header */}
        <View className="mt-2 flex-row items-center justify-between">
          <Text className="text-[22px] font-bold text-slate-900 dark:text-slate-100">
            {t("his.title")}
          </Text>

          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => setExportMenuVisible(true)}
              disabled={exporting || !exportAvailable}
              hitSlop={8}
              className={`h-9 w-9 items-center justify-center rounded-full ${
                exporting || !exportAvailable
                  ? "bg-slate-300 dark:bg-neutral-700"
                  : "bg-emerald-600"
              }`}
            >
              {exporting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="share-outline" size={18} color="#fff" />
              )}
            </Pressable>

            <Pressable
              onPress={() => router.push("/add?type=expense")}
              className="h-10 w-10 items-center justify-center rounded-full bg-emerald-600"
            >
              <Ionicons name="add" size={22} color="#fff" />
            </Pressable>
          </View>
        </View>

        {/* Month */}
        <View className="mt-3">
          <MonthSwitcher month={month} onChange={setMonth} lang={lang} />
        </View>

        {summary ? (
          <>
            {/* Summary */}
            <View className="mt-3 flex-row gap-2.5">
              <SummaryTile
                label={t("tile.totalIncome")}
                value={formatMoney(summary.income, currency)}
                valueClass="text-emerald-600 dark:text-emerald-400"
              />

              <SummaryTile
                label={t("tile.totalExpense")}
                value={formatMoney(summary.expense, currency)}
                valueClass="text-rose-500 dark:text-rose-400"
              />

              <SummaryTile
                label={t("tile.budgetLeft")}
                value={formatMoney(summary.left, currency)}
                valueClass="text-emerald-600 dark:text-emerald-400"
              />
            </View>

            {/* Expense Progress */}
            <View className="mt-3 rounded-2xl bg-white px-4 py-4 dark:bg-neutral-800">
              <View className="flex-row items-center justify-between">
                <Text className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                  {t("his.dailyExpenses")}
                </Text>

                <Text className="text-[13px] font-bold text-slate-900 dark:text-slate-100">
                  {expensePct}%
                </Text>
              </View>

              <View className="mt-2 h-2.5 flex-1 flex-row overflow-hidden rounded-full bg-slate-100 dark:bg-neutral-700">
                <View
                  className={`h-2.5 rounded-full ${
                    expensePct >= 90 ? "bg-rose-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${expensePct}%` }}
                />
              </View>
            </View>

            {/* Daily Chart */}
            <View className="mt-3 rounded-2xl bg-white px-4 py-4 dark:bg-neutral-800">
              <Text className="mb-3 text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                {t("his.dailyExpenses")}
              </Text>

              <DailyBars
                totals={daily}
                month={month}
                currency={currency}
                lang={lang}
              />
            </View>

            {/* Income Categories */}
            {incomeCats.length > 0 && (
              <CategorySection
                title={t("report.incomeByCategory")}
                categories={incomeCats}
                max={maxIncome}
                currency={currency}
                lang={lang}
                type="income"
              />
            )}

            {/* Expense Categories */}
            <Text className="mt-5 text-[16px] font-bold text-slate-900 dark:text-slate-100">
              {t("his.byCategory")}
            </Text>

            <View className="mt-2 rounded-2xl bg-white px-4 py-2 dark:bg-neutral-800">
              {expenseCats.length === 0 ? (
                <Text className="py-3 text-[13px] text-slate-400 dark:text-slate-500">
                  {t("his.noExpenses")}
                </Text>
              ) : (
                expenseCats.map((category) => (
                  <BarRow
                    key={category.category}
                    category={category.category}
                    total={category.total}
                    max={maxExpense}
                    currency={currency}
                    type="expense"
                    lang={lang}
                  />
                ))
              )}
            </View>

            {/* Export */}
            {exportAvailable && (
              <View className="mt-5 rounded-2xl bg-white px-4 py-3.5 dark:bg-neutral-800">
                <Text className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                  {t("report.export")}
                </Text>

                <Text className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                  {t("report.exportHint")}
                </Text>

                <Pressable
                  onPress={() => setExportMenuVisible(true)}
                  disabled={exporting}
                  className={`mt-3 w-full flex-row items-center justify-center gap-1.5 rounded-xl py-2.5 ${
                    exporting ? "bg-slate-300" : "bg-emerald-600"
                  }`}
                >
                  {exporting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="share-outline" size={16} color="#fff" />
                  )}

                  <Text className="text-[13px] font-bold text-white">
                    {t("report.export")}
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Transactions */}
            <Text className="mt-5 text-[16px] font-bold text-slate-900 dark:text-slate-100">
              {t("his.transactions")}
            </Text>

            <View className="mt-2 gap-2">
              {transactions.length === 0 ? (
                <EmptyState
                  emoji="🍂"
                  title={t("his.empty.title")}
                  subtitle={t("his.empty.sub")}
                />
              ) : (
                groupByDate(transactions).map((group) => {
                  const dayTotal = group.items.reduce(
                    (total, tx) =>
                      total + (tx.type === "expense" ? tx.amount : 0),
                    0,
                  );

                  return (
                    <View key={group.date}>
                      <View className="mb-1.5 mt-1 flex-row items-center justify-between px-1">
                        <Text className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                          {group.date}
                        </Text>

                        <Text className="text-[12px] text-slate-400 dark:text-slate-500">
                          -{formatMoney(dayTotal, currency)}
                        </Text>
                      </View>

                      <View className="gap-2">
                        {group.items.map((tx) => (
                          <TransactionRow
                            key={tx.id}
                            tx={tx}
                            currency={currency}
                            lang={lang}
                            onDelete={handleDelete}
                          />
                        ))}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </>
        ) : (
          <View className="mt-4">
            <EmptyState emoji="⏳" title={t("his.loading")} />
          </View>
        )}
      </ScrollView>

      {/* Delete Loading */}
      {deletingId !== null && (
        <View className="absolute inset-0 items-center justify-center bg-black/20">
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      )}

      {/* Export Progress Modal */}
      <Modal
        visible={exporting}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={cancelExport}
      >
        <Pressable
          className="flex-1 items-center justify-center bg-black/40 px-6"
          onPress={cancelExport}
        >
          <Pressable
            className="w-full max-w-[340px] rounded-3xl bg-white px-6 py-7 dark:bg-neutral-800"
            onPress={(event) => event.stopPropagation()}
          >
            <View className="items-center">
              <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/40">
                <ActivityIndicator size="large" color="#10b981" />
              </View>

              <Text className="text-center text-[18px] font-bold text-slate-900 dark:text-slate-100">
                {t("report.export")}
              </Text>

              <Text className="mt-2 text-center text-[13px] leading-5 text-slate-500 dark:text-slate-400">
                {t("report.exportHint")}
              </Text>

              <Pressable
                onPress={cancelExport}
                className="mt-6 w-full items-center rounded-xl border border-slate-200 py-3 dark:border-neutral-700"
              >
                <Text className="text-[14px] font-semibold text-slate-700 dark:text-slate-200">
                  {t("report.cancelExport")}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Export Menu */}
      <Modal
        visible={exportMenuVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setExportMenuVisible(false)}
      >
        <Pressable
          className="flex-1 items-center justify-center bg-black/60 px-6"
          onPress={() => setExportMenuVisible(false)}
        >
          <Pressable
            className="w-full max-w-[340px] rounded-3xl bg-slate-500 px-6 py-5 shadow-2xl dark:bg-white"
            onPress={(event) => event.stopPropagation()}
          >
            <Text className="mb-1 text-center text-[16px] font-bold text-white dark:text-slate-900">
              {t("report.export")}
            </Text>

            <Text className="mb-4 text-center text-[13px] text-slate-300 dark:text-slate-500">
              {t("report.exportHint")}
            </Text>

            <View className="gap-2">
              <ExportOption
                label={t("report.exportTxtSave")}
                icon="save-outline"
                iconColor="#10b981"
                className="bg-emerald-950/30 dark:bg-emerald-50"
                textClass="text-white dark:text-slate-900"
                onPress={() => handleExportOption("txt", false)}
              />

              <ExportOption
                label={t("report.exportTxtShare")}
                icon="share-outline"
                iconColor="#3b82f6"
                className="bg-blue-950/30 dark:bg-blue-50"
                textClass="text-white dark:text-slate-900"
                onPress={() => handleExportOption("txt", true)}
              />

              <ExportOption
                label={t("report.exportCsvSave")}
                icon="save-outline"
                iconColor="#f59e0b"
                className="bg-amber-950/30 dark:bg-amber-50"
                textClass="text-white dark:text-slate-900"
                onPress={() => handleExportOption("csv", false)}
              />

              <ExportOption
                label={t("report.exportCsvShare")}
                icon="share-outline"
                iconColor="#8b5cf6"
                className="bg-purple-950/30 dark:bg-purple-50"
                textClass="text-white dark:text-slate-900"
                onPress={() => handleExportOption("csv", true)}
              />
            </View>

            <Pressable
              onPress={() => setExportMenuVisible(false)}
              className="mt-4 w-full items-center rounded-xl border border-emerald-500 py-3 dark:border-gray-400"
            >
              <Text className="text-[14px] font-semibold text-slate-200 dark:text-slate-700">
                {t("report.cancelExport")}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

/* -------------------------------------------------------------------------- */
/* Small Components                                                           */
/* -------------------------------------------------------------------------- */

function SummaryTile({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass: string;
}) {
  return (
    <View className="flex-1 rounded-2xl bg-white px-3.5 py-3 dark:bg-neutral-800">
      <Text className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
        {label}
      </Text>

      <Text
        className={`mt-0.5 text-[15px] font-bold ${valueClass}`}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
    </View>
  );
}

function CategorySection({
  title,
  categories,
  max,
  currency,
  lang,
  type,
}: {
  title: string;
  categories: CategoryTotal[];
  max: number;
  currency: string;
  lang: Lang;
  type: "income" | "expense";
}) {
  return (
    <>
      <Text className="mt-5 text-[16px] font-bold text-slate-900 dark:text-slate-100">
        {title}
      </Text>

      <View className="mt-2 rounded-2xl bg-white px-4 py-2 dark:bg-neutral-800">
        {categories.map((category) => (
          <BarRow
            key={category.category}
            category={category.category}
            total={category.total}
            max={max}
            currency={currency}
            type={type}
            lang={lang}
          />
        ))}
      </View>
    </>
  );
}

function ExportOption({
  label,
  icon,
  iconColor,
  className,
  textClass,
  onPress,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  iconColor: string;
  className: string;
  textClass: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`w-full flex-row items-center justify-between rounded-xl px-4 py-3 ${className}`}
    >
      <Text className={`text-[14px] font-semibold ${textClass}`}>{label}</Text>

      <Ionicons name={icon} size={20} color={iconColor} />
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

interface DayGroup {
  date: string;
  items: Transaction[];
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function groupByDate(txs: Transaction[]): DayGroup[] {
  const sorted = [...txs].sort((a, b) => {
    if (a.date === b.date) {
      return b.id - a.id;
    }

    return b.date.localeCompare(a.date);
  });

  const groups = new Map<string, Transaction[]>();

  for (const tx of sorted) {
    const items = groups.get(tx.date) ?? [];
    items.push(tx);
    groups.set(tx.date, items);
  }

  return [...groups].map(([date, items]) => ({
    date,
    items,
  }));
}
