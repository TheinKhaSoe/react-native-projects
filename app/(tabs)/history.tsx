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
import React, { useCallback, useEffect, useState } from "react";
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
  const [exportCancelled, setExportCancelled] = useState(false);

  const load = useCallback(async () => {
    const [sum, txs, cats, incCats, dailyT] = await Promise.all([
      monthSummaryFor(month),
      transactionsFor(month),
      categoryTotalsFor(month, "expense"),
      categoryTotalsFor(month, "income"),
      dailyTotalsFor(month),
    ]);
    setSummary(sum);
    setTransactions(txs);
    setExpenseCats(cats);
    setIncomeCats(incCats);
    setDaily(dailyT);
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

  const handleDelete = useCallback(
    (id: number) => {
      Alert.alert(t("alert.delTxTitle"), t("alert.delTxMsg"), [
        { text: t("alert.cancel"), style: "cancel" },
        {
          text: t("alert.delete"),
          style: "destructive",
          onPress: () => {
            setDeletingId(id);
            void deleteTransaction(id).then(() => {
              void load();
              const timer = setTimeout(() => setDeletingId(null), 1000);
              return () => clearTimeout(timer);
            });
          },
        },
      ]);
    },
    [deleteTransaction, load, t],
  );

  const expensePct =
    summary && summary.income > 0
      ? Math.min(100, Math.round((summary.expense / summary.income) * 100))
      : summary && summary.expense > 0
        ? 100
        : 0;

  const cancelExport = useCallback(() => {
    setExportCancelled(true);
    setExporting(false);
  }, []);

  const handleExport = useCallback(
    async (format: ExportFormat, share: boolean) => {
      if (!summary || exporting) return;
      setExportCancelled(false);
      setExporting(true);
      try {
        const biggestExpense =
          transactions
            .filter((tx) => tx.type === "expense")
            .sort((a, b) => b.amount - a.amount)[0] ?? null;
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
          } else {
            Alert.alert(t("report.exportSuccess"));
          }
        }
      } catch (e) {
        if (!exportCancelled) {
          Alert.alert(
            t("report.exportFailed"),
            e instanceof Error ? e.message : String(e),
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
      transactions,
      currency,
      lang,
      exportCancelled,
      t,
    ],
  );

  const handleExportPress = useCallback(() => {
    Alert.alert(t("report.export"), t("report.exportHint"), [
      {
        text: t("report.exportTxtSave"),
        onPress: () => void handleExport("txt", false),
      },
      {
        text: t("report.exportTxtShare"),
        onPress: () => void handleExport("txt", true),
      },
      {
        text: t("report.exportCsvSave"),
        onPress: () => void handleExport("csv", false),
      },
      {
        text: t("report.exportCsvShare"),
        onPress: () => void handleExport("csv", true),
      },
      { text: t("alert.cancel"), style: "cancel" },
    ]);
  }, [handleExport, t]);

  const exportAvailable =
    transactions.length > 0 ||
    (summary !== null && (summary.income > 0 || summary.expense > 0));

  return (
    <Screen style={{ marginBottom: -50 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 26 }}
      >
        <View className="mt-2 flex-row items-center justify-between">
          <Text className="text-[22px] font-bold text-slate-900 dark:text-slate-100">
            {t("his.title")}
          </Text>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={handleExportPress}
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
              <Ionicons name="add" size={22} color="#ffffff" />
            </Pressable>
          </View>
        </View>

        <View className="mt-3">
          <MonthSwitcher month={month} onChange={setMonth} lang={lang} />
        </View>

        {summary ? (
          <>
            {/* Summary tiles */}
            <View className="mt-3 flex-row gap-2.5">
              <View className="flex-1 rounded-2xl bg-white px-3.5 py-3 dark:bg-neutral-800">
                <Text className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  {t("tile.totalIncome")}
                </Text>
                <Text
                  className="mt-0.5 text-[15px] font-bold text-emerald-600 dark:text-emerald-400"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {formatMoney(summary.income, currency)}
                </Text>
              </View>
              <View className="flex-1 rounded-2xl bg-white px-3.5 py-3 dark:bg-neutral-800">
                <Text className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  {t("tile.totalExpense")}
                </Text>
                <Text
                  className="mt-0.5 text-[15px] font-bold text-rose-500 dark:text-rose-400"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {formatMoney(summary.expense, currency)}
                </Text>
              </View>
              <View className="flex-1 rounded-2xl bg-white px-3.5 py-3 dark:bg-neutral-800">
                <Text className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  {t("tile.budgetLeft")}
                </Text>
                <Text
                  className="mt-0.5 text-[15px] font-bold text-emerald-600 dark:text-emerald-400"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {formatMoney(summary.left, currency)}
                </Text>
              </View>
            </View>

            {/* Budget progress */}
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

            {/* Daily chart */}
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

            {/* Income by category (collapsible) */}
            {incomeCats.length > 0 ? (
              <>
                <Text className="mt-5 text-[16px] font-bold text-slate-900 dark:text-slate-100">
                  {t("report.incomeByCategory")}
                </Text>
                <View className="mt-2 rounded-2xl bg-white px-4 py-2 dark:bg-neutral-800">
                  {incomeCats.map((c) => (
                    <BarRow
                      key={c.category}
                      category={c.category}
                      total={c.total}
                      max={Math.max(...incomeCats.map((x) => x.total))}
                      currency={currency}
                      type="income"
                      lang={lang}
                    />
                  ))}
                </View>
              </>
            ) : null}

            {/* Expense by category */}
            <Text className="mt-5 text-[16px] font-bold text-slate-900 dark:text-slate-100">
              {t("his.byCategory")}
            </Text>
            <View className="mt-2 rounded-2xl bg-white px-4 py-2 dark:bg-neutral-800">
              {expenseCats.length === 0 ? (
                <Text className="py-3 text-[13px] text-slate-400 dark:text-slate-500">
                  {t("his.noExpenses")}
                </Text>
              ) : (
                expenseCats.map((c) => (
                  <BarRow
                    key={c.category}
                    category={c.category}
                    total={c.total}
                    max={Math.max(1, ...expenseCats.map((x) => x.total))}
                    currency={currency}
                    type="expense"
                    lang={lang}
                  />
                ))
              )}
            </View>

            {/* Export section */}
            {exportAvailable && (
              <View className="mt-5 rounded-2xl bg-white px-4 py-3.5 dark:bg-neutral-800">
                <Text className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                  {t("report.export")}
                </Text>
                <Text className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                  {t("report.exportHint")}
                </Text>
                <View className="mt-3 flex-row gap-2.5">
                  <Pressable
                    onPress={handleExportPress}
                    disabled={exporting}
                    className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2.5 ${
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
              </View>
            )}

            {/* Transactions grouped by date */}
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
                    (acc, tx) => acc + (tx.type === "expense" ? tx.amount : 0),
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

      {deletingId !== null && (
        <View className="absolute inset-0 items-center justify-center bg-black/20">
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      )}
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
                  {t("alert.cancel")}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

interface DayGroup {
  date: string;
  items: Transaction[];
}

function groupByDate(txs: Transaction[]): DayGroup[] {
  const groups: DayGroup[] = [];
  let current: DayGroup | null = null;
  for (const tx of [...txs].sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : a.id - b.id,
  )) {
    if (!current || current.date !== tx.date) {
      current = { date: tx.date, items: [tx] };
      groups.push(current);
    } else {
      current.items.push(tx);
    }
  }
  return groups;
}
