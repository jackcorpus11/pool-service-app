import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import {
    createClient,
    deleteClientById,
    fetchClients,
    updateClient,
} from "../../lib/clients";
import { Client } from "../../types/client";

export default function Clients() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchClients();
        setClients(data);
      } catch (error) {
        console.log("Error loading clients:", (error as Error).message);
      }
    }
    load();
  }, []);

  function resetForm() {
    setName("");
    setAddress("");
    setPhone("");
    setEditingId(null);
  }

  async function saveClient() {
    if (name.trim() === "") return;
    const details = { name: name.trim(), address: address.trim(), phone: phone.trim() };
    try {
      if (editingId === null) {
        const newClient = await createClient(details);
        setClients([...clients, newClient]);
      } else {
        const updated = await updateClient(editingId, details);
        setClients(clients.map((c) => (c.id === editingId ? updated : c)));
      }
      resetForm();
    } catch (error) {
      console.log("Error saving client:", (error as Error).message);
    }
  }

  function startEdit(client: Client) {
    setName(client.name);
    setAddress(client.address);
    setPhone(client.phone);
    setEditingId(client.id);
  }

  async function deleteClient(id: string) {
    try {
      await deleteClientById(id);
      setClients(clients.filter((c) => c.id !== id));
      if (editingId === id) resetForm();
    } catch (error) {
      console.log("Error deleting client:", (error as Error).message);
    }
  }

  return (
    <View style={styles.container}>
      <TextInput style={styles.input} placeholder="Client name" placeholderTextColor="#7a8a9a"
        value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Address" placeholderTextColor="#7a8a9a"
        value={address} onChangeText={setAddress} />
      <TextInput style={styles.input} placeholder="Phone number" placeholderTextColor="#7a8a9a"
        value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

      <View style={styles.formButtons}>
        <Pressable style={styles.button} onPress={saveClient}>
          <Text style={styles.buttonText}>
            {editingId === null ? "Add client" : "Update client"}
          </Text>
        </Pressable>
        {editingId !== null && (
          <Pressable style={styles.cancelButton} onPress={resetForm}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        style={styles.list}
        data={clients}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/client/${item.id}`)}>
            <Text style={styles.cardName}>{item.name}</Text>
            <Text style={styles.cardDetail}>{item.phone || "No phone"}</Text>
            <Text style={styles.cardDetail}>{item.address || "No address"}</Text>
            <View style={styles.cardButtons}>
              <Pressable style={styles.editButton} onPress={() => startEdit(item)}>
                <Text style={styles.editText}>Edit</Text>
              </Pressable>
              <Pressable style={styles.deleteButton} onPress={() => deleteClient(item.id)}>
                <Text style={styles.deleteText}>Delete</Text>
              </Pressable>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No clients yet. Add one above.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0e1a2b", padding: 24 },
  input: { backgroundColor: "#1b2a3d", color: "#ffffff", fontSize: 16, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: "#33485f", marginBottom: 10 },
  formButtons: { flexDirection: "row", gap: 10, marginBottom: 20 },
  button: { flex: 1, backgroundColor: "#4aa3df", alignItems: "center", paddingVertical: 14, borderRadius: 10 },
  buttonText: { color: "#0e1a2b", fontSize: 16, fontWeight: "600" },
  cancelButton: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 10, borderWidth: 1, borderColor: "#33485f", alignItems: "center" },
  cancelText: { color: "#cccccc", fontSize: 16 },
  list: { flex: 1 },
  card: { backgroundColor: "#1b2a3d", padding: 16, borderRadius: 10, marginBottom: 10 },
  cardName: { color: "#ffffff", fontSize: 18, fontWeight: "600", marginBottom: 4 },
  cardDetail: { color: "#7a8a9a", fontSize: 15, marginTop: 2 },
  cardButtons: { flexDirection: "row", gap: 10, marginTop: 12 },
  editButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: "#4aa3df" },
  editText: { color: "#4aa3df", fontSize: 14, fontWeight: "600" },
  deleteButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: "#d9534f" },
  deleteText: { color: "#d9534f", fontSize: 14, fontWeight: "600" },
  empty: { color: "#7a8a9a", fontSize: 16, textAlign: "center", marginTop: 40 },
});