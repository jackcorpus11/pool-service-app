import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { fetchClients } from "../../lib/clients";
import { computeTotals } from "../../lib/invoices";
import { createQuote } from "../../lib/quotes";
import { fetchSettings } from "../../lib/settings";
import { Client } from "../../types/client";
import { Part } from "../../types/invoice";

const JOB_TYPES = ["repair", "cleaning", "liner change", "opening", "closing", "installation"];

export default function NewQuote() {
  const [clients, setClients] = useState<Client[]>([]);
  const [markup, setMarkup] = useState(25);

  // customer: either an existing client or a one-off
  const [isOneOff, setIsOneOff] = useState(false);
  const [clientId, setClientId] = useState<number | null>(null);
  const [oneoffName, setOneoffName] = useState("");
  const [oneoffPhone, setOneoffPhone] = useState("");
  const [oneoffEmail, setOneoffEmail] = useState("");

  const [jobType, setJobType] = useState("repair");
  const [description, setDescription] = useState("");
  const [parts, setParts] = useState<Part[]>([]);
  const [laborHours, setLaborHours] = useState("");
  const [laborRate, setLaborRate] = useState("");
  const [proposedDate, setProposedDate] = useState("");
  const [saved, setSaved] = useState(false);

  // new-part form
  const [pDesc, setPDesc] = useState("");
  const [pQty, setPQty] = useState("1");
  const [pCost, setPCost] = useState("");

  useEffect(() => {
    fetchClients().then(setClients).catch((e) => console.log("Error loading clients:", e.message));
    fetchSettings().then((s) => {
      setMarkup(s.partsMarkupPercent);
      setLaborRate(String(s.laborRate));
    }).catch((e) => console.log("Error loading settings:", e.message));
  }, []);

  function addPart() {
    if (pDesc.trim() === "" || pCost.trim() === "") return;
    const cost = Number(pCost.replace(/,/g, "")) || 0;
    const qty = Number(pQty.replace(/,/g, "")) || 1;
    const chargeEach = Math.round(cost * (1 + markup / 100) * 100) / 100;
    setParts([...parts, { description: pDesc.trim(), qty, costEach: cost, chargeEach }]);
    setPDesc("");
    setPQty("1");
    setPCost("");
  }

  function removePart(index: number) {
    setParts(parts.filter((_, i) => i !== index));
  }

  const hours = Number(laborHours.replace(/,/g, "")) || 0;
  const rate = Number(laborRate.replace(/,/g, "")) || 0;
  const { partsTotal, laborTotal, total } = computeTotals(parts, hours, rate);

  async function save() {
    // must have either a selected client or a one-off name
    if (!isOneOff && clientId === null) {
      console.log("Pick a client or switch to one-off");
      return;
    }
    if (isOneOff && oneoffName.trim() === "") {
      console.log("Enter the customer's name");
      return;
    }
    try {
      await createQuote({
        clientId: isOneOff ? null : clientId,
        oneoffName: isOneOff ? oneoffName.trim() : "",
        oneoffPhone: isOneOff ? oneoffPhone.trim() : "",
        oneoffEmail: isOneOff ? oneoffEmail.trim() : "",
        jobType,
        description: description.trim(),
        parts,
        laborHours: hours,
        laborRate: rate,
        proposedDate: proposedDate.trim() === "" ? null : proposedDate.trim(),
      });
      setSaved(true);
    } catch (e) {
      console.log("Error saving quote:", (e as Error).message);
    }
  }

  if (saved) {
    return (
      <View style={styles.savedBox}>
        <Text style={styles.savedText}>✓ Quote created</Text>
        <Text style={styles.savedSub}>Find it in the Quotes list to send it.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.heading}>New Quote</Text>

      {/* customer type toggle */}
      <View style={styles.toggleRow}>
        <Pressable style={[styles.toggleTab, !isOneOff && styles.toggleTabActive]} onPress={() => setIsOneOff(false)}>
          <Text style={[styles.toggleText, !isOneOff && styles.toggleTextActive]}>Existing client</Text>
        </Pressable>
        <Pressable style={[styles.toggleTab, isOneOff && styles.toggleTabActive]} onPress={() => setIsOneOff(true)}>
          <Text style={[styles.toggleText, isOneOff && styles.toggleTextActive]}>New customer</Text>
        </Pressable>
      </View>

      {!isOneOff ? (
        <View style={styles.clientList}>
          {clients.map((c) => (
            <Pressable key={c.id} style={[styles.clientChip, clientId === Number(c.id) && styles.clientChipActive]} onPress={() => setClientId(Number(c.id))}>
              <Text style={[styles.clientChipText, clientId === Number(c.id) && styles.clientChipTextActive]}>{c.name}</Text>
            </Pressable>
          ))}
          {clients.length === 0 ? <Text style={styles.muted}>No clients yet.</Text> : null}
        </View>
      ) : (
        <View>
          <TextInput style={styles.input} placeholder="Customer name" placeholderTextColor="#7a8a9a" value={oneoffName} onChangeText={setOneoffName} />
          <TextInput style={styles.input} placeholder="Phone" placeholderTextColor="#7a8a9a" value={oneoffPhone} onChangeText={setOneoffPhone} keyboardType="phone-pad" />
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#7a8a9a" value={oneoffEmail} onChangeText={setOneoffEmail} keyboardType="email-address" autoCapitalize="none" />
        </View>
      )}

      {/* job type */}
      <Text style={styles.label}>Job type</Text>
      <View style={styles.typeList}>
        {JOB_TYPES.map((t) => (
          <Pressable key={t} style={[styles.typeChip, jobType === t && styles.typeChipActive]} onPress={() => setJobType(t)}>
            <Text style={[styles.typeChipText, jobType === t && styles.typeChipTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      {/* description */}
      <Text style={styles.label}>Description of work</Text>
      <TextInput style={styles.textArea} value={description} onChangeText={setDescription} placeholder="What the job involves..." placeholderTextColor="#7a8a9a" multiline />

      {/* proposed date */}
      <Text style={styles.label}>Proposed date (optional)</Text>
      <TextInput style={styles.input} value={proposedDate} onChangeText={setProposedDate} placeholder="e.g. 2026-07-20" placeholderTextColor="#7a8a9a" />

      {/* parts */}
      <Text style={styles.section}>Parts</Text>
      {parts.map((part, i) => (
        <View key={i} style={styles.lineItem}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemDesc}>{part.description}</Text>
            <Text style={styles.itemSub}>{part.qty} × ${part.chargeEach.toFixed(2)}</Text>
          </View>
          <Text style={styles.itemAmount}>${(part.qty * part.chargeEach).toFixed(2)}</Text>
          <Pressable onPress={() => removePart(i)}><Text style={styles.removeX}>✕</Text></Pressable>
        </View>
      ))}
      <View style={styles.partForm}>
        <TextInput style={styles.partDesc} value={pDesc} onChangeText={setPDesc} placeholder="Part description" placeholderTextColor="#7a8a9a" />
        <View style={styles.partRow}>
          <TextInput style={styles.partSmall} value={pQty} onChangeText={setPQty} placeholder="Qty" placeholderTextColor="#7a8a9a" keyboardType="numeric" />
          <TextInput style={styles.partSmall} value={pCost} onChangeText={setPCost} placeholder="Cost each" placeholderTextColor="#7a8a9a" keyboardType="numeric" />
          <Pressable style={styles.addPartBtn} onPress={addPart}><Text style={styles.addPartText}>Add</Text></Pressable>
        </View>
        <Text style={styles.hint}>Markup {markup}% applied to your cost.</Text>
      </View>

      {/* labor */}
      <Text style={styles.section}>Labor</Text>
      <View style={styles.laborRow}>
        <View style={styles.laborField}>
          <Text style={styles.label}>Est. hours</Text>
          <TextInput style={styles.input} value={laborHours} onChangeText={setLaborHours} placeholder="0" placeholderTextColor="#7a8a9a" keyboardType="numeric" />
        </View>
        <View style={styles.laborField}>
          <Text style={styles.label}>Rate ($/hr)</Text>
          <TextInput style={styles.input} value={laborRate} onChangeText={setLaborRate} placeholder="0" placeholderTextColor="#7a8a9a" keyboardType="numeric" />
        </View>
      </View>

      {/* totals */}
      <View style={styles.totals}>
        <View style={styles.totalRow}><Text style={styles.totalLabel}>Parts</Text><Text style={styles.totalValue}>${partsTotal.toFixed(2)}</Text></View>
        <View style={styles.totalRow}><Text style={styles.totalLabel}>Labor</Text><Text style={styles.totalValue}>${laborTotal.toFixed(2)}</Text></View>
        <View style={styles.totalRow}><Text style={styles.grandLabel}>Quote Total</Text><Text style={styles.grandValue}>${total.toFixed(2)}</Text></View>
      </View>

      <Pressable style={styles.saveBtn} onPress={save}><Text style={styles.saveText}>Create quote</Text></Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0e1a2b" },
  heading: { color: "#4aa3df", fontSize: 24, fontWeight: "bold", marginBottom: 16 },
  toggleRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  toggleTab: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: "#33485f", alignItems: "center" },
  toggleTabActive: { backgroundColor: "#4aa3df", borderColor: "#4aa3df" },
  toggleText: { color: "#cccccc", fontSize: 14 },
  toggleTextActive: { color: "#0e1a2b", fontWeight: "600" },
  clientList: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 },
  clientChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: "#33485f" },
  clientChipActive: { backgroundColor: "#4aa3df", borderColor: "#4aa3df" },
  clientChipText: { color: "#cccccc", fontSize: 13 },
  clientChipTextActive: { color: "#0e1a2b", fontWeight: "600" },
  label: { color: "#cccccc", fontSize: 14, marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: "#1b2a3d", color: "#ffffff", fontSize: 16, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: "#33485f", marginBottom: 4 },
  textArea: { backgroundColor: "#1b2a3d", color: "#ffffff", fontSize: 15, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: "#33485f", minHeight: 70 },
  typeList: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  typeChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: "#33485f" },
  typeChipActive: { backgroundColor: "#8fd6a0", borderColor: "#8fd6a0" },
  typeChipText: { color: "#cccccc", fontSize: 13, textTransform: "capitalize" },
  typeChipTextActive: { color: "#0e1a2b", fontWeight: "600" },
  section: { color: "#4aa3df", fontSize: 17, fontWeight: "bold", marginTop: 24, marginBottom: 10 },
  lineItem: { flexDirection: "row", alignItems: "center", backgroundColor: "#1b2a3d", padding: 12, borderRadius: 8, marginBottom: 8, gap: 10 },
  itemDesc: { color: "#ffffff", fontSize: 15, fontWeight: "600" },
  itemSub: { color: "#7a8a9a", fontSize: 12, marginTop: 2 },
  itemAmount: { color: "#8fd6a0", fontSize: 15, fontWeight: "600" },
  removeX: { color: "#d9534f", fontSize: 16, paddingHorizontal: 4 },
  partForm: { backgroundColor: "#16243a", borderRadius: 10, padding: 12 },
  partDesc: { backgroundColor: "#1b2a3d", color: "#ffffff", fontSize: 15, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: "#33485f", marginBottom: 8 },
  partRow: { flexDirection: "row", gap: 8 },
  partSmall: { flex: 1, backgroundColor: "#1b2a3d", color: "#ffffff", fontSize: 15, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: "#33485f" },
  addPartBtn: { backgroundColor: "#4aa3df", justifyContent: "center", paddingHorizontal: 18, borderRadius: 8 },
  addPartText: { color: "#0e1a2b", fontWeight: "600" },
  hint: { color: "#7a8a9a", fontSize: 12, marginTop: 8 },
  laborRow: { flexDirection: "row", gap: 12 },
  laborField: { flex: 1 },
  totals: { backgroundColor: "#1b2a3d", borderRadius: 10, padding: 16, marginTop: 24 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  totalLabel: { color: "#cccccc", fontSize: 15 },
  totalValue: { color: "#ffffff", fontSize: 15 },
  grandLabel: { color: "#ffffff", fontSize: 18, fontWeight: "bold", marginTop: 4 },
  grandValue: { color: "#4aa3df", fontSize: 18, fontWeight: "bold", marginTop: 4 },
  saveBtn: { backgroundColor: "#4aa3df", alignItems: "center", paddingVertical: 16, borderRadius: 10, marginTop: 20, marginBottom: 40 },
  saveText: { color: "#0e1a2b", fontSize: 16, fontWeight: "600" },
  muted: { color: "#7a8a9a", fontSize: 14 },
  savedBox: { flex: 1, backgroundColor: "#0e1a2b", justifyContent: "center", alignItems: "center", padding: 32 },
  savedText: { color: "#8fd6a0", fontSize: 22, fontWeight: "bold" },
  savedSub: { color: "#7a8a9a", fontSize: 15, marginTop: 8, textAlign: "center" },
});