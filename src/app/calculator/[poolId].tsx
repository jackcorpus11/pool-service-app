import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { HOT_TUB_RANGES, POOL_RANGES } from "../../lib/chemicalRanges";
import { doseAlkalinity, doseCalcium, doseChlorine, dosePH, DoseResult } from "../../lib/dosing";
import { fetchPoolById } from "../../lib/pools";
import { Pool } from "../../types/pool";

export default function Calculator() {
  const { poolId } = useLocalSearchParams<{ poolId: string }>();
  const [pool, setPool] = useState<Pool | null>(null);

  // current readings (what the tester measured)
  const [ph, setPh] = useState("");
  const [alkalinity, setAlkalinity] = useState("");
  const [chlorine, setChlorine] = useState("");
  const [calcium, setCalcium] = useState("");

  useEffect(() => {
    fetchPoolById(poolId).then(setPool).catch((e) => console.log("Error:", e.message));
  }, [poolId]);

  if (!pool) {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>Loading pool…</Text>
      </View>
    );
  }

  const isHotTub = pool.kind === "hot tub" || pool.kind === "spa";
  const ranges = isHotTub ? HOT_TUB_RANGES : POOL_RANGES;
  const gallons = pool.gallons;

  // build the dose list in safe treatment order
  const doses: { label: string; result: DoseResult | null }[] = [];
  if (gallons) {
    doses.push({
      label: "1. Alkalinity",
      result: alkalinity ? doseAlkalinity(Number(alkalinity), (ranges.totalAlkalinity.min + ranges.totalAlkalinity.max) / 2, gallons) : null,
    });
    doses.push({
      label: "2. pH",
      result: ph ? dosePH(Number(ph), (ranges.ph.min + ranges.ph.max) / 2, gallons) : null,
    });
    doses.push({
      label: "3. Chlorine",
      result: chlorine ? doseChlorine(Number(chlorine), (ranges.freeChlorine.min + ranges.freeChlorine.max) / 2, gallons) : null,
    });
    doses.push({
      label: "4. Calcium",
      result: calcium ? doseCalcium(Number(calcium), (ranges.calciumHardness.min + ranges.calciumHardness.max) / 2, gallons) : null,
    });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.heading}>Dosage Calculator</Text>
      <Text style={styles.sub}>
        {pool.kind === "pool" ? (pool.poolType || "Pool") : pool.kind}
        {gallons ? ` · ${gallons} gal` : ""}
      </Text>

      {!gallons ? (
        <View style={styles.warnBox}>
          <Text style={styles.warnText}>
            This pool has no volume set. Add gallons to the pool first — dosing needs it.
          </Text>
        </View>
      ) : null}

      <Text style={styles.label}>Enter current readings (skip any you didn't test)</Text>

      <View style={styles.readingRow}>
        <Text style={styles.readingLabel}>pH</Text>
        <TextInput style={styles.input} value={ph} onChangeText={setPh} keyboardType="numeric" placeholder={`${ranges.ph.min}-${ranges.ph.max}`} placeholderTextColor="#556" />
      </View>
      <View style={styles.readingRow}>
        <Text style={styles.readingLabel}>Alkalinity</Text>
        <TextInput style={styles.input} value={alkalinity} onChangeText={setAlkalinity} keyboardType="numeric" placeholder={`${ranges.totalAlkalinity.min}-${ranges.totalAlkalinity.max}`} placeholderTextColor="#556" />
      </View>
      <View style={styles.readingRow}>
        <Text style={styles.readingLabel}>Free chlorine</Text>
        <TextInput style={styles.input} value={chlorine} onChangeText={setChlorine} keyboardType="numeric" placeholder={`${ranges.freeChlorine.min}-${ranges.freeChlorine.max}`} placeholderTextColor="#556" />
      </View>
      <View style={styles.readingRow}>
        <Text style={styles.readingLabel}>Calcium</Text>
        <TextInput style={styles.input} value={calcium} onChangeText={setCalcium} keyboardType="numeric" placeholder={`${ranges.calciumHardness.min}-${ranges.calciumHardness.max}`} placeholderTextColor="#556" />
      </View>

      {gallons ? (
        <View style={styles.results}>
          <Text style={styles.resultsHeading}>Suggested doses (add in this order)</Text>

          {doses.every((d) => d.result === null) ? (
            <Text style={styles.muted}>Enter readings above to see suggested doses.</Text>
          ) : (
            doses.map((d) =>
              d.result ? (
                <View key={d.label} style={styles.doseCard}>
                  <Text style={styles.doseStep}>{d.label}</Text>
                  <Text style={styles.doseChem}>{d.result.chemical}</Text>
                  <Text style={styles.doseAmount}>{d.result.amount}</Text>
                  {d.result.note ? <Text style={styles.doseNote}>{d.result.note}</Text> : null}
                </View>
              ) : null
            )
          )}

          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              ⚠️ These are estimates. Add chemicals gradually, one at a time, with the pump running, and retest after 4–6 hours before adding more. Never mix chemicals. Your own judgment comes first.
            </Text>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0e1a2b" },
  heading: { color: "#4aa3df", fontSize: 24, fontWeight: "bold" },
  sub: { color: "#7a8a9a", fontSize: 15, marginTop: 2, marginBottom: 20, textTransform: "capitalize" },
  label: { color: "#cccccc", fontSize: 14, marginBottom: 12 },
  readingRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  readingLabel: { color: "#ffffff", fontSize: 15, flex: 1 },
  input: { backgroundColor: "#1b2a3d", color: "#ffffff", fontSize: 16, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: "#33485f", width: 110, textAlign: "center" },
  warnBox: { backgroundColor: "#3a2a16", borderRadius: 10, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: "#e0a458" },
  warnText: { color: "#e0a458", fontSize: 14 },
  results: { marginTop: 24 },
  resultsHeading: { color: "#4aa3df", fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  doseCard: { backgroundColor: "#1b2a3d", borderRadius: 10, padding: 16, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: "#8fd6a0" },
  doseStep: { color: "#7a8a9a", fontSize: 13, marginBottom: 4 },
  doseChem: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
  doseAmount: { color: "#8fd6a0", fontSize: 20, fontWeight: "bold", marginTop: 4 },
  doseNote: { color: "#aab7c4", fontSize: 13, marginTop: 6 },
  muted: { color: "#7a8a9a", fontSize: 15 },
  disclaimer: { backgroundColor: "#16243a", borderRadius: 10, padding: 14, marginTop: 16 },
  disclaimerText: { color: "#e0a458", fontSize: 13, lineHeight: 19 },
});