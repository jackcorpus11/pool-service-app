import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

export default function Home() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Pool Service</Text>
      <Text style={styles.subtitle}>Manage your clients and schedule</Text>

      <Pressable style={styles.tile} onPress={() => router.push("/clients")}>
        <Text style={styles.tileIcon}>👥</Text>
        <Text style={styles.tileText}>Clients</Text>
      </Pressable>

      <Pressable style={styles.tile} onPress={() => router.push("/schedule")}>
        <Text style={styles.tileIcon}>📅</Text>
        <Text style={styles.tileText}>Schedule</Text>
      </Pressable>
      <Pressable style={styles.tile} onPress={() => router.push("/settings")}>
        <Text style={styles.tileIcon}>⚙️</Text>
        <Text style={styles.tileText}>Settings</Text>
      </Pressable>
      <Pressable style={styles.tile} onPress={() => router.push("/history")}>
        <Text style={styles.tileIcon}>📋</Text>
        <Text style={styles.tileText}>Service History</Text>
      </Pressable>
      <Pressable style={styles.tile} onPress={() => router.push("/quote/new")}>
  <Text style={styles.tileIcon}>📝</Text>
  <Text style={styles.tileText}>New Quote</Text>
</Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { color: "#4aa3df", fontSize: 32, fontWeight: "bold", textAlign: "center" },
  subtitle: { color: "#7a8a9a", fontSize: 16, textAlign: "center", marginBottom: 40 },
  tile: { backgroundColor: "#1b2a3d", borderRadius: 14, padding: 24, marginBottom: 16, alignItems: "center", borderWidth: 1, borderColor: "#33485f" },
  tileIcon: { fontSize: 40, marginBottom: 8 },
  tileText: { color: "#ffffff", fontSize: 18, fontWeight: "600" },
  container: { flex: 1, backgroundColor: "#0e1a2b" },
  content: { padding: 24, justifyContent: "center", alignItems: "center", flexGrow: 1 },
});