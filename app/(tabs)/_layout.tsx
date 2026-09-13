import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useWallet } from "@/store/wallet-context";

export default function TabsLayout() {
  const { resolved } = useWallet();
  const dark = resolved === "dark";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: dark ? "#34d399" : "#059669",
        tabBarInactiveTintColor: dark ? "#64748b" : "#94a3b8",
        tabBarStyle: {
          backgroundColor: dark ? "#262626" : "#ffffff",
          borderTopColor: dark ? "#404040" : "#e2e8f0",
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Wallet",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={dark ? "wallet" : "wallet-outline"} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name={dark ? "stats-chart" : "stats-chart-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name={dark ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name={dark ? "settings" : "settings-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
