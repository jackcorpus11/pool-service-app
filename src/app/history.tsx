import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { fetchAllHistory, HistoryEntry } from "../lib/visits";

export default function History() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllHistory()
      .then(setHistory)
      .catch((e) => console.log("Error loading history:", e.message))
      .finally(() => setLoading(false));
  }, []);

  function kindLabel(kind: string) {
    if (kind === "hot tub") return "Hot tub";
    if (kind === "spa") return "Spa";
    return "Pool";
  }

  // build a readable list of the readings that were recorded
  function readingSummary(r: HistoryEntry["reading"]): string {
    if (!r) return "";
    const parts: string[] = [];
    if (r.ph !== null) parts.push(`pH ${r.ph}`);
    if (r.freeChlorine !== null) parts.push(`Cl ${r.freeChlorine}`);
    if (r.totalAlkalinity !== null) parts.push(`Alk ${r.totalAlkalinity}`);
    if (r.cyanuricAcid !== null) parts.push(`CYA ${r.cyanuricAcid}`);
    if (r.calciumHardness !== null) parts.push(`Ca ${r.calciumHardness}`);
    if (r.salt !== null) parts.push(`Salt ${r.salt}`);
    if (r.waterTemp !== null) parts.push(`${r.waterTemp}°`);
    return parts.join("  ·  ");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Service History</Text>

      {loading ? (
        <Text style={styles.muted}>Loading…</Text>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.client}>{item.clientName}</Text>
                <Text style={styles.date}>{item.visitDate}</Text>
              </View>
              <Text style={styles.detail}>
                {kindLabel(item.poolKind)} · {item.jobType}
              </Text>
              {item.reading ? (
                <>
                  <Text style={styles.readings}>{readingSummary(item.reading)}</Text>
                  {item.reading.notes ? <Text style={styles.notes}>📝 {item.reading.notes}</Text> : null}
                </>
              ) : (
                <Text style={styles.noReading}>No chemical readings recorded</Text>
              )}
            </View>
          )}
          ListEmptyComponent={<Text style={styles.muted}>No completed services yet.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0e1a2b", padding: 20 },
  heading: { color: "#4aa3df", fontSize: 24, fontWeight: "bold", marginBottom: 16 },
  card: { backgroundColor: "#1b2a3d", borderRadius: 10, padding: 16, marginBottom: 10 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  client: { color: "#ffffff", fontSize: 17, fontWeight: "600" },
  date: { color: "#7a8a9a", fontSize: 14 },
  detail: { color: "#8fd6a0", fontSize: 14, marginTop: 4, textTransform: "capitalize" },
  readings: { color: "#aab7c4", fontSize: 14, marginTop: 8, lineHeight: 20 },
  notes: { color: "#aab7c4", fontSize: 13, marginTop: 6, fontStyle: "italic" },
  noReading: { color: "#7a8a9a", fontSize: 13, marginTop: 8 },
  muted: { color: "#7a8a9a", fontSize: 15, textAlign: "center", marginTop: 30 },
});