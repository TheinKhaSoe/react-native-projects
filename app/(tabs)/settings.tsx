import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/Screen";
import { useWallet } from "@/store/wallet-context";
import type { ThemeMode } from "@/lib/types";

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: string }[] = [
  { value: "system", label: "System", icon: "phone-portrait-outline" },
  { value: "light", label: "Light", icon: "sunny-outline" },
  { value: "dark", label: "Dark", icon: "moon-outline" },
];

/** How long to wait after the last keystroke before auto-saving. */
const AUTOSAVE_MS = 700;

export default function SettingsScreen() {
  const {
    currency,
    theme,
    fixedIncomeDefault,
    username,
    setThemeMode,
    setCurrency,
    setFixedIncomeDefault,
    setUsername,
    resetAll,
  } = useWallet();

  const [nameDraft, setNameDraft] = useState(username);
  const [currencyDraft, setCurrencyDraft] = useState(currency);
  const [salaryDraft, setSalaryDraft] = useState(
    fixedIncomeDefault > 0 ? String(fixedIncomeDefault) : ""
  );
  // Which field is currently flashing the "Saved ✓" badge.
  const [savedKey, setSavedKey] = useState<string | null>(null);

  const saveTimers = useRef<Partial<Record<string, ReturnType<typeof setTimeout>>>>({});
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashSaved = useCallback((key: string) => {
    setSavedKey(key);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setSavedKey(null), 1600);
  }, []);

  /** Debounced auto-save: runs `task` once the user stops typing. */
  const schedule = useCallback(
    (key: string, task: () => Promise<void>) => {
      const pending = saveTimers.current[key];
      if (pending) clearTimeout(pending);
      saveTimers.current[key] = setTimeout(() => {
        delete saveTimers.current[key];
        void task().then(() => flashSaved(key));
      }, AUTOSAVE_MS);
    },
    [flashSaved]
  );

  /** Flush a pending autosave immediately (blur / submit editing). */
  const commit = useCallback(
    (key: string, task: () => Promise<void>) => {
      const pending = saveTimers.current[key];
      if (pending) {
        clearTimeout(pending);
        delete saveTimers.current[key];
      }
      void task().then(() => flashSaved(key));
    },
    [flashSaved]
  );

  // Clear pending timers if the screen unmounts mid-save.
  useEffect(() => {
    const timers = saveTimers.current;
    const flash = flashTimer.current;
    return () => {
      Object.values(timers).forEach((t) => t && clearTimeout(t));
      if (flash) clearTimeout(flash);
    };
  }, []);

  const saveName = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return Promise.resolve(); // never wipe the wallet owner from a cleared field
    return setUsername(trimmed);
  };

  const saveCurrency = (value: string) => setCurrency(value.trim() || "$");

  const saveSalary = (value: string) => {
    const n = Number(value.replace(/,/g, ""));
    return setFixedIncomeDefault(Number.isFinite(n) && n > 0 ? n : 0);
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <Text className="mt-2 text-[22px] font-bold text-slate-900 dark:text-slate-100">
          Settings
        </Text>

        {/* Profile */}
        <SectionTitle text="Profile" />
        <View className="rounded-2xl bg-white px-4 py-3 dark:bg-neutral-800">
          <View className="flex-row items-center justify-between">
            <Text className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
              Your name
            </Text>
            <SavedBadge show={savedKey === "name"} />
          </View>
          <TextInput
            value={nameDraft}
            onChangeText={(v) => {
              setNameDraft(v);
              schedule("name", () => saveName(v));
            }}
            onEndEditing={(e) => {
              const trimmed = e.nativeEvent.text.trim();
              if (!trimmed) {
                // Restore instead of wiping the wallet owner.
                setNameDraft(username);
                return;
              }
              setNameDraft(trimmed);
              commit("name", () => setUsername(trimmed));
            }}
            placeholder="Your name"
            placeholderTextColor="#94a3b8"
            maxLength={30}
            className="mt-1.5 rounded-xl bg-slate-100 px-3 py-2 text-[15px] font-semibold text-slate-900 dark:bg-neutral-700 dark:text-slate-100"
          />
          <Text className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
            This wallet belongs to {username || "you"} · saved automatically
          </Text>
        </View>

        {/* Appearance */}
        <SectionTitle text="Appearance" />
        <View className="flex-row rounded-2xl bg-white p-1.5 dark:bg-neutral-800">
          {THEME_OPTIONS.map((opt) => {
            const active = theme === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setThemeMode(opt.value)}
                className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2.5 ${
                  active ? "bg-emerald-600" : ""
                }`}
              >
                <Ionicons
                  name={opt.icon as keyof typeof Ionicons.glyphMap}
                  size={15}
                  color={active ? "#ffffff" : "#64748b"}
                />
                <Text
                  className={`text-[13px] font-semibold ${
                    active ? "text-white" : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {Platform.OS === "web" ? (
          <Text className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
            On web the colors follow the theme of your browser automatically.
          </Text>
        ) : null}

        {/* Money */}
        <SectionTitle text="Money" />
        <View className="rounded-2xl bg-white px-4 py-3 dark:bg-neutral-800">
          <View className="flex-row items-center justify-between">
            <Text className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
              Currency symbol
            </Text>
            <SavedBadge show={savedKey === "currency"} />
          </View>
          <TextInput
            value={currencyDraft}
            onChangeText={(v) => {
              setCurrencyDraft(v);
              schedule("currency", () => saveCurrency(v));
            }}
            onEndEditing={(e) => {
              const v = e.nativeEvent.text.trim() || "$";
              setCurrencyDraft(v);
              commit("currency", () => setCurrency(v));
            }}
            placeholder="$"
            placeholderTextColor="#94a3b8"
            maxLength={4}
            className="mt-1.5 rounded-xl bg-slate-100 px-3 py-2 text-[15px] font-semibold text-slate-900 dark:bg-neutral-700 dark:text-slate-100"
          />

          <View className="my-3 h-px bg-slate-100 dark:bg-neutral-700" />

          <View className="flex-row items-center justify-between">
            <Text className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
              Monthly fixed income (salary)
            </Text>
            <SavedBadge show={savedKey === "salary"} />
          </View>
          <TextInput
            value={salaryDraft}
            onChangeText={(v) => {
              setSalaryDraft(v);
              schedule("salary", () => saveSalary(v));
            }}
            onEndEditing={(e) => {
              const text = e.nativeEvent.text.replace(/,/g, "");
              const n = Number(text);
              const clean = Number.isFinite(n) && n > 0 ? String(n) : "";
              setSalaryDraft(clean);
              commit("salary", () => setFixedIncomeDefault(n > 0 && Number.isFinite(n) ? n : 0));
            }}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor="#94a3b8"
            className="mt-1.5 rounded-xl bg-slate-100 px-3 py-2 text-[15px] font-semibold text-slate-900 dark:bg-neutral-700 dark:text-slate-100"
          />
          <Text className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
            Counted as income for every month. Extra income can be added per transaction.
          </Text>
        </View>

        {/* Data */}
        <SectionTitle text="Data" />
        <Pressable
          onPress={() =>
            Alert.alert(
              "Reset all data",
              "Deletes your name, budget and every transaction (income, expense, history). You'll set up your profile again. This can't be undone.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Reset",
                  style: "destructive",
                  onPress: () => void resetAll(),
                },
              ]
            )
          }
          className="flex-row items-center justify-between rounded-2xl bg-white px-4 py-3.5 dark:bg-neutral-800"
        >
          <View className="flex-row items-center gap-2">
            <Ionicons name="trash-outline" size={17} color="#f43f5e" />
            <Text className="text-[14px] font-semibold text-rose-500">Reset all data</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
        </Pressable>

        <Text className="mt-6 text-center text-[11px] text-slate-300 dark:text-slate-600">
          Expense Tracker · your data stays on your device
        </Text>
      </ScrollView>
    </Screen>
  );
}

function SectionTitle({ text }: { text: string }) {
  return (
    <Text className="mb-2 mt-5 text-[13px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
      {text}
    </Text>
  );
}

function SavedBadge({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <View className="flex-row items-center gap-1">
      <Ionicons name="checkmark" size={12} color="#059669" />
      <Text className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
        Saved
      </Text>
    </View>
  );
}
