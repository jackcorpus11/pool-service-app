import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchClients } from "../lib/clients";
import { deleteQuoteById, fetchQuotes, setQuoteStatus } from "../lib/quotes";
import { fetchSettings } from "../lib/settings";
import { confirmPendingVisit, removePendingVisit } from "../lib/visits";
import { Client } from "../types/client";
import { Quote } from "../types/quote";

export default function Quotes() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [businessName, setBusinessName] = useState("");

  async function load() {
    try {
      const [q, c, s] = await Promise.all([fetchQuotes(), fetchClients(), fetchSettings()]);
      setQuotes(q);
      setClients(c);
      setBusinessName(s.businessName);
    } catch (e) {
      console.log("Error loading quotes:", (e as Error).message);
    }
  }

  useEffect(() => { load(); }, []);

  // resolve the customer name/contact for a quote
  function customerFor(quote: Quote): { name: string; phone: string; email: string } {
    if (quote.clientId !== null) {
      const c = clients.find((c) => Number(c.id) === quote.clientId);
      return { name: c?.name ?? "Unknown client", phone: c?.phone ?? "", email: c?.email ?? "" };
    }
    return { name: quote.oneoffName || "New customer", phone: quote.oneoffPhone, email: quote.oneoffEmail };
  }

  function statusColor(status: string) {
    if (status === "approved") return "#8fd6a0";
    if (status === "declined") return "#d9534f";
    if (status === "sent") return "#e0a458";
    return "#7a8a9a"; // draft
  }

  function formatQuoteText(quote: Quote, customerName: string): string {
    const lines: string[] = [];
    lines.push(businessName || "Pool Service");
    lines.push("");
    lines.push(`Quote for ${customerName}`);
    lines.push(`Job: ${quote.jobType}`);
    if (quote.description) lines.push(`\n${quote.description}`);
    lines.push("");
    if (quote.parts.length > 0) {
      lines.push("Parts:");
      for (const p of quote.parts) {
        lines.push(`  ${p.description} — ${p.qty} × $${p.chargeEach.toFixed(2)} = $${(p.qty * p.chargeEach).toFixed(2)}`);
      }
    }
    if (quote.laborTotal > 0) lines.push(`Labor: ${quote.laborHours} hrs = $${quote.laborTotal.toFixed(2)}`);
    lines.push("");
    lines.push(`TOTAL ESTIMATE: $${quote.total.toFixed(2)}`);
    if (quote.proposedDate) lines.push(`Proposed date: ${quote.proposedDate}`);
    lines.push("");
    lines.push("Reply to approve or decline. Thank you!");
    return lines.join("\n");
  }

  async function sendQuote(quote: Quote, via: "sms" | "email") {
    const customer = customerFor(quote);
    const body = formatQuoteText(quote, customer.name);
    let url = "";
    if (via === "sms") {
      url = `sms:${customer.phone}?body=${encodeURIComponent(body)}`;
    } else {
      const subject = `Quote from ${businessName || "Pool Service"}`;
      url = `mailto:${customer.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
    try {
      await Linking.openURL(url);
      // mark as sent if it was a draft
      if (quote.status === "draft") {
        await setQuoteStatus(quote.id, "sent");
        setQuotes(quotes.map((q) => (q.id === quote.id ? { ...q, status: "sent" } : q)));
      }
    } catch (e) {
      console.log("Error sending:", (e as Error).message);
    }
  }

  async function changeStatus(quote: Quote, status: string) {
    try {
      await setQuoteStatus(quote.id, status);

      if (quote.tentativeVisitId) {
        if (status === "approved") {
          await confirmPendingVisit(quote.tentativeVisitId);
        } else if (status === "declined") {
          await removePendingVisit(quote.tentativeVisitId);
        }
      }
      setQuotes(quotes.map((q) => (q.id === quote.id ? { ...q, status } : q)));
    } catch (e) {
      console.log("Error updating status", (e as Error).message);
    }
  }

  async function remove(id: string) {
    try {
      await deleteQuoteById(id);
      setQuotes(quotes.filter((q) => q.id !== id));
    } catch (e) {
      console.log("Error deleting:", (e as Error).message);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Quotes</Text>
        <Pressable style={styles.newButton} onPress={() => router.push("/quote/new")}>
          <Text style={styles.newButtonText}>+ New</Text>
        </Pressable>
      </View>

      {quotes.length === 0 ? (
        <Text style={styles.muted}>No quotes yet. Tap + New to create one.</Text>
      ) : (
        quotes.map((quote) => {
          const customer = customerFor(quote);
          return (
            <View key={quote.id} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.customer}>{customer.name}</Text>
                <Text style={[styles.status, { color: statusColor(quote.status) }]}>{quote.status}</Text>
              </View>
              <Text style={styles.detail}>{quote.jobType} · ${quote.total.toFixed(2)}</Text>
              {quote.proposedDate ? <Text style={styles.date}>📅 {quote.proposedDate}</Text> : null}

              <View style={styles.actions}>
                <Pressable style={styles.actionBtn} onPress={() => sendQuote(quote, "sms")}>
                  <Text style={styles.actionText}>💬 Text</Text>
                </Pressable>
                <Pressable style={styles.actionBtn} onPress={() => sendQuote(quote, "email")}>
                  <Text style={styles.actionText}>✉️ Email</Text>
                </Pressable>
              </View>

              <View style={styles.statusRow}>
                <Pressable style={styles.approveBtn} onPress={() => changeStatus(quote, "approved")}>
                  <Text style={styles.approveText}>✓ Approved</Text>
                </Pressable>
                <Pressable style={styles.declineBtn} onPress={() => changeStatus(quote, "declined")}>
                  <Text style={styles.declineText}>Declined</Text>
                </Pressable>
                <Pressable onPress={() => remove(quote.id)}>
                  <Text style={styles.deleteText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0e1a2b" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  heading: { color: "#4aa3df", fontSize: 24, fontWeight: "bold" },
  newButton: { backgroundColor: "#4aa3df", paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  newButtonText: { color: "#0e1a2b", fontSize: 14, fontWeight: "600" },
  muted: { color: "#7a8a9a", fontSize: 15, textAlign: "center", marginTop: 40 },
  card: { backgroundColor: "#1b2a3d", borderRadius: 10, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  customer: { color: "#ffffff", fontSize: 17, fontWeight: "600" },
  status: { fontSize: 13, fontWeight: "600", textTransform: "capitalize" },
  detail: { color: "#8fd6a0", fontSize: 14, marginTop: 4, textTransform: "capitalize" },
  date: { color: "#aab7c4", fontSize: 13, marginTop: 4 },
  actions: { flexDirection: "row", gap: 8, marginTop: 12 },
  actionBtn: { flex: 1, backgroundColor: "#1b2a3d", borderWidth: 1, borderColor: "#4aa3df", alignItems: "center", paddingVertical: 10, borderRadius: 8 },
  actionText: { color: "#4aa3df", fontSize: 14, fontWeight: "600" },
  statusRow: { flexDirection: "row", gap: 12, marginTop: 12, alignItems: "center" },
  approveBtn: { backgroundColor: "#8fd6a0", paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  approveText: { color: "#0e1a2b", fontSize: 13, fontWeight: "600" },
  declineBtn: { borderWidth: 1, borderColor: "#e0a458", paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  declineText: { color: "#e0a458", fontSize: 13, fontWeight: "600" },
  deleteText: { color: "#d9534f", fontSize: 13, marginLeft: "auto" },
});