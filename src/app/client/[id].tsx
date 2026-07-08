import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Calendar } from "react-native-calendars";
import { createPlan, deletePlanById, fetchPlansForPool } from "../../lib/plans";
import { createPool, deletePoolById, fetchPoolsForClient, updatePool } from "../../lib/pools";
import { calculateGallons } from "../../lib/poolVolume";
import { generateVisitsForPlan } from "../../lib/visits";
import { ServicePlan, Weekday } from "../../types/plan";
import { Pool } from "../../types/pool";

const WEEKDAYS: Weekday[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const KINDS = ["pool", "hot tub", "spa"];

export default function ClientDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // new-pool form fields
  const [kind, setKind] = useState("pool");
  const [gallons, setGallons] = useState("");
  const [showDimensions, setShowDimensions] = useState(false);
  const [shape, setShape] = useState<"rectangle" | "round" | "oval">("rectangle");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [avgDepth, setAvgDepth] = useState("");
  const [poolType, setPoolType] = useState("");
  const [poolSize, setPoolSize] = useState("");
  const [equipmentNotes, setEquipmentNotes] = useState("");
  const [accessNotes, setAccessNotes] = useState("");
  const [waterFeatures, setWaterFeatures] = useState("");
  const [chemicalNotes, setChemicalNotes] = useState("");
  const [editingPoolId, setEditingPoolId] = useState<string | null>(null);

  const [pools, setPools] = useState<Pool[]>([]);
  const [plansByPool, setPlansByPool] = useState<Record<string, ServicePlan[]>>({});

  const [planningPoolId, setPlanningPoolId] = useState<string | null>(null);
  const [scheduleType, setScheduleType] = useState<"interval" | "weekly">("interval");
  const [intervalDays, setIntervalDays] = useState(7);
  const [weekdays, setWeekdays] = useState<Weekday[]>([]);
  const [startDate, setStartDate] = useState("");
  const [showAddPool, setShowAddPool] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const poolData = await fetchPoolsForClient(id);
        setPools(poolData);
        const planMap: Record<string, ServicePlan[]> = {};
        for (const pool of poolData) {
          planMap[pool.id] = await fetchPlansForPool(pool.id);
        }
        setPlansByPool(planMap);
      } catch (error) {
        console.log("Error loading:", (error as Error).message);
      }
    }
    load();
  }, [id]);

 async function addPool() {
  if (poolType.trim() === "" && kind === "pool") return;
  const details = {
    clientId: id,
    kind,
    poolType: poolType.trim(),
    poolSize: poolSize.trim(),
    equipmentNotes: equipmentNotes.trim(),
    accessNotes: accessNotes.trim(),
    waterFeatures: waterFeatures.trim(),
    chemicalNotes: chemicalNotes.trim(),
    gallons: gallons.trim() === "" ? null : Number(gallons.replace(/,/g, "")),
  };

  console.log("Saving pool with gallons:", details.gallons);

  try {
    if (editingPoolId === null) {
      const newPool = await createPool(details);
      setPools([...pools, newPool]);
      setPlansByPool({ ...plansByPool, [newPool.id]: [] });
    } else {
      const updated = await updatePool(editingPoolId, details);
      setPools(pools.map((p) => (p.id === editingPoolId ? updated : p)));
    }
    // reset form
    setKind("pool");
    setPoolType("");
    setPoolSize("");
    setEquipmentNotes("");
    setAccessNotes("");
    setWaterFeatures("");
    setChemicalNotes("");
    setGallons("");
    setEditingPoolId(null);
  } catch (error) {
    console.log("Error saving pool:", (error as Error).message);
  }
}
  function startEditPool(pool: Pool) {
    setKind(pool.kind);
    setPoolType(pool.poolType);
    setPoolSize(pool.poolSize);
    setEquipmentNotes(pool.equipmentNotes);
    setAccessNotes(pool.accessNotes);
    setWaterFeatures(pool.waterFeatures);
    setChemicalNotes(pool.chemicalNotes);
    setGallons(pool.gallons === null ? "" : String(pool.gallons));
    setEditingPoolId(pool.id);
    setShowAddPool(true);
    setEditingPoolId(pool.id);
  }

  async function removePool(poolId: string) {
    try {
      await deletePoolById(poolId);
      setPools(pools.filter((p) => p.id !== poolId));
    } catch (error) {
      console.log("Error deleting pool:", (error as Error).message);
    }
  }

  function openPlanForm(poolId: string) {
    setPlanningPoolId(poolId);
    setScheduleType("interval");
    setIntervalDays(7);
    setWeekdays([]);
    setStartDate("");
  }

  function toggleWeekday(day: Weekday) {
    if (weekdays.includes(day)) setWeekdays(weekdays.filter((d) => d !== day));
    else setWeekdays([...weekdays, day]);
  }

  function computeGallons(){
    const g = calculateGallons(
      shape,
      Number(length) || 0,
      Number(width) || 0,
      Number(avgDepth) || 0
    );
    if (g > 0) {
      setGallons(String(g));
      setShowDimensions(false);
    }
  }

  async function savePlan() {
    if (planningPoolId === null || startDate === "") return;
    if (scheduleType === "interval" && intervalDays < 1) return;
    if (scheduleType === "weekly" && weekdays.length === 0) return;
    try {
      const newPlan = await createPlan({
        poolId: planningPoolId,
        scheduleType,
        intervalDays: scheduleType === "interval" ? intervalDays : null,
        weekdays: scheduleType === "weekly" ? weekdays : [],
        startDate,
        active: true,
      });
      await generateVisitsForPlan(newPlan);
      setPlansByPool({
        ...plansByPool,
        [planningPoolId]: [...(plansByPool[planningPoolId] || []), newPlan],
      });
      setPlanningPoolId(null);
    } catch (error) {
      console.log("Error saving plan:", (error as Error).message);
    }
  }

  async function removePlan(poolId: string, planId: string) {
    try {
      await deletePlanById(planId);
      setPlansByPool({ ...plansByPool, [poolId]: plansByPool[poolId].filter((p) => p.id !== planId) });
    } catch (error) {
      console.log("Error deleting plan:", (error as Error).message);
    }
  }

  function planSummary(plan: ServicePlan) {
    if (plan.scheduleType === "weekly") {
      return `Weekly on ${plan.weekdays.map((d) => d.slice(0, 3)).join(", ")}`;
    }
    const n = plan.intervalDays ?? 0;
    if (n === 7) return "Weekly";
    if (n === 14) return "Biweekly";
    if (n === 30) return "Monthly";
    return `Every ${n} days`;
  }

  const presets = [
    { label: "Weekly", days: 7 },
    { label: "Biweekly", days: 14 },
    { label: "Monthly", days: 30 },
  ];

  return (
    <View style={styles.container}>
      {/* toggle button — always visible */}
      <Pressable style={styles.toggleButton} onPress={() => setShowAddPool(!showAddPool)}>
        <Text style={styles.toggleButtonText}>
          {showAddPool ? "✕ Close" : "+ Add a pool / hot tub"}
        </Text>
      </Pressable>

      {/* the entire add-pool form — only shows when toggled on */}
      {showAddPool ? (
        <View>
          {/* kind selector */}
          <View style={styles.kindRow}>
            {KINDS.map((k) => (
              <Pressable key={k} style={[styles.kindChip, kind === k && styles.kindChipActive]} onPress={() => setKind(k)}>
                <Text style={[styles.kindText, kind === k && styles.kindTextActive]}>{k}</Text>
              </Pressable>
            ))}
          </View>

          <TextInput style={styles.input} placeholder={kind === "pool" ? "Pool type (concrete, vinyl)" : "Type (optional)"} placeholderTextColor="#7a8a9a" value={poolType} onChangeText={setPoolType} />
          <TextInput style={styles.input} placeholder="Gate code / access notes" placeholderTextColor="#7a8a9a" value={accessNotes} onChangeText={setAccessNotes} />
          <TextInput style={styles.input} placeholder="Water features (heater, salt system...)" placeholderTextColor="#7a8a9a" value={waterFeatures} onChangeText={setWaterFeatures} />
          <TextInput style={styles.input} placeholder="Default chemical notes" placeholderTextColor="#7a8a9a" value={chemicalNotes} onChangeText={setChemicalNotes} />
          <TextInput style={styles.input} placeholder="Equipment notes" placeholderTextColor="#7a8a9a" value={equipmentNotes} onChangeText={setEquipmentNotes} />

          {/* gallons — type directly */}
          <TextInput
            style={styles.input}
            placeholder="Volume (gallons)"
            placeholderTextColor="#7a8a9a"
            value={gallons}
            onChangeText={setGallons}
            keyboardType="numeric"
          />

          {/* gallons — or calculate from dimensions */}
          <Pressable onPress={() => setShowDimensions(!showDimensions)}>
            <Text style={styles.dimToggle}>
              {showDimensions ? "− Hide" : "+ Calculate gallons from dimensions"}
            </Text>
          </Pressable>

          {showDimensions ? (
            <View style={styles.dimBox}>
              <View style={styles.shapeRow}>
                {(["rectangle", "round", "oval"] as const).map((s) => (
                  <Pressable
                    key={s}
                    style={[styles.shapeChip, shape === s && styles.shapeChipActive]}
                    onPress={() => setShape(s)}
                  >
                    <Text style={[styles.shapeText, shape === s && styles.shapeTextActive]}>{s}</Text>
                  </Pressable>
                ))}
              </View>
              <TextInput style={styles.input} placeholder="Length (ft)" placeholderTextColor="#7a8a9a"
                value={length} onChangeText={setLength} keyboardType="numeric" />
              <TextInput style={styles.input} placeholder="Width (ft)" placeholderTextColor="#7a8a9a"
                value={width} onChangeText={setWidth} keyboardType="numeric" />
              <TextInput style={styles.input} placeholder="Average depth (ft)" placeholderTextColor="#7a8a9a"
                value={avgDepth} onChangeText={setAvgDepth} keyboardType="numeric" />
              <Text style={styles.dimHint}>Average depth = (shallow + deep) ÷ 2</Text>
              <Pressable style={styles.computeButton} onPress={computeGallons}>
                <Text style={styles.computeText}>Calculate</Text>
              </Pressable>
            </View>
          ) : null}

          <Pressable style={styles.button} onPress={addPool}>
            <Text style={styles.buttonText}>{editingPoolId === null ? "Add" : "Update pool"}</Text>
          </Pressable>
        </View>
      ) : null}

      <FlatList
        style={styles.list}
        data={pools}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const poolPlans = plansByPool[item.id] || [];
          const isPlanning = planningPoolId === item.id;
          return (
            <View style={styles.card}>
              <Text style={styles.cardName}>
                {item.kind === "pool" ? (item.poolType || "Pool") : item.kind}
                {item.poolSize ? ` · ${item.poolSize} gal` : ""}
              </Text>
              {item.accessNotes ? <Text style={styles.cardDetail}>🔑 {item.accessNotes}</Text> : null}
              {item.waterFeatures ? <Text style={styles.cardDetail}>💧 {item.waterFeatures}</Text> : null}
              {item.chemicalNotes ? <Text style={styles.cardDetail}>🧪 {item.chemicalNotes}</Text> : null}
              {item.equipmentNotes ? <Text style={styles.cardDetail}>🔧 {item.equipmentNotes}</Text> : null}
              {item.gallons ? <Text style={styles.cardDetail}>💧 {item.gallons} gal</Text> : null}

              {poolPlans.map((plan) => (
                <View key={plan.id} style={styles.planRow}>
                  <Text style={styles.planText}>{planSummary(plan)} from {plan.startDate}</Text>
                  <Pressable onPress={() => removePlan(item.id, plan.id)}>
                    <Text style={styles.removePlanText}>Remove</Text>
                  </Pressable>
                </View>
              ))}

              {isPlanning ? (
                <View style={styles.planForm}>
                  <View style={styles.modeRow}>
                    <Pressable style={[styles.modeTab, scheduleType === "interval" && styles.modeTabActive]} onPress={() => setScheduleType("interval")}>
                      <Text style={[styles.modeText, scheduleType === "interval" && styles.modeTextActive]}>Every N days</Text>
                    </Pressable>
                    <Pressable style={[styles.modeTab, scheduleType === "weekly" && styles.modeTabActive]} onPress={() => setScheduleType("weekly")}>
                      <Text style={[styles.modeText, scheduleType === "weekly" && styles.modeTextActive]}>Days of week</Text>
                    </Pressable>
                  </View>

                  {scheduleType === "interval" ? (
                    <View>
                      <Text style={styles.planLabel}>How often?</Text>
                      <View style={styles.freqRow}>
                        {presets.map((p) => (
                          <Pressable key={p.days} style={[styles.chip, intervalDays === p.days && styles.chipActive]} onPress={() => setIntervalDays(p.days)}>
                            <Text style={[styles.chipText, intervalDays === p.days && styles.chipTextActive]}>{p.label}</Text>
                          </Pressable>
                        ))}
                      </View>
                      <View style={styles.customRow}>
                        <Text style={styles.customLabel}>Or every</Text>
                        <TextInput style={styles.customInput} value={String(intervalDays)} onChangeText={(t) => setIntervalDays(Number(t) || 0)} keyboardType="numeric" />
                        <Text style={styles.customLabel}>days</Text>
                      </View>
                    </View>
                  ) : (
                    <View>
                      <Text style={styles.planLabel}>Which days?</Text>
                      <View style={styles.dayRow}>
                        {WEEKDAYS.map((day) => (
                          <Pressable key={day} style={[styles.dayChip, weekdays.includes(day) && styles.chipActive]} onPress={() => toggleWeekday(day)}>
                            <Text style={[styles.dayChipText, weekdays.includes(day) && styles.chipTextActive]}>{day.slice(0, 3)}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  )}

                  <Text style={styles.planLabel}>Starting on</Text>
                  <Calendar
                    onDayPress={(day) => setStartDate(day.dateString)}
                    markedDates={startDate ? { [startDate]: { selected: true, selectedColor: "#4aa3df" } } : {}}
                    theme={{ calendarBackground: "#1b2a3d", dayTextColor: "#ffffff", monthTextColor: "#4aa3df", textDisabledColor: "#445", arrowColor: "#4aa3df", todayTextColor: "#4aa3df" }}
                    style={styles.calendar}
                  />

                  <View style={styles.planButtons}>
                    <Pressable style={styles.savePlanButton} onPress={savePlan}><Text style={styles.buttonText}>Save plan</Text></Pressable>
                    <Pressable style={styles.cancelPlanButton} onPress={() => setPlanningPoolId(null)}><Text style={styles.cancelText}>Cancel</Text></Pressable>
                  </View>
                </View>
              ) : (
                <Pressable style={styles.addPlanButton} onPress={() => openPlanForm(item.id)}>
                  <Text style={styles.addPlanText}>+ Add service plan</Text>
                </Pressable>
              )}
              <Pressable onPress={() => router.push(`/calculator/${item.id}`)}>
                <Text style={styles.addPlanText}>🧪 Dosage calculator</Text>
              </Pressable>

              <Pressable style={styles.button} onPress={() => startEditPool(item)}>
                <Text style={styles.buttonText}>✎ Edit pool</Text>
              </Pressable>

              <Pressable style={styles.deleteButton} onPress={() => removePool(item.id)}>
                <Text style={styles.deleteText}>Delete</Text>
              </Pressable>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>No pools yet. Add one above.</Text>}
      />
    </View>
  );
  
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0e1a2b", padding: 24 },
  heading: { fontSize: 22, fontWeight: "bold", color: "#4aa3df", marginBottom: 16 },
  kindRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  kindChip: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: "#33485f", alignItems: "center" },
  kindChipActive: { backgroundColor: "#4aa3df", borderColor: "#4aa3df" },
  kindText: { color: "#cccccc", fontSize: 14, textTransform: "capitalize" },
  kindTextActive: { color: "#0e1a2b", fontWeight: "600" },
  input: { backgroundColor: "#1b2a3d", color: "#ffffff", fontSize: 16, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: "#33485f", marginBottom: 10 },
  button: { backgroundColor: "#4aa3df", alignItems: "center", paddingVertical: 14, borderRadius: 10, marginBottom: 20 },
  buttonText: { color: "#0e1a2b", fontSize: 16, fontWeight: "600" },
  list: { flex: 1 },
  card: { backgroundColor: "#1b2a3d", padding: 16, borderRadius: 10, marginBottom: 10 },
  cardName: { color: "#ffffff", fontSize: 18, fontWeight: "600", marginBottom: 4, textTransform: "capitalize" },
  cardDetail: { color: "#aab7c4", fontSize: 14, marginTop: 3 },
  planRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingVertical: 6 },
  planText: { color: "#8fd6a0", fontSize: 15, flex: 1 },
  removePlanText: { color: "#d9534f", fontSize: 13 },
  addPlanButton: { marginTop: 12, paddingVertical: 8 },
  addPlanText: { color: "#4aa3df", fontSize: 15, fontWeight: "600" },
  planForm: { marginTop: 12, borderTopWidth: 1, borderTopColor: "#33485f", paddingTop: 12 },
  modeRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  modeTab: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: "#33485f", alignItems: "center" },
  modeTabActive: { backgroundColor: "#33485f" },
  modeText: { color: "#cccccc", fontSize: 14 },
  modeTextActive: { color: "#ffffff", fontWeight: "600" },
  planLabel: { color: "#cccccc", fontSize: 14, marginBottom: 8, marginTop: 8 },
  freqRow: { flexDirection: "row", gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: "#33485f" },
  chipActive: { backgroundColor: "#4aa3df", borderColor: "#4aa3df" },
  chipText: { color: "#cccccc", fontSize: 14 },
  chipTextActive: { color: "#0e1a2b", fontWeight: "600" },
  customRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  customLabel: { color: "#cccccc", fontSize: 14 },
  customInput: { backgroundColor: "#1b2a3d", color: "#ffffff", fontSize: 16, textAlign: "center", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: "#33485f", minWidth: 60 },
  dayRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  dayChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: "#33485f" },
  dayChipText: { color: "#cccccc", fontSize: 13 },
  calendar: { borderRadius: 10, marginTop: 4 },
  planButtons: { flexDirection: "row", gap: 10, marginTop: 12 },
  savePlanButton: { flex: 1, backgroundColor: "#4aa3df", alignItems: "center", paddingVertical: 12, borderRadius: 10 },
  cancelPlanButton: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10, borderWidth: 1, borderColor: "#33485f", alignItems: "center" },
  cancelText: { color: "#cccccc", fontSize: 15 },
  deleteButton: { alignSelf: "flex-start", marginTop: 14, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: "#d9534f" },
  deleteText: { color: "#d9534f", fontSize: 14, fontWeight: "600" },
  empty: { color: "#7a8a9a", fontSize: 16, textAlign: "center", marginTop: 40 },
  dimToggle: { color: "#4aa3df", fontSize: 14, fontWeight: "600", marginBottom: 10 },
dimBox: { backgroundColor: "#16243a", borderRadius: 10, padding: 12, marginBottom: 12 },
shapeRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
shapeChip: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "#33485f", alignItems: "center" },
shapeChipActive: { backgroundColor: "#4aa3df", borderColor: "#4aa3df" },
shapeText: { color: "#cccccc", fontSize: 13, textTransform: "capitalize" },
shapeTextActive: { color: "#0e1a2b", fontWeight: "600" },
dimHint: { color: "#7a8a9a", fontSize: 12, marginBottom: 10 },
computeButton: { backgroundColor: "#4aa3df", alignItems: "center", paddingVertical: 10, borderRadius: 8 },
computeText: { color: "#0e1a2b", fontSize: 14, fontWeight: "600" },
toggleButton: { backgroundColor: "#4aa3df", alignItems: "center", paddingVertical: 14, borderRadius: 10, marginBottom: 16 },
toggleButtonText: { color: "#0e1a2b", fontSize: 16, fontWeight: "600" },
});