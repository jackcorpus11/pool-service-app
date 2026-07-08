import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      setError("Incorrect email or password.");
    }
    // on success, the auth listener handles the redirect automatically
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pool Service</Text>
      <Text style={styles.subtitle}>Log in to continue</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#7a8a9a"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#7a8a9a"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? "Logging in..." : "Log in"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0e1a2b", justifyContent: "center", padding: 32 },
  title: { color: "#4aa3df", fontSize: 32, fontWeight: "bold", textAlign: "center" },
  subtitle: { color: "#7a8a9a", fontSize: 16, textAlign: "center", marginTop: 4, marginBottom: 32 },
  input: { backgroundColor: "#1b2a3d", color: "#ffffff", fontSize: 16, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: "#33485f", marginBottom: 12 },
  error: { color: "#d9534f", fontSize: 14, marginBottom: 12, textAlign: "center" },
  button: { backgroundColor: "#4aa3df", alignItems: "center", paddingVertical: 16, borderRadius: 10, marginTop: 8 },
  buttonText: { color: "#0e1a2b", fontSize: 16, fontWeight: "600" },
});