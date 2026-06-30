import { router } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Linking, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Calendar } from "react-native-calendars";
import { checkRange, HOT_TUB_RANGES, POOL_RANGES } from "../../lib/chemicalRanges";
import { fetchAllPoolsWithClient, PoolWithClient } from "../../lib/pools";
import { completeVisit } from "../../lib/readings";
import { buildRouteUrl, MAX_RELIABLE_STOPS } from "../../lib/routing";
import {
  createOneOffVisit,
  deleteVisitById,
  fetchVisitsWithDetails,
  updateVisitJobType,
  VisitWithDetails,
} from "../../lib/visits";
import { ReadingInput } from "../../types/reading";

const JOB_TYPES = ["cleaning", "liner change", "repair", "opening", "closing"];

// the reading fields we show, in order
const READING_FIELDS: { key: keyof ReadingInput; label: string }[] = [
  { key: "ph", label: "pH" },
  { key: "freeChlorine", label: "Free chlorine" },
  { key: "totalAlkalinity", label: "Total alkalinity" },
  { key: "cyanuricAcid", label: "Cyanuric acid" },
  { key: "calciumHardness", label: "Calcium hardness" },
  { key: "salt", label: "Salt" },
  { key: "waterTemp", label: "Water temp" },
];

const emptyReading: ReadingInput = {
  ph: null, freeChlorine: null, totalAlkalinity: null, cyanuricAcid: null,
  calciumHardness: null, salt: null, waterTemp: null, notes: "",
};

export default function Schedule() {
  const [visits, setVisits] = useState<VisitWithDetails[]>([]);
  const [pools, setPools] = useState<PoolWithClient[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [editingVisitId, setEditingVisitId] = useState<string | null>(null);

  const [addingJob, setAddingJob] = useState(false);
  const [chosenPoolId, setChosenPoolId] = useState("");
  const [chosenType, setChosenType] = useState("cleaning");

  // mark-done form
  const [completingVisitId, setCompletingVisitId] = useState<string | null>(null);
  const [reading, setReading] = useState<ReadingInput>(emptyReading);

  async function load() {
    try {
      const data = await fetchVisitsWithDetails();
      setVisits(data);
    } catch (error) {
      console.log("Error loading visits:", (error as Error).message);
    }
  }

  useEffect(() => {
    load();
    fetchAllPoolsWithClient().then(setPools).catch((e) => console.log("Error loading pools:", e.message));
  }, []);

  const marked: Record<string, any> = {};
  for (const visit of visits) {
    marked[visit.visitDate] = { marked: true, dotColor: "#4aa3df" };
  }
  if (selectedDate) {
    marked[selectedDate] = { ...(marked[selectedDate] || {}), selected: true, selectedColor: "#4aa3df" };
  }

  const dayVisits = visits.filter((v) => v.visitDate === selectedDate);

  async function changeType(visitId: string, newType: string) {
    try {
      await updateVisitJobType(visitId, newType);
      setVisits(visits.map((v) => (v.id === visitId ? { ...v, jobType: newType } : v)));
      setEditingVisitId(null);
    } catch (error) {
      console.log("Error changing type:", (error as Error).message);
    }
  }

  async function removeVisit(visitId: string) {
    try {
      await deleteVisitById(visitId);
      setVisits(visits.filter((v) => v.id !== visitId));
    } catch (error) {
      console.log("Error deleting visit:", (error as Error).message);
    }
  }

  async function saveOneOff() {
    if (chosenPoolId === "" || selectedDate === "") return;
    try {
      await createOneOffVisit(chosenPoolId, selectedDate, chosenType);
      await load();
      setAddingJob(false);
      setChosenPoolId("");
      setChosenType("cleaning");
    } catch (error) {
      console.log("Error adding job:", (error as Error).message);
    }
  }

  function openComplete(visitId: string) {
    setCompletingVisitId(visitId);
    setReading(emptyReading);
  }

  function setReadingField(key: keyof ReadingInput, text: string) {
    if (key === "notes") {
      setReading({ ...reading, notes: text });
    } else {
      setReading({ ...reading, [key]: text === "" ? null : Number(text) });
    }
  }

  async function saveComplete(visit: VisitWithDetails) {
    try {
      await completeVisit(visit.id, visit.poolId, visit.visitDate, reading);
      // update local state: mark this visit done
      setVisits(visits.map((v) => (v.id === visit.id ? { ...v, status: "done" } : v)));
      setCompletingVisitId(null);
    } catch (error) {
      console.log("Error completing visit:", (error as Error).message);
    }
  }

  // color for a reading's range status
  function rangeColor(status: string) {
    if (status === "good") return "#8fd6a0";
    if (status === "low" || status === "high") return "#e0a458";
    return "#7a8a9a";
  }

  function kindLabel(kind: string) {
    if (kind === "hot tub") return "Hot Tub";
    if (kind === "spa") return "Spa";
    if (kind === "pool") return "Pool";
    return "Unknown";
  }

  async function sendRoute() {
    console.log("Coords check:", dayVisits.map((v) => ({
      name: v.clientName,
      lat: v.latitude,
      lng: v.longitude
    })));
    const url = buildRouteUrl(dayVisits);
    if (!url) {
      console.log("No route URL generated");
      return;
    } try {
      await Linking.openURL(url);
    } catch (error) {
      console.log("Error opening route URL:", (error as Error).message);
    }
  }

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={(day) => setSelectedDate(day.dateString)}
        markedDates={marked}
        theme={{
          calendarBackground: "#0e1a2b", dayTextColor: "#ffffff", monthTextColor: "#4aa3df",
          textDisabledColor: "#33485f", arrowColor: "#4aa3df", todayTextColor: "#8fd6a0",
          selectedDayTextColor: "#0e1a2b",
        }}
        style={styles.calendar}
      />

      {selectedDate && dayVisits.length > 0 ? (
        <Pressable style={styles.routeButton} onPress={sendRoute}>
          <Text style={styles.routeText}>
            Send Route to Maps ({dayVisits.length} stop{dayVisits.length > 1 ? "s" : ""})
          </Text>
        </Pressable>
      ) : null}
        {selectedDate && dayVisits.length > MAX_RELIABLE_STOPS ? (
          <Text style={styles.routeWarning}>
            Note: maps apps may only handle ~{MAX_RELIABLE_STOPS} stops at once.
          </Text>
        ) : null}

      <View style={styles.headingRow}>
        <Text style={styles.heading}>{selectedDate ? `Jobs on ${selectedDate}` : "Tap a day"}</Text>
        {selectedDate ? (
          <Pressable onPress={() => setAddingJob(!addingJob)}>
            <Text style={styles.addJobText}>{addingJob ? "Cancel" : "+ Add job"}</Text>
          </Pressable>
        ) : null}
      </View>

      {addingJob && selectedDate ? (
        <View style={styles.oneOffForm}>
          <Text style={styles.formLabel}>Which pool?</Text>
          <View style={styles.poolList}>
            {pools.map((p) => (
              <Pressable key={p.id} style={[styles.poolChip, chosenPoolId === p.id && styles.poolChipActive]} onPress={() => setChosenPoolId(p.id)}>
                <Text style={[styles.poolChipText, chosenPoolId === p.id && styles.chipTextActive]}>{p.label}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={() => router.push("/")}>
            <Text style={styles.newClientText}>+ New client (add on Clients screen)</Text>
          </Pressable>
          <Text style={styles.formLabel}>Job type</Text>
          <View style={styles.poolList}>
            {JOB_TYPES.map((type) => (
              <Pressable key={type} style={[styles.typeChip, chosenType === type && styles.typeChipActive]} onPress={() => setChosenType(type)}>
                <Text style={[styles.typeChipText, chosenType === type && styles.typeChipTextActive]}>{type}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={styles.saveJobButton} onPress={saveOneOff}><Text style={styles.saveJobText}>Add this job</Text></Pressable>
        </View>
      ) : null}

      <FlatList
        data={dayVisits}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isDone = item.status === "done";
          const isCompleting = completingVisitId === item.id;
          return (
            <View style={[styles.jobCard, isDone && styles.jobCardDone]}>
              <View style={styles.jobTop}>
                <Text style={styles.jobClient}>{item.clientName} {kindLabel(item.poolKind)}</Text>
                {isDone ? <Text style={styles.doneCheck}>✓ Done</Text> : null}
              </View>
              {item.clientAddress ? <Text style={styles.jobLine}>📍 {item.clientAddress}</Text> : null}
              <Text style={styles.jobKind}>{kindLabel(item.poolKind)}</Text>

              {editingVisitId === item.id ? (
                <View style={styles.poolList}>
                  {JOB_TYPES.map((type) => (
                    <Pressable key={type} style={[styles.typeChip, item.jobType === type && styles.typeChipActive]} onPress={() => changeType(item.id, type)}>
                      <Text style={[styles.typeChipText, item.jobType === type && styles.typeChipTextActive]}>{type}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <Pressable onPress={() => setEditingVisitId(item.id)}>
                  <Text style={styles.jobType}>{item.jobType}  ✎</Text>
                </Pressable>
              )}

              {/* mark-done readings form */}
              {isCompleting ? (
                <View style={styles.readingForm}>
                  <Text style={styles.formLabel}>Chemical readings</Text>
                  {READING_FIELDS.map((field) => {
                    const value = reading[field.key] as number | null;
                    const status = checkRange(field.key as string, value, item.poolKind === " hot tub"|| item.poolKind === "spa");
                    const isHotTub = item.poolKind == "hot tub" || item.poolKind == "spa";
                    const r = isHotTub ? HOT_TUB_RANGES[field.key as string] : POOL_RANGES[field.key as string];
                    return (
                      <View key={field.key} style={styles.readingRow}>
                        <Text style={styles.readingLabel}>{field.label}</Text>
                        <TextInput
                          style={styles.readingInput}
                          value={value === null ? "" : String(value)}
                          onChangeText={(t) => setReadingField(field.key, t)}
                          keyboardType="numeric"
                          placeholder="—"
                          placeholderTextColor="#556"
                        />
                        <Text style={[styles.readingStatus, { color: rangeColor(status) }]}>
                          {status === "none" ? (r ? `${r.min}-${r.max}` : "") : status}
                        </Text>
                      </View>
                    );
                  })}
                  <TextInput
                    style={styles.notesInput}
                    value={reading.notes}
                    onChangeText={(t) => setReadingField("notes", t)}
                    placeholder="Notes (anything else...)"
                    placeholderTextColor="#7a8a9a"
                    multiline
                  />
                  <View style={styles.completeButtons}>
                    <Pressable style={styles.confirmButton} onPress={() => saveComplete(item)}>
                      <Text style={styles.confirmText}>Save & mark done</Text>
                    </Pressable>
                    <Pressable style={styles.cancelComplete} onPress={() => setCompletingVisitId(null)}>
                      <Text style={styles.cancelText}>Cancel</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View style={styles.jobFooter}>
                  {!isDone ? (
                    <Pressable style={styles.markDoneButton} onPress={() => openComplete(item.id)}>
                      <Text style={styles.markDoneText}>Mark done</Text>
                    </Pressable>
                  ) : (
                    <Text style={styles.jobStatus}>completed</Text>
                  )}
                  <Pressable onPress={() => removeVisit(item.id)}>
                    <Text style={styles.removeText}>Remove</Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={selectedDate ? <Text style={styles.empty}>No jobs scheduled this day.</Text> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0e1a2b", padding: 16 },
  calendar: { borderRadius: 12, marginBottom: 16 },
  headingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  heading: { color: "#4aa3df", fontSize: 18, fontWeight: "bold" },
  addJobText: { color: "#8fd6a0", fontSize: 15, fontWeight: "600" },
  oneOffForm: { backgroundColor: "#16243a", borderRadius: 10, padding: 14, marginBottom: 16 },
  formLabel: { color: "#cccccc", fontSize: 14, marginBottom: 8, marginTop: 6 },
  poolList: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  poolChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: "#33485f" },
  poolChipActive: { backgroundColor: "#4aa3df", borderColor: "#4aa3df" },
  poolChipText: { color: "#cccccc", fontSize: 13 },
  chipTextActive: { color: "#0e1a2b", fontWeight: "600" },
  newClientText: { color: "#8fd6a0", fontSize: 13, marginTop: 8, fontWeight: "600" },
  typeChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: "#33485f" },
  typeChipActive: { backgroundColor: "#8fd6a0", borderColor: "#8fd6a0" },
  typeChipText: { color: "#cccccc", fontSize: 13, textTransform: "capitalize" },
  typeChipTextActive: { color: "#0e1a2b", fontWeight: "600" },
  saveJobButton: { backgroundColor: "#4aa3df", alignItems: "center", paddingVertical: 12, borderRadius: 10, marginTop: 14 },
  saveJobText: { color: "#0e1a2b", fontSize: 15, fontWeight: "600" },
  jobCard: { backgroundColor: "#1b2a3d", padding: 16, borderRadius: 10, marginBottom: 10 },
  jobCardDone: { opacity: 0.6 },
  jobTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  jobClient: { color: "#ffffff", fontSize: 17, fontWeight: "600" },
  doneCheck: { color: "#8fd6a0", fontSize: 14, fontWeight: "600" },
  jobLine: { color: "#aab7c4", fontSize: 14, marginTop: 3 },
  jobType: { color: "#8fd6a0", fontSize: 15, marginTop: 8, textTransform: "capitalize" },
  readingForm: { marginTop: 12, borderTopWidth: 1, borderTopColor: "#33485f", paddingTop: 12 },
  readingRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  readingLabel: { color: "#cccccc", fontSize: 14, flex: 1 },
  readingInput: { backgroundColor: "#0e1a2b", color: "#ffffff", fontSize: 15, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: "#33485f", width: 80, textAlign: "center" },
  readingStatus: { fontSize: 12, width: 70, textAlign: "right", textTransform: "capitalize" },
  notesInput: { backgroundColor: "#0e1a2b", color: "#ffffff", fontSize: 14, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: "#33485f", marginTop: 8, minHeight: 50 },
  completeButtons: { flexDirection: "row", gap: 10, marginTop: 12 },
  confirmButton: { flex: 1, backgroundColor: "#8fd6a0", alignItems: "center", paddingVertical: 12, borderRadius: 10 },
  confirmText: { color: "#0e1a2b", fontSize: 15, fontWeight: "600" },
  cancelComplete: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10, borderWidth: 1, borderColor: "#33485f", alignItems: "center" },
  cancelText: { color: "#cccccc", fontSize: 15 },
  jobFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  markDoneButton: { backgroundColor: "#4aa3df", paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  markDoneText: { color: "#0e1a2b", fontSize: 14, fontWeight: "600" },
  jobStatus: { color: "#8fd6a0", fontSize: 13, textTransform: "capitalize" },
  removeText: { color: "#d9534f", fontSize: 13 },
  empty: { color: "#7a8a9a", fontSize: 15, textAlign: "center", marginTop: 20 },
  jobKind: { color: "#4aa3df", fontSize: 14, marginTop: 3, fontWeight: "600" },
  routeButton: { backgroundColor: "#4aa3df", alignItems: "center", paddingVertical: 12, borderRadius: 10, marginBottom: 12 },
  routeText: { color: "#0e1a2b", fontSize: 15, fontWeight: "600" },
  routeWarning: { color: "#e0a458", fontSize: 13, textAlign: "center", marginBottom: 12 }
});