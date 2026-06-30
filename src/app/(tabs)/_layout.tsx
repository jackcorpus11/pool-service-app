import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        // ── this block styles the whole tab bar + headers ──
        headerStyle: { backgroundColor: "#0e1a2b" },      // top header color
        headerTintColor: "#4aa3df",                        // header text/icons
        headerTitleStyle: { color: "#ffffff" },            // header title color
        tabBarStyle: { backgroundColor: "#0e1a2b", borderTopColor: "#1b2a3d" }, // the bar itself
        tabBarActiveTintColor: "#4aa3df",                  // selected tab color
        tabBarInactiveTintColor: "#7a8a9a",                // unselected tab color
      }}
    >
      {/* ── each Tabs.Screen = one tab; order here = order in the bar ── */}
      <Tabs.Screen
        name="index"                                       // matches index.tsx
        options={{ title: "Home", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🏠</Text> }}
      />
      <Tabs.Screen
        name="clients"                                     // matches clients.tsx
        options={{ title: "Clients", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>👥</Text> }}
      />
      <Tabs.Screen
        name="schedule"                                    // matches schedule.tsx
        options={{ title: "Schedule", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📅</Text> }}
      />
      <Tabs.Screen
        name="map"
        options={{ title: "Map", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🗺️</Text> }}
      />
    </Tabs>
  );
}