import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { addMonths, monthLabel } from "@/lib/dates";
import { useWallet } from "@/store/wallet-context";

interface MonthSwitcherProps {
  month: string;
  onChange: (month: string) => void;
  lang?: "en" | "my";
}

export function MonthSwitcher({ month, onChange, lang: propLang }: MonthSwitcherProps) {
  const ctx = useWallet();
  const lang = propLang ?? ctx.lang;
  const now = new Date();
  const currentKey = `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, "0")}`;
  const isCurrent = month === currentKey;

  return (
    <View className="flex-row items-center justify-between rounded-2xl bg-white px-2 py-2 dark:bg-neutral-800">
      <Pressable
        onPress={() => onChange(addMonths(month, -1))}
        hitSlop={8}
        className="h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-neutral-700"
      >
        <Ionicons name="chevron-back" size={18} color="#64748b" />
      </Pressable>

      <Text className="text-[15px] font-bold text-slate-900 dark:text-slate-100">
        {monthLabel(month, lang)}
      </Text>

      <Pressable
        onPress={() => !isCurrent && onChange(addMonths(month, 1))}
        disabled={isCurrent}
        hitSlop={8}
        className={`h-9 w-9 items-center justify-center rounded-xl ${
          isCurrent ? "bg-slate-100/50 dark:bg-neutral-700/50" : "bg-slate-100 dark:bg-neutral-700"
        }`}
      >
        <Ionicons
          name="chevron-forward"
          size={18}
          color={isCurrent ? "#cbd5e1" : "#64748b"}
        />
      </Pressable>
    </View>
  );
}
