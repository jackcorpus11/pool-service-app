import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput } from "react-native";
import { fetchSettings, updateSettings } from "../lib/settings";
import { supabase } from "../lib/supabase";


export default function SettingsScreen() {
  const [businessName, setBusinessName] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [markup, setMarkup] = useState("");
  const [laborRate, setLaborRate] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings()
      .then((s) => {
        setBusinessName(s.businessName);
        setBusinessPhone(s.businessPhone);
        setMarkup(String(s.partsMarkupPercent));
        setLaborRate(String(s.laborRate));
      })
      .catch((e) => console.log("Error loading settings:", e.message));
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  async function save() {
    try {
      await updateSettings({
        businessName: businessName.trim(),
        businessPhone: businessPhone.trim(),
        partsMarkupPercent: Number(markup.replace(/,/g, "")) || 0,
        laborRate: Number(laborRate.replace(/,/g, "")) || 0,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.log("Error saving settings:", (error as Error).message);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24 }}>
      <Text style={styles.heading}>Business Settings</Text>

      <Text style={styles.label}>Business name</Text>
      <TextInput style={styles.input} value={businessName} onChangeText={setBusinessName}
        placeholder="e.g. Blue Water Pools" placeholderTextColor="#7a8a9a" />

      <Text style={styles.label}>Business phone</Text>
      <TextInput style={styles.input} value={businessPhone} onChangeText={setBusinessPhone}
        placeholder="Phone number" placeholderTextColor="#7a8a9a" keyboardType="phone-pad" />

      <Text style={styles.sectionLabel}>Default rates (used on new invoices)</Text>

      <Text style={styles.label}>Parts markup %</Text>
      <TextInput style={styles.input} value={markup} onChangeText={setMarkup}
        placeholder="e.g. 25" placeholderTextColor="#7a8a9a" keyboardType="numeric" />
      <Text style={styles.hint}>Added to your cost. 25 means a $40 part is charged at $50.</Text>

      <Text style={styles.label}>Labor rate ($/hour)</Text>
      <TextInput style={styles.input} value={laborRate} onChangeText={setLaborRate}
        placeholder="e.g. 100" placeholderTextColor="#7a8a9a" keyboardType="numeric" />

      <Pressable style={styles.button} onPress={save}>
        <Text style={styles.buttonText}>{saved ? "✓ Saved" : "Save settings"}</Text>
      </Pressable>
      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0e1a2b" },
  heading: { color: "#4aa3df", fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  sectionLabel: { color: "#4aa3df", fontSize: 16, fontWeight: "600", marginTop: 24, marginBottom: 8 },
  label: { color: "#cccccc", fontSize: 14, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: "#1b2a3d", color: "#ffffff", fontSize: 16, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: "#33485f" },
  hint: { color: "#7a8a9a", fontSize: 12, marginTop: 4 },
  button: { backgroundColor: "#4aa3df", alignItems: "center", paddingVertical: 14, borderRadius: 10, marginTop: 28 },
  buttonText: { color: "#0e1a2b", fontSize: 16, fontWeight: "600" },
  logoutButton: { alignItems: "center", paddingVertical: 14, borderRadius: 10, marginTop: 16, borderWidth: 1, borderColor: "#d9534f" },
  logoutText: { color: "#d9534f", fontSize: 16, fontWeight: "600" },
});