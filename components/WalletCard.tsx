import React from "react";
import { Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { formatMoney } from "@/lib/money";
import { useT } from "@/store/wallet-context";
import type { MonthSummary } from "@/lib/types";

interface WalletCardProps {
  summary: MonthSummary;
  currency: string;
  daysLeft: number;
}

export function WalletCard({ summary, currency, daysLeft }: WalletCardProps) {
  const t = useT();
  const overBudget = summary.left < 0;
  const perDay = summary.left / Math.max(1, daysLeft);

  return (
    <LinearGradient
      colors={["#047857", "#059669", "#10b981"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="rounded-3xl px-5 py-6"
      style={{
        shadowColor: "#059669",
        shadowOpacity: 0.35,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
      }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className="h-9 w-9 items-center justify-center rounded-full bg-white/20">
            <Ionicons name="wallet" size={18} color="#ffffff" />
          </View>
          <Text className="text-[13px] font-medium tracking-wide text-white/80">
            {t("card.available")}
          </Text>
        </View>
        <View className="flex-row items-center rounded-full bg-white/15 px-2.5 py-1">
          <Ionicons name="calendar" size={12} color="#ffffff" />
          <Text className="ml-1 text-[11px] font-medium text-white/90">
            {t("card.daysLeft", { days: daysLeft })}
          </Text>
        </View>
      </View>

      <Text
        className={`mt-3 text-[34px] font-bold tracking-tight ${
          overBudget ? "text-rose-200" : "text-white"
        }`}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {formatMoney(summary.left, currency)}
      </Text>

      <View className="mt-4 flex-row">
        <View className="flex-1 rounded-2xl bg-white/15 px-3 py-2.5">
          <View className="flex-row items-center gap-1">
            <Ionicons name="arrow-down" size={13} color="#a7f3d0" />
            <Text className="text-[11px] font-medium text-white/75">{t("tile.totalIncome")}</Text>
          </View>
          <Text className="mt-0.5 text-[15px] font-semibold text-white" numberOfLines={1}>
            {formatMoney(summary.income, currency)}
          </Text>
        </View>
        <View className="mx-2" />
        <View className="flex-1 rounded-2xl bg-black/15 px-3 py-2.5">
          <View className="flex-row items-center gap-1">
            <Ionicons name="arrow-up" size={13} color="#fecdd3" />
            <Text className="text-[11px] font-medium text-white/75">{t("tile.spent")}</Text>
          </View>
          <Text className="mt-0.5 text-[15px] font-semibold text-white" numberOfLines={1}>
            {formatMoney(summary.expense, currency)}
          </Text>
        </View>
      </View>

      <View className="mt-4 flex-row items-center justify-between border-t border-white/20 pt-3">
        <Text className="text-[11px] text-white/70">
          {overBudget
            ? t("card.overBudget")
            : t("card.perDay", { amount: formatMoney(Math.max(0, perDay), currency) })}
        </Text>
        <Text className="text-[11px] font-medium text-white/70">
          {t("card.fixed", { amount: formatMoney(summary.fixedIncome, currency) })}
        </Text>
      </View>
    </LinearGradient>
  );
}
