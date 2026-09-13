import "../global.css";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { Platform, View } from "react-native";
import { WalletProvider, useWallet } from "@/store/wallet-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import OnboardingScreen from "./onboarding";

function RootNav() {
  const { resolved, ready, username } = useWallet();
  return (
    <View className="flex-1 bg-slate-50 dark:bg-neutral-900">
      <StatusBar style={resolved === "dark" ? "light" : "dark"} />
      <ErrorBoundary>
        {/* First run: ask who owns this wallet before showing the app. */}
        {!ready ? null : !username ? (
          <OnboardingScreen />
        ) : (
          <Stack
            screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "transparent" } }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="add"
              options={{
                // On web the native stack can't animate screen swaps, so use a
                // transparent modal to keep the previous screen visible while the
                // Add screen fades in (see app/add.tsx). Native slides up smoothly.
                presentation: Platform.OS === "web" ? "transparentModal" : "modal",
                animation: Platform.OS === "web" ? "fade" : "slide_from_bottom",
              }}
            />
          </Stack>
        )}
      </ErrorBoundary>
    </View>
  );
}

export default function RootLayout() {
  return (
    <WalletProvider>
      <RootNav />
    </WalletProvider>
  );
}
