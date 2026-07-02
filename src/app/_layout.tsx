import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#0e1a2b" },
        headerTintColor: "#4aa3df",
        headerTitleStyle: { color: "#ffffff" },
      }}
    >
      {/* the whole tab group — its own layout provides the headers, so hide this one */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* client detail — lives OUTSIDE the tabs, pushed on top */}
      <Stack.Screen name="client/[id]" options={{ title: "Client Details" }} />
      <Stack.Screen name="calculator/[poolId]" options={{ title: "Dosage Calculator" }} />
      <Stack.Screen name="settings" options={{ title: "Settings" }} />
      <Stack.Screen name="invoice/[visitId]" options={{ title: "Invoice" }} />
    </Stack>
  );
}