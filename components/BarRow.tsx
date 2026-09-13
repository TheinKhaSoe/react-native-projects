import React from "react";
import { Text, View } from "react-native";
import { emojiFor } from "@/lib/categories";
import { formatMoney } from "@/lib/money";

interface BarRowProps {
  category: string;
  total: number;
  max: number;
  currency: string;
  type: "income" | "expense";
}

/** Horizontal category breakdown bar. */
export function BarRow({ category, total, max, currency, type }: BarRowProps) {
  const pct = max > 0 ? Math.max(2, Math.round((total / max) * 100)) : 0;
  const income = type === "income";
  return (
    <View className="flex-row items-center py-2">
      <Text className="w-6 text-base">{emojiFor(category, type)}</Text>
      <View className="ml-2 h-6 flex-1 justify-center rounded-full bg-slate-100 dark:bg-neutral-700">
        <View
          className={`h-6 rounded-full ${income ? "bg-emerald-500" : "bg-rose-400 dark:bg-rose-500"}`}
          style={{ width: `${pct}%` }}
        />
      </View>
      <Text
        className="ml-2 w-24 text-right text-[13px] font-semibold text-slate-700 dark:text-slate-300"
        numberOfLines={1}
      >
        {formatMoney(total, currency)}
      </Text>
    </View>
  );
}
