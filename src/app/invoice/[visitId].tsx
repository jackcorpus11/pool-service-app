import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import {
    computeTotals,
    createInvoice,
    fetchInvoiceForVisit,
    setInvoiceStatus,
    updateInvoice,
} from "../../lib/invoices";
import { fetchSettings } from "../../lib/settings";
import { Part } from "../../types/invoice";

export default function InvoiceScreen() {
  const { visitId } = useLocalSearchParams<{ visitId: string }>();

  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [status, setStatus] = useState("unpaid");
  const [workDescription, setWorkDescription] = useState("");
  const [parts, setParts] = useState<Part[]>([]);
  const [laborHours, setLaborHours] = useState("");
  const [laborRate, setLaborRate] = useState("");
  const [markup, setMarkup] = useState(25); // default markup % from settings

  // new-part form
  const [pDesc, setPDesc] = useState("");
  const [pQty, setPQty] = useState("1");
  const [pCost, setPCost] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const settings = await fetchSettings();
        setMarkup(settings.partsMarkupPercent);
        setLaborRate(String(settings.laborRate)); // auto-fill labor rate from settings

        const existing = await fetchInvoiceForVisit(visitId);
        if (existing) {
          setInvoiceId(existing.id);
          setStatus(existing.status);
          setWorkDescription(existing.workDescription);
          setParts(existing.parts);
          setLaborHours(String(existing.laborHours));
          setLaborRate(String(existing.laborRate));
        }
      } catch (e) {
        console.log("Error loading invoice:", (e as Error).message);
      }
    }
    load();
  }, [visitId]);

  function addPart() {
    if (pDesc.trim() === "" || pCost.trim() === "") return;
    const cost = Number(pCost.replace(/,/g, "")) || 0;
    const qty = Number(pQty.replace(/,/g, "")) || 1;
    // apply markup to get the charge price
    const chargeEach = Math.round(cost * (1 + markup / 100) * 100) / 100;
    setParts([...parts, { description: pDesc.trim(), qty, costEach: cost, chargeEach }]);
    setPDesc("");
    setPQty("1");
    setPCost("");
  }

  function removePart(index: number) {
    setParts(parts.filter((_, i) => i !== index));
  }

  // live totals as the user builds
  const hours = Number(laborHours.replace(/,/g, "")) || 0;
  const rate = Number(laborRate.replace(/,/g, "")) || 0;
  const { partsTotal, laborTotal, total, profit } = computeTotals(parts, hours, rate);

  async function saveInvoice() {
    const input = {
      visitId,
      workDescription: workDescription.trim(),
      parts,
      laborHours: hours,
      laborRate: rate,
    };
    try {
      if (invoiceId === null) {
        const created = await createInvoice(input);
        setInvoiceId(created.id);
      } else {
        await updateInvoice(invoiceId, input);
      }
    } catch (e) {
      console.log("Error saving invoice:", (e as Error).message);
    }
  }

  async function togglePaid() {
    if (invoiceId === null) return;
    const newStatus = status === "paid" ? "unpaid" : "paid";
    try {
      await setInvoiceStatus(invoiceId, newStatus);
      setStatus(newStatus);
    } catch (e) {
      console.log("Error updating status:", (e as Error).message);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.heading}>Invoice</Text>

      <Text style={styles.label}>Work performed</Text>
      <TextInput
        style={styles.textArea}
        value={workDescription}
        onChangeText={setWorkDescription}
        placeholder="Describe what was done..."
        placeholderTextColor="#7a8a9a"
        multiline
      />

      {/* PARTS */}
      <Text style={styles.section}>Parts</Text>
      {parts.map((part, i) => (
        <View key={i} style={styles.lineItem}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemDesc}>{part.description}</Text>
            <Text style={styles.itemSub}>
              {part.qty} × ${part.chargeEach.toFixed(2)} (cost ${part.costEach.toFixed(2)})
            </Text>
          </View>
          <Text style={styles.itemAmount}>${(part.qty * part.chargeEach).toFixed(2)}</Text>
          <Pressable onPress={() => removePart(i)}>
            <Text style={styles.removeX}>✕</Text>
          </Pressable>
        </View>
      ))}

      <View style={styles.partForm}>
        <TextInput style={styles.partDesc} value={pDesc} onChangeText={setPDesc}
          placeholder="Part description" placeholderTextColor="#7a8a9a" />
        <View style={styles.partRow}>
          <TextInput style={styles.partSmall} value={pQty} onChangeText={setPQty}
            placeholder="Qty" placeholderTextColor="#7a8a9a" keyboardType="numeric" />
          <TextInput style={styles.partSmall} value={pCost} onChangeText={setPCost}
            placeholder="Cost each" placeholderTextColor="#7a8a9a" keyboardType="numeric" />
          <Pressable style={styles.addPartBtn} onPress={addPart}>
            <Text style={styles.addPartText}>Add</Text>
          </Pressable>
        </View>
        <Text style={styles.hint}>Markup {markup}% applied automatically to your cost.</Text>
      </View>

      {/* LABOR */}
      <Text style={styles.section}>Labor</Text>
      <View style={styles.laborRow}>
        <View style={styles.laborField}>
          <Text style={styles.label}>Hours</Text>
          <TextInput style={styles.input} value={laborHours} onChangeText={setLaborHours}
            placeholder="0" placeholderTextColor="#7a8a9a" keyboardType="numeric" />
        </View>
        <View style={styles.laborField}>
          <Text style={styles.label}>Rate ($/hr)</Text>
          <TextInput style={styles.input} value={laborRate} onChangeText={setLaborRate}
            placeholder="0" placeholderTextColor="#7a8a9a" keyboardType="numeric" />
        </View>
      </View>

      {/* TOTALS */}
      <View style={styles.totals}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Parts</Text>
          <Text style={styles.totalValue}>${partsTotal.toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Labor</Text>
          <Text style={styles.totalValue}>${laborTotal.toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.grandLabel}>Total</Text>
          <Text style={styles.grandValue}>${total.toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.profitLabel}>Your profit</Text>
          <Text style={styles.profitValue}>${profit.toFixed(2)}</Text>
        </View>
      </View>

      <Pressable style={styles.saveBtn} onPress={saveInvoice}>
        <Text style={styles.saveText}>{invoiceId === null ? "Create invoice" : "Save changes"}</Text>
      </Pressable>

      {invoiceId !== null ? (
        <Pressable
          style={[styles.paidBtn, status === "paid" && styles.paidBtnActive]}
          onPress={togglePaid}
        >
          <Text style={[styles.paidText, status === "paid" && styles.paidTextActive]}>
            {status === "paid" ? "✓ Paid" : "Mark as paid"}
          </Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0e1a2b" },
  heading: { color: "#4aa3df", fontSize: 24, fontWeight: "bold", marginBottom: 16 },
  label: { color: "#cccccc", fontSize: 14, marginBottom: 6 },
  section: { color: "#4aa3df", fontSize: 17, fontWeight: "bold", marginTop: 24, marginBottom: 10 },
  textArea: { backgroundColor: "#1b2a3d", color: "#ffffff", fontSize: 15, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: "#33485f", minHeight: 70 },
  input: { backgroundColor: "#1b2a3d", color: "#ffffff", fontSize: 16, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: "#33485f" },
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
  profitLabel: { color: "#8fd6a0", fontSize: 14, marginTop: 4 },
  profitValue: { color: "#8fd6a0", fontSize: 14, fontWeight: "600", marginTop: 4 },
  saveBtn: { backgroundColor: "#4aa3df", alignItems: "center", paddingVertical: 14, borderRadius: 10, marginTop: 20 },
  saveText: { color: "#0e1a2b", fontSize: 16, fontWeight: "600" },
  paidBtn: { alignItems: "center", paddingVertical: 14, borderRadius: 10, marginTop: 10, borderWidth: 1, borderColor: "#8fd6a0" },
  paidBtnActive: { backgroundColor: "#8fd6a0" },
  paidText: { color: "#8fd6a0", fontSize: 16, fontWeight: "600" },
  paidTextActive: { color: "#0e1a2b" },
});