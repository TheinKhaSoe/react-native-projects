import { Screen } from "@/components/Screen";
import { interpret, welcomeMessage, type BotData } from "@/lib/chatbot";
import { useT, useWallet } from "@/store/wallet-context";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ChatMessage {
  id: string;
  role: "user" | "bot";
  text: string;
}

/**
 * Height of the software keyboard (0 when closed), measured directly instead
 * of relying on KeyboardAvoidingView — which does nothing on web and is
 * unreliable on Android when edge-to-edge is enabled (the OS ignores
 * "adjustResize" and the "height" behavior doesn't always fire).
 * On web there are no Keyboard events at all; the visual viewport shrinks
 * when the mobile keyboard opens, so we measure that instead.
 */
function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (Platform.OS === "web") {
      const vv = window.visualViewport;
      if (!vv) return;
      const update = () => {
        const overlap = Math.max(
          0,
          window.innerHeight - vv.height - vv.offsetTop,
        );
        setHeight(overlap > 120 ? overlap : 0);
      };
      update();
      vv.addEventListener("resize", update);
      vv.addEventListener("scroll", update);
      return () => {
        vv.removeEventListener("resize", update);
        vv.removeEventListener("scroll", update);
      };
    }

    const showName =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideName =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showName, (e) =>
      setHeight(e.endCoordinates.height),
    );
    const hide = Keyboard.addListener(hideName, () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return height;
}

let msgSeq = 0;
function makeMessage(role: ChatMessage["role"], text: string): ChatMessage {
  msgSeq += 1;
  return { id: `m${msgSeq}`, role, text };
}

export default function ChatScreen() {
  const { buildBotContext, lang } = useWallet();
  const t = useT();
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();

  const SUGGESTIONS: [string, string][] = [
    [t("sug.today"), "Spent today?"],
    [t("sug.incomeMonth"), "Income this month"],
    [t("sug.budgetLeft"), "Budget left"],
    [t("sug.summary"), "Summary"],
    [t("sug.addExpense"), "Add expense 5000 lunch"],
  ];

  const [messages, setMessages] = useState<ChatMessage[]>([
    makeMessage("bot", welcomeMessage(t)),
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);

  useEffect(() => {
    setMessages([makeMessage("bot", welcomeMessage(t))]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const send = useCallback(
    async (raw?: string, display?: string) => {
      const text = (raw ?? input).trim();
      if (!text || thinking) return;

      setMessages((prev) => [makeMessage("user", display ?? text), ...prev]);
      setInput("");
      setThinking(true);

      try {
        const data: BotData = await buildBotContext();
        const reply = await interpret(text, data);
        setTimeout(() => {
          setMessages((prev) => [makeMessage("bot", reply), ...prev]);
          setThinking(false);
        }, 350);
      } catch {
        setMessages((prev) => [
          makeMessage("bot", t("chat.placeholder")),
          ...prev,
        ]);
        setThinking(false);
      }
    },
    [input, thinking, buildBotContext, t],
  );

  const composerBottom =
    keyboardHeight > 0 ? keyboardHeight + 8 : insets.bottom + 8;

  return (
    <Screen padded={false} bottomInset={false} style={{ marginBottom: -40 }}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16 }}>
          <View className="mt-2 flex-row items-center gap-2.5">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-emerald-600">
              <Ionicons name="sparkles" size={18} color="#ffffff" />
            </View>
            <View>
              <Text className="text-[17px] font-bold text-slate-900 dark:text-slate-100">
                {t("chat.assistant")}
              </Text>
              <Text className="text-[11px] text-emerald-600 dark:text-emerald-400">
                {thinking ? t("chat.typing") : t("chat.online")}
              </Text>
            </View>
          </View>
        </View>

        <FlatList
          data={messages}
          inverted
          keyExtractor={(m) => m.id}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 8,
            paddingTop: 16,
          }}
          renderItem={({ item }) => <Bubble message={item} />}
        />

        {/* Composer — compact: chips in one scroll row + input/send row */}
        <View
          className="border-t border-slate-200 px-4 pt-2 bg-transparent"
          style={{ paddingBottom: composerBottom }}
        >
          <View className="flex-row flex-wrap gap-2 pb-2">
            {SUGGESTIONS.map(([label, trigger], i) => (
              <Pressable
                key={i}
                onPress={() => void send(trigger, label)}
                className="rounded-full border border-slate-200 bg-lime-500 px-3 py-1.5 dark:border-neutral-600 dark:bg-neutral-800"
              >
                <Text className="text-[12px] font-medium text-white dark:text-slate-300">
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
          <View className="flex-row items-end gap-2">
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={t("chat.placeholder")}
              placeholderTextColor="#94a3b8"
              multiline
              className="max-h-24 min-h-[40px] flex-1 rounded-2xl bg-white px-4 py-2.5 text-[14px] text-slate-900 dark:bg-neutral-800 dark:text-slate-100"
              onSubmitEditing={() => void send()}
              returnKeyType="send"
            />
            <Pressable
              onPress={() => void send()}
              disabled={!input.trim() || thinking}
              className={`h-11 w-11 items-center justify-center rounded-full ${
                input.trim() && !thinking
                  ? "bg-emerald-600"
                  : "bg-slate-300 dark:bg-neutral-700"
              }`}
            >
              <Ionicons
                name="arrow-up"
                size={20}
                color={input.trim() && !thinking ? "#ffffff" : "#94a3b8"}
              />
            </Pressable>
          </View>
        </View>
      </View>
    </Screen>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <View
      className={`mb-2 max-w-[85%] ${isUser ? "self-end" : "self-start"} flex-row ${isUser ? "flex-row-reverse" : ""}`}
    >
      {!isUser ? (
        <View className="mr-2 h-7 w-7 items-center justify-center self-end rounded-full bg-emerald-600">
          <Ionicons name="sparkles" size={13} color="#ffffff" />
        </View>
      ) : null}
      <View
        className={`rounded-2xl px-3.5 py-2.5 ${
          isUser ? "bg-emerald-600" : "bg-white dark:bg-neutral-800"
        }`}
      >
        <Text
          className={`text-[14px] leading-5 ${
            isUser ? "text-white" : "text-slate-800 dark:text-slate-200"
          }`}
        >
          {message.text}
        </Text>
      </View>
    </View>
  );
}
