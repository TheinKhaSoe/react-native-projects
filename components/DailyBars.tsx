import React from "react";
import { Text, View } from "react-native";
import { shortDateLabel, todayISO } from "@/lib/dates";
import { formatCompact } from "@/lib/money";
import type { DayTotal } from "@/lib/types";

interface DailyBarsProps {
  totals: DayTotal[];
  month: string;
  currency: string;
}

/** Compact daily expense bar chart (pure Views, zero chart deps). */
export function DailyBars({ totals, month, currency }: DailyBarsProps) {
  const [y, m] = month.split("-").map(Number);
  const days = new Date(y, m, 0).getDate();
  const map = new Map(totals.map((t) => [t.date, t.total]));
  const max = Math.max(1, ...totals.map((t) => t.total));
  const today = todayISO();

  return (
    <View>
      <View className="flex-row items-end justify-between" style={{ height: 90 }}>
        {Array.from({ length: days }, (_, i) => {
          const iso = `${month}-${`${i + 1}`.padStart(2, "0")}`;
          const total = map.get(iso) ?? 0;
          const h = total > 0 ? Math.max(4, Math.round((total / max) * 76)) : 2;
          const isToday = iso === today;
          return (
            <View key={iso} className="flex-1 items-center justify-end">
              <View
                className={`w-[65%] rounded-t-sm ${
                  isToday ? "bg-emerald-500" : "bg-emerald-300 dark:bg-emerald-700"
                }`}
                style={{ height: h }}
              />
            </View>
          );
        })}
      </View>
      <View className="mt-1.5 flex-row justify-between">
        <Text className="text-[10px] text-slate-400 dark:text-slate-500">
          {shortDateLabel(`${month}-01`)}
        </Text>
        <Text className="text-[10px] text-slate-400 dark:text-slate-500">
          max {formatCompact(max)} {currency}
        </Text>
        <Text className="text-[10px] text-slate-400 dark:text-slate-500">
          {shortDateLabel(`${month}-${days}`)}
        </Text>
      </View>
    </View>
  );
}
