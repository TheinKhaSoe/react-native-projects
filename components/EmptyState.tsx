import React from "react";
import { Text, View } from "react-native";

interface EmptyStateProps {
  emoji: string;
  title: string;
  subtitle?: string;
}

export function EmptyState({ emoji, title, subtitle }: EmptyStateProps) {
  return (
    <View className="items-center justify-center rounded-2xl border border-dashed border-slate-200 px-6 py-10 dark:border-neutral-600">
      <Text className="text-4xl">{emoji}</Text>
      <Text className="mt-2 text-[15px] font-semibold text-slate-700 dark:text-slate-300">
        {title}
      </Text>
      {subtitle ? (
        <Text className="mt-1 text-center text-[12px] text-slate-400 dark:text-slate-500">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
