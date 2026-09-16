import { EmptyState } from "@/components/EmptyState";
import { Screen } from "@/components/Screen";
import { StatTile } from "@/components/StatTile";
import { TransactionRow } from "@/components/TransactionRow";
import { WalletCard } from "@/components/WalletCard";
import { daysLeftInMonth, todayISO } from "@/lib/dates";
import { useT, useWallet } from "@/store/wallet-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function WalletHome() {
  const { ready, currency, username, summary, todaySpent, recent } =
    useWallet();
  const t = useT();
  const daysLeft = daysLeftInMonth(todayISO());
  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? t("greeting.morning")
      : hour < 18
        ? t("greeting.afternoon")
        : t("greeting.evening");

  return (
    <Screen style={{ marginBottom: -50 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Header */}
        <View className="mt-2 flex-row items-center justify-between">
          <View>
            <Text className="text-[18px] font-semibold text-slate-900 dark:text-white">
              {greeting}, {username || "friend"}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/settings")}
            className="h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-neutral-800"
          >
            <Ionicons name="settings-outline" size={20} color="#64748b" />
          </Pressable>
        </View>

        {/* Wallet card */}
        <View className="mt-2">
          <WalletCard
            summary={summary}
            currency={currency}
            daysLeft={daysLeft}
          />
        </View>

        {/* Quick actions */}
        <View className="mt-4 flex-row gap-2.5">
          <Pressable
            onPress={() => router.push("/add?type=expense")}
            className="flex-1 flex-row items-center justify-center gap-1.5 rounded-2xl bg-rose-500 py-3.5"
            style={{ elevation: 3 }}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text className="text-[13px] font-bold text-white">
              {t("action.expense")}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/add?type=income")}
            className="flex-1 flex-row items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 py-3.5"
            style={{ elevation: 3 }}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text className="text-[13px] font-bold text-white">
              {t("action.income")}
            </Text>
          </Pressable>
        </View>

        {/* Month tiles */}
        <View className="mt-4 flex-row gap-2.5">
          <StatTile
            label={t("tile.today")}
            value={todaySpent}
            currency={currency}
            icon="today-outline"
            tone="sky"
          />
          <StatTile
            label={t("tile.totalIncome")}
            value={summary.income}
            currency={currency}
            icon="arrow-down-circle-outline"
            tone="emerald"
          />
        </View>
        <View className="mt-2.5 flex-row gap-2.5">
          <StatTile
            label={t("tile.spent")}
            value={summary.expense}
            currency={currency}
            icon="arrow-up-circle-outline"
            tone="rose"
          />
          <StatTile
            label={t("tile.budgetLeft")}
            value={summary.left}
            currency={currency}
            icon="wallet-outline"
            tone="slate"
          />
        </View>

        {/* Recent */}
        <View className="mt-6 flex-row items-center justify-between">
          <Text className="text-[16px] font-bold text-slate-900 dark:text-slate-100">
            {t("home.recent")}
          </Text>
          <Pressable onPress={() => router.push("/history")} hitSlop={8}>
            <Text className="text-[13px] font-semibold text-emerald-600 dark:text-emerald-400">
              {t("home.seeAll")}
            </Text>
          </Pressable>
        </View>

        <View className="mt-3 gap-2">
          {ready && recent.length === 0 ? (
            <EmptyState
              emoji="🌱"
              title={t("empty.noTx.title")}
              subtitle={t("empty.noTx.sub")}
            />
          ) : (
            recent.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} currency={currency} />
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
