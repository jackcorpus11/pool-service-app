import { router } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Calendar } from "react-native-calendars";
import { fetchAllPoolsWithClient, PoolWithClient } from "../lib/pools";
import {
  createOneOffVisit,
  deleteVisitById,
  fetchVisitsWithDetails,
  updateVisitJobType,
  VisitWithDetails,
} from "../lib/visits";

const JOB_TYPES = ["cleaning", "liner change", "repair", "opening", "closing"];

export default function Schedule() {
  const [visits, setVisits] = useState<VisitWithDetails[]>([]);
  const [pools, setPools] = useState<PoolWithClient[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [editingVisitId, setEditingVisitId] = useState<string | null>(null);

  // one-off form state
  const [addingJob, setAddingJob] = useState(false);
  const [chosenPoolId, setChosenPoolId] = useState("");
  const [chosenType, setChosenType] = useState("cleaning");

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
      await load(); // reload so the new visit shows with its client/address
      setAddingJob(false);
      setChosenPoolId("");
      setChosenType("cleaning");
    } catch (error) {
      console.log("Error adding job:", (error as Error).message);
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

      <View style={styles.headingRow}>
        <Text style={styles.heading}>
          {selectedDate ? `Jobs on ${selectedDate}` : "Tap a day to see jobs"}
        </Text>
        {selectedDate ? (
          <Pressable onPress={() => setAddingJob(!addingJob)}>
            <Text style={styles.addJobText}>{addingJob ? "Cancel" : "+ Add job"}</Text>
          </Pressable>
        ) : null}
      </View>

      {/* one-off job form */}
      {addingJob && selectedDate ? (
        <View style={styles.oneOffForm}>
          <Text style={styles.formLabel}>Which pool?</Text>
          <View style={styles.poolList}>
            {pools.map((p) => (
              <Pressable
                key={p.id}
                style={[styles.poolChip, chosenPoolId === p.id && styles.poolChipActive]}
                onPress={() => setChosenPoolId(p.id)}
              >
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
              <Pressable
                key={type}
                style={[styles.typeChip, chosenType === type && styles.typeChipActive]}
                onPress={() => setChosenType(type)}
              >
                <Text style={[styles.typeChipText, chosenType === type && styles.typeChipTextActive]}>{type}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.saveJobButton} onPress={saveOneOff}>
            <Text style={styles.saveJobText}>Add this job</Text>
          </Pressable>
        </View>
      ) : null}

      <FlatList
        data={dayVisits}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.jobCard}>
            <Text style={styles.jobClient}>{item.clientName}</Text>
            {item.clientAddress ? <Text style={styles.jobLine}>📍 {item.clientAddress}</Text> : null}

            {editingVisitId === item.id ? (
              <View style={styles.poolList}>
                {JOB_TYPES.map((type) => (
                  <Pressable key={type}
                    style={[styles.typeChip, item.jobType === type && styles.typeChipActive]}
                    onPress={() => changeType(item.id, type)}>
                    <Text style={[styles.typeChipText, item.jobType === type && styles.typeChipTextActive]}>{type}</Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Pressable onPress={() => setEditingVisitId(item.id)}>
                <Text style={styles.jobType}>{item.jobType}  ✎</Text>
              </Pressable>
            )}

            <View style={styles.jobFooter}>
              <Text style={styles.jobStatus}>{item.status}</Text>
              <Pressable onPress={() => removeVisit(item.id)}>
                <Text style={styles.removeText}>Remove</Text>
              </Pressable>
            </View>
          </View>
        )}
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
  typeChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: "#33485f" },
  typeChipActive: { backgroundColor: "#8fd6a0", borderColor: "#8fd6a0" },
  typeChipText: { color: "#cccccc", fontSize: 13, textTransform: "capitalize" },
  typeChipTextActive: { color: "#0e1a2b", fontWeight: "600" },
  saveJobButton: { backgroundColor: "#4aa3df", alignItems: "center", paddingVertical: 12, borderRadius: 10, marginTop: 14 },
  saveJobText: { color: "#0e1a2b", fontSize: 15, fontWeight: "600" },
  jobCard: { backgroundColor: "#1b2a3d", padding: 16, borderRadius: 10, marginBottom: 10 },
  jobClient: { color: "#ffffff", fontSize: 17, fontWeight: "600" },
  jobLine: { color: "#aab7c4", fontSize: 14, marginTop: 3 },
  jobType: { color: "#8fd6a0", fontSize: 15, marginTop: 8, textTransform: "capitalize" },
  jobFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  jobStatus: { color: "#7a8a9a", fontSize: 13, textTransform: "capitalize" },
  removeText: { color: "#d9534f", fontSize: 13 },
  empty: { color: "#7a8a9a", fontSize: 15, textAlign: "center", marginTop: 20 },
  newClientText: { color: "#8fd6a0", fontSize: 13, marginTop: 8, fontWeight: "600" },
});