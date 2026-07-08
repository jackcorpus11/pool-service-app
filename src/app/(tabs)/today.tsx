import { useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { completeVisit } from "../../lib/readings";
import { buildSingleStopApple, buildSingleStopGoogle, orderStopsByNearest } from "../../lib/routing";
import { fetchVisitsWithDetails, VisitWithDetails } from "../../lib/visits";

export default function Today() {
  const [visits, setVisits] = useState<VisitWithDetails[]>([]);
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  async function load() {
    try {
      const all = await fetchVisitsWithDetails();
      setVisits(all.filter((v) => v.visitDate === today));
    } catch (e) {
      console.log("Error loading today:", (e as Error).message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // stops still to do (scheduled, not done/skipped), in nearest-neighbor order
  const remaining = orderStopsByNearest(visits.filter((v) => v.status === "scheduled"));
  const doneCount = visits.filter((v) => v.status === "done").length;

  async function markDone(visit: VisitWithDetails) {
    try {
      // quick complete from the route screen (empty reading)
      await completeVisit(visit.id, visit.poolId, visit.visitDate, {
        ph: null, freeChlorine: null, totalAlkalinity: null, cyanuricAcid: null,
        calciumHardness: null, salt: null, waterTemp: null, notes: "",
      });
      setVisits(visits.map((v) => (v.id === visit.id ? { ...v, status: "done" } : v)));
    } catch (e) {
      console.log("Error marking done:", (e as Error).message);
    }
  }

  function navigate(visit: VisitWithDetails, app: "google" | "apple") {
    const url = app === "google" ? buildSingleStopGoogle(visit) : buildSingleStopApple(visit);
    if (url) Linking.openURL(url).catch((e) => console.log("Nav error:", e.message));
  }

  function kindLabel(kind: string) {
    if (kind === "hot tub") return "Hot Tub";
    if (kind === "spa") return "Spa";
    return "Pool";
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.heading}>Today&apos;s Route</Text>
      <Text style={styles.sub}>
        {today} · {remaining.length} left{doneCount > 0 ? ` · ${doneCount} done` : ""}
      </Text>

      {remaining.length === 0 ? (
        <Text style={styles.allDone}>
          {visits.length === 0 ? "No jobs scheduled today." : "🎉 All stops done for today!"}
        </Text>
      ) : (
        remaining.map((visit, index) => (
          <View key={visit.id} style={[styles.card, index === 0 && styles.nextCard]}>
            {index === 0 ? <Text style={styles.nextBadge}>NEXT STOP</Text> : null}
            <Text style={styles.client}>{visit.clientName}</Text>
            <Text style={styles.detail}>{kindLabel(visit.poolKind)} · {visit.jobType}</Text>
            {visit.clientAddress ? <Text style={styles.address}>📍 {visit.clientAddress}</Text> : null}

            <View style={styles.actions}>
              <Pressable style={styles.navButton} onPress={() => navigate(visit, "google")}>
                <Text style={styles.navText}>Google</Text>
              </Pressable>
              <Pressable style={styles.navButton} onPress={() => navigate(visit, "apple")}>
                <Text style={styles.navText}>Apple</Text>
              </Pressable>
              <Pressable style={styles.doneButton} onPress={() => markDone(visit)}>
                <Text style={styles.doneText}>✓ Done</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0e1a2b" },
  heading: { color: "#4aa3df", fontSize: 26, fontWeight: "bold" },
  sub: { color: "#7a8a9a", fontSize: 15, marginTop: 4, marginBottom: 20 },
  allDone: { color: "#8fd6a0", fontSize: 17, textAlign: "center", marginTop: 40 },
  card: { backgroundColor: "#1b2a3d", borderRadius: 10, padding: 16, marginBottom: 12 },
  nextCard: { borderWidth: 2, borderColor: "#8fd6a0" },
  nextBadge: { color: "#8fd6a0", fontSize: 12, fontWeight: "bold", marginBottom: 6, letterSpacing: 1 },
  client: { color: "#ffffff", fontSize: 18, fontWeight: "600" },
  detail: { color: "#8fd6a0", fontSize: 14, marginTop: 3, textTransform: "capitalize" },
  address: { color: "#aab7c4", fontSize: 14, marginTop: 6 },
  actions: { flexDirection: "row", gap: 8, marginTop: 14, alignItems: "center" },
  navButton: { backgroundColor: "#1b2a3d", borderWidth: 1, borderColor: "#4aa3df", paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  navText: { color: "#4aa3df", fontSize: 14, fontWeight: "600" },
  doneButton: { backgroundColor: "#8fd6a0", paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, marginLeft: "auto" },
  doneText: { color: "#0e1a2b", fontSize: 14, fontWeight: "600" },
});