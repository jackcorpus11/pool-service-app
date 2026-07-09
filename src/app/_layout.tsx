import { Stack, router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { AuthProvider, useAuth } from "../lib/auth";

function RootNavigator() {
  const { session, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      // logged out → go to login
      router.replace("/login");
    } else {
      // logged in → go to the app
      router.replace("/");
    }
  }, [session, loading]);

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

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0e1a2b", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color="#4aa3df" size="large" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#0e1a2b" },
        headerTintColor: "#4aa3df",
        headerTitleStyle: { color: "#ffffff" },
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="client/[id]" options={{ title: "Client Details", headerLeft: backButton }} />
      <Stack.Screen name="calculator/[poolId]" options={{ title: "Dosage Calculator", headerLeft: backButton }} />
      <Stack.Screen name="invoice/[visitId]" options={{ title: "Invoice", headerLeft: backButton }} />
      <Stack.Screen name="history" options={{ title: "Service History", headerLeft: backButton }} />
      <Stack.Screen name="settings" options={{ title: "Settings", headerLeft: backButton }} />
      <Stack.Screen name="quote/new" options={{ title: "New Quote", headerLeft: backButton }} />
      <Stack.Screen name="quotes" options={{ title: "Quotes", headerLeft: backButton }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}