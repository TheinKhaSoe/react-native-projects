import React, { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { Screen } from "@/components/Screen";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import { DailyBars } from "@/components/DailyBars";
import { BarRow } from "@/components/BarRow";
import { TransactionRow } from "@/components/TransactionRow";
import { EmptyState } from "@/components/EmptyState";
import { useWallet } from "@/store/wallet-context";
import { currentMonthKey, friendlyDateLabel } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import type { CategoryTotal, DayTotal, MonthSummary, Transaction } from "@/lib/types";

export default function HistoryScreen() {
  const {
    currency,
    monthSummaryFor,
    transactionsFor,
    categoryTotalsFor,
    dailyTotalsFor,
    deleteTransaction,
  } = useWallet();

  const [month, setMonth] = useState(currentMonthKey());
  const [summary, setSummary] = useState<MonthSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenseCats, setExpenseCats] = useState<CategoryTotal[]>([]);
  const [daily, setDaily] = useState<DayTotal[]>([]);

  const load = useCallback(async () => {
    const [sum, txs, cats, dailyT] = await Promise.all([
      monthSummaryFor(month),
      transactionsFor(month),
      categoryTotalsFor(month, "expense"),
      dailyTotalsFor(month),
    ]);
    setSummary(sum);
    setTransactions(txs);
    setExpenseCats(cats);
    setDaily(dailyT);
  }, [month, monthSummaryFor, transactionsFor, categoryTotalsFor, dailyTotalsFor]);

  useEffect(() => {
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const confirmDelete = useCallback(
    (id: number) => {
      Alert.alert("Delete transaction", "This can't be undone.", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => void deleteTransaction(id) },
      ]);
    },
    [deleteTransaction]
  );

  const expensePct =
    summary && summary.income > 0
      ? Math.min(100, Math.round((summary.expense / summary.income) * 100))
      : summary && summary.expense > 0
        ? 100
        : 0;

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 96 }}>
        <View className="mt-2 flex-row items-center justify-between">
          <Text className="text-[22px] font-bold text-slate-900 dark:text-slate-100">
            History
          </Text>
          <Pressable
            onPress={() => router.push("/add?type=expense")}
            className="h-10 w-10 items-center justify-center rounded-full bg-emerald-600"
          >
            <Ionicons name="add" size={22} color="#ffffff" />
          </Pressable>
        </View>

        <View className="mt-3">
          <MonthSwitcher month={month} onChange={setMonth} />
        </View>

        {summary ? (
          <>
            {/* Summary tiles */}
            <View className="mt-3 flex-row gap-2.5">
              <View className="flex-1 rounded-2xl bg-white px-3.5 py-3 dark:bg-neutral-800">
                <Text className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  Income
                </Text>
                <Text className="mt-0.5 text-[15px] font-bold text-emerald-600 dark:text-emerald-400" numberOfLines={1} adjustsFontSizeToFit>
                  {formatMoney(summary.income, currency)}
                </Text>
              </View>
              <View className="flex-1 rounded-2xl bg-white px-3.5 py-3 dark:bg-neutral-800">
                <Text className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  Spent
                </Text>
                <Text className="mt-0.5 text-[15px] font-bold text-rose-500 dark:text-rose-400" numberOfLines={1} adjustsFontSizeToFit>
                  {formatMoney(summary.expense, currency)}
                </Text>
              </View>
              <View className="flex-1 rounded-2xl bg-white px-3.5 py-3 dark:bg-neutral-800">
                <Text className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  Left
                </Text>
                <Text
                  className={`mt-0.5 text-[15px] font-bold ${
                    summary.left < 0 ? "text-rose-500 dark:text-rose-400" : "text-slate-900 dark:text-slate-100"
                  }`}
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
                  Budget used
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
                Daily expenses
              </Text>
              <DailyBars totals={daily} month={month} currency={currency} />
            </View>

            {/* Categories */}
            <Text className="mt-5 text-[16px] font-bold text-slate-900 dark:text-slate-100">
              Spending by category
            </Text>
            <View className="mt-2 rounded-2xl bg-white px-4 py-2 dark:bg-neutral-800">
              {expenseCats.length === 0 ? (
                <Text className="py-3 text-[13px] text-slate-400 dark:text-slate-500">
                  No expenses this month yet.
                </Text>
              ) : (
                expenseCats.map((c) => (
                  <BarRow
                    key={c.category}
                    category={c.category}
                    total={c.total}
                    max={Math.max(...expenseCats.map((x) => x.total))}
                    currency={currency}
                    type="expense"
                  />
                ))
              )}
            </View>

            {/* Transactions grouped by date */}
            <Text className="mt-5 text-[16px] font-bold text-slate-900 dark:text-slate-100">
              Transactions
            </Text>
            <View className="mt-2 gap-2">
              {transactions.length === 0 ? (
                <EmptyState
                  emoji="🍂"
                  title="Nothing recorded this month"
                  subtitle="Switch months or add something with the + button"
                />
              ) : (
                groupByDate(transactions).map((group) => {
                  const dayTotal = group.items.reduce(
                    (acc, t) => acc + (t.type === "expense" ? t.amount : 0),
                    0
                  );
                  return (
                    <View key={group.date}>
                      <View className="mb-1.5 mt-1 flex-row items-center justify-between px-1">
                        <Text className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                          {friendlyDateLabel(group.date)}
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
                            onDelete={confirmDelete}
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
            <EmptyState emoji="⏳" title="Loading…" />
          </View>
        )}
      </ScrollView>
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
  for (const tx of [...txs].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.id - b.id))) {
    if (!current || current.date !== tx.date) {
      current = { date: tx.date, items: [tx] };
      groups.push(current);
    } else {
      current.items.push(tx);
    }
  }
  return groups;
}
