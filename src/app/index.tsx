import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { supabase } from "../lib/supabase";

type Client = {
  id: string;
  name: string;
  address: string;
  poolType: string;
  poolSize: string;
  phone: string;
};

export default function Index() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [poolType, setPoolType] = useState("");
  const [poolSize, setPoolSize] = useState("");
  const [phone, setPhone] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadClients(){
      console.log("key:", process.env.EXPO_PUBLIC_SUPABASE_KEY);
      console.log("url:", process.env.EXPO_PUBLIC_SUPABASE_URL);
      const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: true });
      if (error) {
        console.log("Error loading clients:", error.message);
      } else {
        setClients(
          data.map((row) => ({
            id: row.id,
            name: row.name,
            address: row.address,
            poolType: row.pool_type,
            poolSize: row.pool_size,
            phone: row.phone,
          }))
        );
      }
    }
    loadClients();
  }, []);

  function resetForm() {
    setName("");
    setAddress("");
    setPoolType("");
    setPoolSize("");
    setPhone("");
    setEditingId(null);
  }

  async function saveClient() {
    if (name.trim() === "") return;

    const details = {
      name: name.trim(),
      address: address.trim(),
      poolType: poolType.trim(),
      poolSize: poolSize.trim(),
       phone: phone.trim(),
    };

    if (editingId === null) {
      const { data, error } = await supabase
        .from("clients")
        .insert({
          name: details.name,
          address: details.address,
          pool_type: details.poolType,
          pool_size: details.poolSize,
          phone: details.phone,
        })
        .select()
        .single();

    if (error) {
      console.log("Error adding client:", error.message);
      return;
    }
    setClients([
      ...clients,
      {
        id: data.id,
        name: data.name,
        address: data.address,
        poolType: data.pool_type,
        poolSize: data.pool_size,
        phone: data.phone,
      }
    ]);
    } else {
      const { data, error } = await supabase
        .from("clients")
        .update({
          name: details.name,
          address: details.address,
          pool_type: details.poolType,
          pool_size: details.poolSize,
          phone: details.phone,
        })
        .eq("id", editingId)
        .select()
        .single();

        if (error) {
          console.log("Error updating client:", error.message);
          return;
        }

        setClients(
          clients.map((c) =>
            c.id === editingId
              ? {
                  ...c,
                  name: data.name,
                  address: data.address,
                  poolType: data.pool_type,
                  poolSize: data.pool_size,
                  phone: data.phone,
                }
              : c
          )
        );
    }
    resetForm();
  }

  function startEdit(client: Client) {
    setName(client.name);
    setAddress(client.address);
    setPoolType(client.poolType);
    setPoolSize(client.poolSize);
    setPhone(client.phone);
    setEditingId(client.id);
  }

  async function deleteClient(id: string) {
    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", id);

      if (error) {
        console.log("Error delecting clinet:", error.message);
        return;
      }

      setClients(clients.filter((c) => c.id !== id));
      if (editingId === id) resetForm();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Clients</Text>

      <TextInput style={styles.input} placeholder="Client name" placeholderTextColor="#7a8a9a"
        value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Address" placeholderTextColor="#7a8a9a"
        value={address} onChangeText={setAddress} />
      <TextInput style={styles.input} placeholder="Pool type (e.g. concrete, vinyl)" placeholderTextColor="#7a8a9a"
        value={poolType} onChangeText={setPoolType} />
      <TextInput style={styles.input} placeholder="Pool size (gallons)" placeholderTextColor="#7a8a9a"
        value={poolSize} onChangeText={setPoolSize} keyboardType="numeric" />
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
          <View style={styles.card}>
            <Text style={styles.cardName}>{item.name}</Text>
            <Text style={styles.cardDetail}>{item.phone || "No phone"}</Text>
            <Text style={styles.cardDetail}>{item.address || "No address"}</Text>
            <Text style={styles.cardDetail}>
              {item.poolType || "Unknown type"}
              {item.poolSize ? ` · ${item.poolSize} gal` : ""}
            </Text>

            <View style={styles.cardButtons}>
              <Pressable style={styles.editButton} onPress={() => startEdit(item)}>
                <Text style={styles.editText}>Edit</Text>
              </Pressable>
              <Pressable style={styles.deleteButton} onPress={() => deleteClient(item.id)}>
                <Text style={styles.deleteText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No clients yet. Add one above.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0e1a2b", padding: 24, paddingTop: 64 },
  title: { fontSize: 28, fontWeight: "bold", color: "#4aa3df", marginBottom: 20 },
  input: {
    backgroundColor: "#1b2a3d", color: "#ffffff", fontSize: 16,
    paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10,
    borderWidth: 1, borderColor: "#33485f", marginBottom: 10,
  },
  formButtons: { flexDirection: "row", gap: 10, marginBottom: 20 },
  button: {
    flex: 1, backgroundColor: "#4aa3df", alignItems: "center",
    paddingVertical: 14, borderRadius: 10,
  },
  buttonText: { color: "#0e1a2b", fontSize: 16, fontWeight: "600" },
  cancelButton: {
    paddingVertical: 14, paddingHorizontal: 20, borderRadius: 10,
    borderWidth: 1, borderColor: "#33485f", alignItems: "center",
  },
  cancelText: { color: "#cccccc", fontSize: 16 },
  list: { flex: 1 },
  card: { backgroundColor: "#1b2a3d", padding: 16, borderRadius: 10, marginBottom: 10 },
  cardName: { color: "#ffffff", fontSize: 18, fontWeight: "600", marginBottom: 4 },
  cardDetail: { color: "#7a8a9a", fontSize: 15, marginTop: 2 },
  cardButtons: { flexDirection: "row", gap: 10, marginTop: 12 },
  editButton: {
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8,
    borderWidth: 1, borderColor: "#4aa3df",
  },
  editText: { color: "#4aa3df", fontSize: 14, fontWeight: "600" },
  deleteButton: {
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8,
    borderWidth: 1, borderColor: "#d9534f",
  },
  deleteText: { color: "#d9534f", fontSize: 14, fontWeight: "600" },
  empty: { color: "#7a8a9a", fontSize: 16, textAlign: "center", marginTop: 40 },
});