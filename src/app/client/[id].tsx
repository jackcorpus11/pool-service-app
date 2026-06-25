import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import {
    createPool,
    deletePoolById,
    fetchPoolsForClient,
} from "../../lib/pools";
import { Pool } from "../../types/pool";

export default function ClientDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [poolType, setPoolType] = useState("");
  const [poolSize, setPoolSize] = useState("");
  const [equipmentNotes, setEquipmentNotes] = useState("");
  const [pools, setPools] = useState<Pool[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchPoolsForClient(id);
        setPools(data);
      } catch (error) {
        console.log("Error loading pools:", (error as Error).message);
      }
    }
    load();
  }, [id]);

  async function addPool() {
    if (poolType.trim() === "") return;

    try {
      const newPool = await createPool({
        clientId: id,
        poolType: poolType.trim(),
        poolSize: poolSize.trim(),
        equipmentNotes: equipmentNotes.trim(),
      });
      setPools([...pools, newPool]);
      setPoolType("");
      setPoolSize("");
      setEquipmentNotes("");
    } catch (error) {
      console.log("Error adding pool:", (error as Error).message);
    }
  }

  async function removePool(poolId: string) {
    try {
      await deletePoolById(poolId);
      setPools(pools.filter((p) => p.id !== poolId));
    } catch (error) {
      console.log("Error deleting pool:", (error as Error).message);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Pools</Text>

      <TextInput style={styles.input} placeholder="Pool type (e.g. concrete, vinyl)" placeholderTextColor="#7a8a9a"
        value={poolType} onChangeText={setPoolType} />
      <TextInput style={styles.input} placeholder="Pool size (gallons)" placeholderTextColor="#7a8a9a"
        value={poolSize} onChangeText={setPoolSize} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Equipment notes" placeholderTextColor="#7a8a9a"
        value={equipmentNotes} onChangeText={setEquipmentNotes} />

      <Pressable style={styles.button} onPress={addPool}>
        <Text style={styles.buttonText}>Add pool</Text>
      </Pressable>

      <FlatList
        style={styles.list}
        data={pools}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardName}>{item.poolType || "Unknown type"}</Text>
            <Text style={styles.cardDetail}>
              {item.poolSize ? `${item.poolSize} gal` : "Size unknown"}
            </Text>
            {item.equipmentNotes ? (
              <Text style={styles.cardDetail}>{item.equipmentNotes}</Text>
            ) : null}

            <Pressable style={styles.deleteButton} onPress={() => removePool(item.id)}>
              <Text style={styles.deleteText}>Delete</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No pools yet. Add one above.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0e1a2b", padding: 24 },
  heading: { fontSize: 22, fontWeight: "bold", color: "#4aa3df", marginBottom: 16 },
  input: {
    backgroundColor: "#1b2a3d", color: "#ffffff", fontSize: 16,
    paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10,
    borderWidth: 1, borderColor: "#33485f", marginBottom: 10,
  },
  button: {
    backgroundColor: "#4aa3df", alignItems: "center",
    paddingVertical: 14, borderRadius: 10, marginBottom: 20,
  },
  buttonText: { color: "#0e1a2b", fontSize: 16, fontWeight: "600" },
  list: { flex: 1 },
  card: { backgroundColor: "#1b2a3d", padding: 16, borderRadius: 10, marginBottom: 10 },
  cardName: { color: "#ffffff", fontSize: 18, fontWeight: "600", marginBottom: 4 },
  cardDetail: { color: "#7a8a9a", fontSize: 15, marginTop: 2 },
  deleteButton: {
    alignSelf: "flex-start", marginTop: 12,
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8,
    borderWidth: 1, borderColor: "#d9534f",
  },
  deleteText: { color: "#d9534f", fontSize: 14, fontWeight: "600" },
  empty: { color: "#7a8a9a", fontSize: 16, textAlign: "center", marginTop: 40 },
});