import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: "#0e1a2b" }, headerTintColor: "#4aa3df" }}>
      <Stack.Screen name="index" options={{ title: "Clients" }} />
      <Stack.Screen name="client/[id]" options={{ title: "Client" }} />
    </Stack>
  );
}