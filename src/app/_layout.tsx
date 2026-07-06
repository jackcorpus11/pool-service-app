import { Stack, router } from "expo-router";
import { Pressable, Text } from "react-native";

export default function RootLayout() {
  const backButton = () => (
    <Pressable
      onPress={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace("/");
        }
      }}
      style={{ paddingHorizontal: 8, paddingVertical: 4 }}
    >
      <Text style={{ color: "#4aa3df", fontSize: 16, fontWeight: "600" }}>‹ Back</Text>
    </Pressable>
  );

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#0e1a2b" },
        headerTintColor: "#4aa3df",
        headerTitleStyle: { color: "#ffffff" },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="client/[id]" options={{ title: "Client Details", headerLeft: backButton }} />
      <Stack.Screen name="calculator/[poolId]" options={{ title: "Dosage Calculator", headerLeft: backButton }} />
      <Stack.Screen name="invoice/[visitId]" options={{ title: "Invoice", headerLeft: backButton }} />
      <Stack.Screen name="history" options={{ title: "Service History", headerLeft: backButton }} />
      <Stack.Screen name="settings" options={{ title: "Settings", headerLeft: backButton }} />
    </Stack>
  );
}