import { Stack, router } from "expo-router";
import { Pressable, Text } from "react-native";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#0e1a2b" },
        headerTintColor: "#4aa3df",
        headerTitleStyle: { color: "#ffffff" },
      }}
    >
      {/* Clients list — Schedule button on the RIGHT */}
      <Stack.Screen
        name="index"
        options={{
          title: "Clients",
          headerRight: () => (
            <Pressable onPress={() => router.push("./schedule")} style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
              <Text style={{ color: "#4aa3df", fontSize: 16, fontWeight: "600" }}>Schedule ›</Text>
            </Pressable>
          ),
        }}
      />

      {/* Client detail — "Clients" button on the LEFT */}
      <Stack.Screen
        name="client/[id]"
        options={{
          title: "Client Details",
          headerLeft: () => (
            <Pressable onPress={() => router.replace("/")} style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
              <Text style={{ color: "#4aa3df", fontSize: 16, fontWeight: "600" }}>‹ Clients</Text>
            </Pressable>
          ),
        }}
      />

      {/* Schedule screen */}
      <Stack.Screen name="schedule" options={{ title: "Schedule" }} />
    </Stack>
  );
}