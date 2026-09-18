import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { emojiFor } from "@/lib/categories";
import { useWallet } from "@/store/wallet-context";
import { formatMoney } from "@/lib/money";
import { friendlyDateLabel } from "@/lib/dates";
import { categoryLabel, type Lang } from "@/lib/i18n";
import type { Transaction } from "@/lib/types";

interface TransactionRowProps {
  tx: Transaction;
  currency: string;
  lang?: Lang;
  onDelete?: (id: number) => void;
}

export function TransactionRow({ tx, currency, lang: propLang, onDelete }: TransactionRowProps) {
  const ctx = useWallet();
  const lang = propLang ?? ctx.lang;
  const isIncome = tx.type === "income";
  return (
    <View className="flex-row items-center rounded-2xl bg-white px-3 py-3 dark:bg-neutral-800">
      <View
        className={`h-10 w-10 items-center justify-center rounded-full ${
          isIncome ? "bg-emerald-100 dark:bg-emerald-500/15" : "bg-slate-100 dark:bg-neutral-700"
        }`}
      >
        <Text className="text-lg">{emojiFor(tx.category, tx.type)}</Text>
      </View>

      <View className="ml-3 flex-1">
        <Text
          className="text-[14px] font-semibold text-slate-900 dark:text-slate-100"
          numberOfLines={1}
        >
          {categoryLabel(lang, tx.category)}
          {tx.note ? <Text className="font-normal text-slate-400 dark:text-slate-500"> · {tx.note}</Text> : null}
        </Text>
        <Text className="mt-0.5 text-[12px] text-slate-400 dark:text-slate-500">
          {friendlyDateLabel(tx.date, lang)}
        </Text>
      </View>

      <Text
        className={`mr-1 text-[15px] font-bold ${
          isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-slate-100"
        }`}
      >
        {isIncome ? "+" : "-"}
        {formatMoney(tx.amount, currency)}
      </Text>

      {onDelete ? (
        <Pressable
          onPress={() => onDelete(tx.id)}
          hitSlop={10}
          className="ml-1 h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-neutral-700"
        >
          <Ionicons name="trash-outline" size={15} color="#f43f5e" />
        </Pressable>
      ) : null}
    </View>
  );
}
