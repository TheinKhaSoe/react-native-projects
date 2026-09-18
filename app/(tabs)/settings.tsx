import { Screen } from "@/components/Screen";
import { type TKey } from "@/lib/i18n";
import type { LanguageMode, ThemeMode } from "@/lib/types";
import { useT, useWallet } from "@/store/wallet-context";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: string }[] = [
  { value: "system", label: "System", icon: "phone-portrait-outline" },
  { value: "light", label: "Light", icon: "sunny-outline" },
  { value: "dark", label: "Dark", icon: "moon-outline" },
];

const LANG_OPTIONS: { value: LanguageMode; labelKey: string; icon: string }[] =
  [
    {
      value: "system",
      labelKey: "set.langHint",
      icon: "phone-portrait-outline",
    },
    { value: "en", labelKey: "set.langEn", icon: "language-outline" },
    { value: "my", labelKey: "set.langMy", icon: "language-outline" },
  ];

/** How long to wait after the last keystroke before auto-saving. */
const AUTOSAVE_MS = 700;

export default function SettingsScreen() {
  const {
    currency,
    theme,
    fixedIncomeDefault,
    username,
    language,
    setThemeMode,
    setCurrency,
    setFixedIncomeDefault,
    setUsername,
    setLanguage,
    resetAll,
  } = useWallet();
  const t = useT();

  const [nameDraft, setNameDraft] = useState(username);
  const [currencyDraft, setCurrencyDraft] = useState(currency);
  const [salaryDraft, setSalaryDraft] = useState(
    fixedIncomeDefault > 0 ? String(fixedIncomeDefault) : "",
  );
  // Which field is currently flashing the "Saved ✓" badge.
  const [savedKey, setSavedKey] = useState<string | null>(null);

  const saveTimers = useRef<
    Partial<Record<string, ReturnType<typeof setTimeout>>>
  >({});
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync drafts when settings change from other places (e.g. reset).
  useEffect(() => {
    setNameDraft(username);
    setCurrencyDraft(currency);
    setSalaryDraft(fixedIncomeDefault > 0 ? String(fixedIncomeDefault) : "");
  }, [username, currency, fixedIncomeDefault]);

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
    [flashSaved],
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
    [flashSaved],
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

  const saveLanguage = useCallback(
    (mode: LanguageMode) => setLanguage(mode),
    [setLanguage],
  );

  return (
    <Screen style={{ marginBottom: -35 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <Text className="mt-2 text-[22px] font-bold text-slate-900 dark:text-slate-100">
          {t("set.title")}
        </Text>

        {/* Profile */}
        <SectionTitle text={t("set.profile")} />
        <View className="rounded-2xl bg-white px-4 py-3 dark:bg-neutral-800">
          <View className="flex-row items-center justify-between">
            <Text className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
              {t("set.name")}
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
            placeholder={t("set.name")}
            placeholderTextColor="#94a3b8"
            maxLength={30}
            className="mt-1.5 rounded-xl bg-slate-100 px-3 py-2 text-[15px] font-semibold text-slate-900 dark:bg-neutral-700 dark:text-slate-100"
          />
          <Text className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
            {t("set.nameHint", {
              name: username || t("onb.namePlaceholder").toLowerCase(),
            })}
          </Text>
        </View>

        {/* Appearance */}
        <SectionTitle text={t("set.appearance")} />
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
                  {opt.value === "system"
                    ? t("theme.system")
                    : opt.value === "light"
                      ? t("theme.light")
                      : t("theme.dark")}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {Platform.OS === "web" ? (
          <Text className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
            {t("set.langHint")}
          </Text>
        ) : null}

        {/* Language */}
        <SectionTitle text={t("set.language")} />
        <View className="flex-row rounded-2xl bg-white p-1.5 dark:bg-neutral-800">
          {LANG_OPTIONS.map((opt) => {
            const active = language === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => void saveLanguage(opt.value)}
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
                  {t(opt.labelKey as TKey)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Money */}
        <SectionTitle text={t("set.money")} />
        <View className="rounded-2xl bg-white px-4 py-3 dark:bg-neutral-800">
          <View className="flex-row items-center justify-between">
            <Text className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
              {t("set.currency")}
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
              {t("set.salary")}
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
              commit("salary", () =>
                setFixedIncomeDefault(n > 0 && Number.isFinite(n) ? n : 0),
              );
            }}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor="#94a3b8"
            className="mt-1.5 rounded-xl bg-slate-100 px-3 py-2 text-[15px] font-semibold text-slate-900 dark:bg-neutral-700 dark:text-slate-100"
          />
          <Text className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
            {t("set.moneyHint")}
          </Text>
        </View>

        {/* Data */}
        <SectionTitle text={t("set.data")} />
        <Pressable
          onPress={() =>
            Alert.alert(t("set.reset"), t("set.resetMsg"), [
              { text: t("alert.cancel"), style: "cancel" },
              {
                text: t("alert.reset"),
                style: "destructive",
                onPress: () => void resetAll(),
              },
            ])
          }
          className="flex-row items-center justify-between rounded-2xl bg-white px-4 py-3.5 dark:bg-neutral-800"
        >
          <View className="flex-row items-center gap-2">
            <Ionicons name="trash-outline" size={17} color="#f43f5e" />
            <Text className="text-[14px] font-semibold text-rose-500">
              {t("set.reset")}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
        </Pressable>

        <Text className="mt-6 px-4 text-center text-[13px] text-slate-300 dark:text-slate-600">
          {t("set.footer")} Powered by
          <Text className="text-emerald-500 font-bold dark:text-yellow-700">
            {" "}
            TheinKha
          </Text>
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
