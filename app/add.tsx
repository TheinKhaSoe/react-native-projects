import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Screen } from "@/components/Screen";
import { useT, useWallet } from "@/store/wallet-context";
import { categoriesFor } from "@/lib/categories";
import { formatMoney, parseAmount } from "@/lib/money";
import { todayISO, shiftDays } from "@/lib/dates";
import { categoryLabel } from "@/lib/i18n";

export default function AddTransactionScreen() {
  const params = useLocalSearchParams<{ type?: string; amount?: string }>();
  const paramType: "expense" | "income" = params.type === "income" ? "income" : "expense";
  const { currency, username, lang, addTransaction, setFixedIncomeDefault } = useWallet();
  const t = useT();

  const [type, setType] = useState<"expense" | "income">(paramType);
  // Keep the screen in sync if it is re-opened with different params.
  useEffect(() => {
    setType(paramType);
    setCategory(paramType === "income" ? "Salary" : "Food");
  }, [paramType]);
  const [amountText, setAmountText] = useState(
    params.amount && parseAmount(params.amount) ? params.amount : ""
  );
  const [category, setCategory] = useState<string>(
    paramType === "income" ? "Salary" : "Food"
  );
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayISO());
  const [showPicker, setShowPicker] = useState(false);
  const [asFixedSalary, setAsFixedSalary] = useState(false);
  const [saving, setSaving] = useState(false);

  // Web's native stack can't animate screen swaps, so ease the modal content in
  // (fade + rise + subtle scale) once it mounts. Native already animates the modal.
  const animateEntry = Platform.OS === "web";
  const entryOpacity = useRef(new Animated.Value(animateEntry ? 0 : 1)).current;
  const entryTranslateY = useRef(new Animated.Value(animateEntry ? 24 : 0)).current;
  const entryScale = useRef(new Animated.Value(animateEntry ? 0.97 : 1)).current;

  useEffect(() => {
    if (!animateEntry) return;
    Animated.parallel([
      Animated.timing(entryOpacity, { toValue: 1, duration: 200, useNativeDriver: false }),
      Animated.spring(entryTranslateY, {
        toValue: 0,
        speed: 18,
        bounciness: 5,
        useNativeDriver: false,
      }),
      Animated.spring(entryScale, {
        toValue: 1,
        speed: 18,
        bounciness: 5,
        useNativeDriver: false,
      }),
    ]).start();
  }, [animateEntry, entryOpacity, entryTranslateY, entryScale]);

  const amount = parseAmount(amountText);
  const valid = amount !== null && amount > 0 && !saving;

  // Amount box grows with the number so long values (e.g. 100000) stay fully
  // visible — the old fixed `w-40` clipped digits at ~6 characters.
  const { width: windowWidth } = useWindowDimensions();
  const amountBoxWidth = useMemo(
    () =>
      Math.min(
        windowWidth - 96, // leave room for the currency symbol + screen padding
        Math.max(160, amountText.replace(/[^0-9.]/g, "").length * 26 + 32)
      ),
    [amountText, windowWidth]
  );

  const categoryList = useMemo(() => categoriesFor(type), [type]);

  const switchType = (typeVal: "expense" | "income") => {
    setType(typeVal);
    setCategory(typeVal === "income" ? "Salary" : "Food");
  };

  const pickDate = (iso: string) => {
    setDate(iso);
    setShowPicker(false);
  };

  const save = async () => {
    if (!valid || amount === null) return;
    setSaving(true);
    try {
      await addTransaction({ type, amount, category, note: note.trim() || null, date });
      if (type === "income" && asFixedSalary && amount > 0) {
        await setFixedIncomeDefault(amount);
      }
    } catch (e) {
      Alert.alert(
        "Could not save",
        e instanceof Error ? e.message : String(e)
      );
      setSaving(false);
      return;
    }
    setSaving(false);
    if (router.canDismiss()) router.back();
    else router.replace("/");
  };

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: entryOpacity,
        transform: [{ translateY: entryTranslateY }, { scale: entryScale }],
      }}
    >
      <Screen className="bg-slate-50 dark:bg-neutral-900">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View className="mt-1 flex-row items-center justify-between">
          <View>
            <Text className="text-[20px] font-bold text-slate-900 dark:text-slate-100">
              {t("add.title")}
            </Text>
            <Text className="mt-0.5 text-[12px] text-slate-400 dark:text-slate-500">
              {username ? `${username}'s wallet` : t("wallet.generic")}
            </Text>
          </View>
          <Pressable
            onPress={() => router.back()}
            className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-neutral-700"
          >
            <Ionicons name="close" size={18} color="#64748b" />
          </Pressable>
        </View>

        {/* Type switch */}
        <View className="mt-4 flex-row rounded-2xl bg-white p-1.5 dark:bg-neutral-800">
          {(["expense", "income"] as const).map((typeVal) => {
            const active = type === typeVal;
            return (
              <Pressable
                key={typeVal}
                onPress={() => switchType(typeVal)}
                className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2.5 ${
                  active ? (typeVal === "income" ? "bg-emerald-600" : "bg-rose-500") : ""
                }`}
              >
                <Ionicons
                  name={typeVal === "income" ? "arrow-down-circle" : "arrow-up-circle"}
                  size={16}
                  color={active ? "#ffffff" : "#94a3b8"}
                />
                <Text
                  className={`text-[14px] font-bold ${
                    active ? "text-white" : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  {typeVal === "income" ? t("action.income") : t("action.expense")}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Amount */}
        <View className="mt-6 items-center">
          <Text className="text-[12px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
            {t("add.amount")}
          </Text>
          <View className="mt-2 flex-row items-center justify-center">
            <TextInput
              value={amountText}
              onChangeText={setAmountText}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor="#cbd5e1"
              maxLength={15}
              autoFocus
              className="text-[40px] font-bold text-slate-900 dark:text-slate-100"
              style={{
                width: amountBoxWidth,
                textAlign: "center",
                paddingVertical: 0,
              }}
            />
            <Text className="ml-1 text-[28px] font-bold text-slate-400 dark:text-slate-500">
              {currency}
            </Text>
          </View>
          {amount !== null && amount > 0 ? (
            <Text className="mt-1 text-[12px] text-slate-400 dark:text-slate-500">
              {formatMoney(amount, currency)}
            </Text>
          ) : null}
        </View>

        {/* Categories */}
        <Text className="mb-2 mt-6 text-[12px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          {t("add.category")}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {categoryList.map((c) => {
            const active = category === c.name;
            return (
              <Pressable
                key={c.name}
                onPress={() => setCategory(c.name)}
                className={`flex-row items-center gap-1.5 rounded-2xl px-3.5 py-2.5 ${
                  active ? "bg-emerald-600" : "bg-white dark:bg-neutral-800"
                }`}
              >
                <Text className="text-[15px]">{c.emoji}</Text>
                <Text
                  className={`text-[13px] font-semibold ${
                    active ? "text-white" : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {categoryLabel(lang, c.name)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Note */}
        <Text className="mb-2 mt-6 text-[12px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          {t("add.note")}
        </Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder={t("add.notePlaceholder")}
          placeholderTextColor="#94a3b8"
          className="rounded-2xl bg-white px-4 py-3 text-[14px] text-slate-900 dark:bg-neutral-800 dark:text-slate-100"
        />

        {/* Date */}
        <Text className="mb-2 mt-6 text-[12px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          {t("add.date")}
        </Text>
        <View className="flex-row flex-wrap items-center gap-2">
          {[
            { label: t("add.today"), iso: todayISO() },
            { label: t("add.yesterday"), iso: shiftDays(todayISO(), -1) },
          ].map((opt) => {
            const active = date === opt.iso && !showPicker;
            return (
              <Pressable
                key={opt.label}
                onPress={() => pickDate(opt.iso)}
                className={`rounded-2xl px-3.5 py-2.5 ${
                  active ? "bg-emerald-600" : "bg-white dark:bg-neutral-800"
                }`}
              >
                <Text
                  className={`text-[13px] font-semibold ${
                    active ? "text-white" : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
          {Platform.OS !== "web" ? (
            <Pressable
              onPress={() => setShowPicker(true)}
              className={`flex-row items-center gap-1.5 rounded-2xl px-3.5 py-2.5 ${
                showPicker ? "bg-emerald-600" : "bg-white dark:bg-neutral-800"
              }`}
            >
              <Ionicons
                name="calendar-outline"
                size={15}
                color={showPicker ? "#ffffff" : "#64748b"}
              />
              <Text
                className={`text-[13px] font-semibold ${
                  showPicker ? "text-white" : "text-slate-600 dark:text-slate-300"
                }`}
              >
                {t("add.pickDate")}
              </Text>
            </Pressable>
          ) : null}
        </View>
        {showPicker && Platform.OS !== "web" ? (
          <View className="mt-2 overflow-hidden rounded-2xl bg-white dark:bg-neutral-800">
            <DateTimePicker
              value={new Date(`${date}T12:00:00`)}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={(_e, selected) => {
                if (selected) {
                  const iso = `${selected.getFullYear()}-${`${selected.getMonth() + 1}`.padStart(2, "0")}-${`${selected.getDate()}`.padStart(2, "0")}`;
                  pickDate(iso);
                }
              }}
            />
          </View>
        ) : null}

        {/* Fixed salary switch (income only) */}
        {type === "income" ? (
          <View className="mt-5 flex-row items-center justify-between rounded-2xl bg-white px-4 py-3.5 dark:bg-neutral-800">
            <View className="mr-3 flex-1">
              <Text className="text-[14px] font-semibold text-slate-800 dark:text-slate-200">
                {t("add.fixedSalary")}
              </Text>
              <Text className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                {t("add.fixedSalaryHint")}
              </Text>
            </View>
            <Switch
              value={asFixedSalary}
              onValueChange={setAsFixedSalary}
              trackColor={{ false: "#cbd5e1", true: "#059669" }}
              thumbColor="#ffffff"
            />
          </View>
        ) : null}

        {/* Save */}
        <Pressable
          onPress={() => void save()}
          disabled={!valid}
          className={`mt-6 items-center rounded-2xl py-4 ${
            valid
              ? type === "income"
                ? "bg-emerald-600"
                : "bg-rose-500"
              : "bg-slate-300 dark:bg-neutral-700"
          }`}
        >
          <Text
            className={`text-[15px] font-bold ${
              valid ? "text-white" : "text-slate-500 dark:text-slate-600"
            }`}
          >
            {saving ? t("add.saving") : t(type === "income" ? "add.addIncome" : "add.addExpense")}
          </Text>
        </Pressable>
      </ScrollView>
      </Screen>
    </Animated.View>
  );
}
