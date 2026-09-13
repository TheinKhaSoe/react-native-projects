import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Screen } from "@/components/Screen";
import { useWallet } from "@/store/wallet-context";

/**
 * First-run welcome screen. Shown whenever the wallet has no username yet —
 * the root layout renders it instead of the main app until a name is saved.
 */
export default function OnboardingScreen() {
  const { setUsername } = useWallet();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const valid = name.trim().length > 0 && !saving;

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 320, useNativeDriver: false }),
      Animated.spring(translateY, {
        toValue: 0,
        speed: 14,
        bounciness: 6,
        useNativeDriver: false,
      }),
    ]).start();
  }, [opacity, translateY]);

  const submit = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      await setUsername(name.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen className="bg-slate-50 dark:bg-neutral-900">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <Animated.View
          style={{ flex: 1, opacity, transform: [{ translateY }] }}
          className="items-center justify-center px-6"
        >
          <View className="h-20 w-20 items-center justify-center rounded-3xl bg-emerald-600">
            <Text className="text-[40px]">👛</Text>
          </View>
          <Text className="mt-5 text-[24px] font-bold text-slate-900 dark:text-slate-100">
            Welcome to your wallet
          </Text>
          <Text className="mt-1.5 text-center text-[14px] text-slate-500 dark:text-slate-400">
            What should we call you? Your name tells us whose wallet this is.
          </Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor="#94a3b8"
            autoFocus
            maxLength={30}
            onSubmitEditing={() => void submit()}
            returnKeyType="done"
            className="mt-6 w-full rounded-2xl bg-white px-4 py-3.5 text-[16px] text-slate-900 dark:bg-neutral-800 dark:text-slate-100"
          />

          <Pressable
            onPress={() => void submit()}
            disabled={!valid}
            className={`mt-4 w-full items-center rounded-2xl py-4 ${
              valid ? "bg-emerald-600" : "bg-slate-300 dark:bg-neutral-700"
            }`}
          >
            <Text
              className={`text-[15px] font-bold ${
                valid ? "text-white" : "text-slate-500 dark:text-slate-600"
              }`}
            >
              {saving ? "Saving…" : "Continue"}
            </Text>
          </Pressable>

          <Text className="mt-6 text-center text-[11px] text-slate-300 dark:text-slate-600">
            Your data stays on your device
          </Text>
        </Animated.View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
