import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

interface State {
  error: Error | null;
}

/**
 * Catches render errors anywhere below the root navigator and shows a
 * friendly recovery screen (with the real message) instead of a red crash.
 */
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error): void {
    console.error("App error caught by ErrorBoundary:", error);
  }

  render() {
    const { error } = this.state;
    if (error) {
      return (
        <View className="flex-1 items-center justify-center bg-slate-50 px-6 dark:bg-neutral-900">
          <Text className="text-4xl">😥</Text>
          <Text className="mt-3 text-[17px] font-bold text-slate-900 dark:text-slate-100">
            Something went wrong
          </Text>
          <ScrollView className="mt-2 max-h-32 self-stretch">
            <Text className="text-center text-[12px] text-slate-500 dark:text-slate-400">
              {error.message}
            </Text>
          </ScrollView>
          <Pressable
            onPress={() => this.setState({ error: null })}
            className="mt-6 rounded-2xl bg-emerald-600 px-6 py-3.5"
          >
            <Text className="text-[14px] font-bold text-white">Try again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}
