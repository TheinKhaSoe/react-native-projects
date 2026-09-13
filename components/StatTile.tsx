import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatMoney } from "@/lib/money";

interface StatTileProps {
  label: string;
  value: number;
  currency: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone?: "emerald" | "rose" | "slate" | "sky";
}

const TONES: Record<NonNullable<StatTileProps["tone"]>, { iconBg: string; value: string }> = {
  emerald: { iconBg: "bg-emerald-100 dark:bg-emerald-500/15", value: "text-emerald-600 dark:text-emerald-400" },
  rose: { iconBg: "bg-rose-100 dark:bg-rose-500/15", value: "text-rose-600 dark:text-rose-400" },
  slate: { iconBg: "bg-slate-100 dark:bg-neutral-700", value: "text-slate-900 dark:text-slate-100" },
  sky: { iconBg: "bg-sky-100 dark:bg-sky-500/15", value: "text-sky-600 dark:text-sky-400" },
};

export function StatTile({ label, value, currency, icon, tone = "slate" }: StatTileProps) {
  const t = TONES[tone];
  return (
    <View className="flex-1 rounded-2xl bg-white px-3 py-3 dark:bg-neutral-800">
      <View className={`h-7 w-7 items-center justify-center rounded-lg ${t.iconBg}`}>
        <Ionicons name={icon} size={14} color={tone === "rose" ? "#f43f5e" : tone === "emerald" ? "#059669" : tone === "sky" ? "#0ea5e9" : "#64748b"} />
      </View>
      <Text className="mt-2 text-[11px] font-medium text-slate-400 dark:text-slate-500" numberOfLines={1}>
        {label}
      </Text>
      <Text className={`mt-0.5 text-[14px] font-bold ${t.value}`} numberOfLines={1} adjustsFontSizeToFit>
        {formatMoney(value, currency)}
      </Text>
    </View>
  );
}
