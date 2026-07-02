import { Invoice, InvoiceInput, Part } from "../types/invoice";
import { supabase } from "./supabase";

export function computeTotals(parts: Part[], laborHours: number, laborRate: number) {
    const partsTotal = parts.reduce((sum, p) => sum + p.qty * p.chargeEach, 0);
    const partsCost = parts.reduce((sum, p) => sum + p.qty * p.costEach, 0);
    const laborTotal = laborHours * laborRate;
    const total = partsTotal + laborTotal;
    const profit = (partsTotal - partsCost) + laborTotal;
    return { partsTotal, laborTotal, total, profit };

}

function rowToInvoice(row: any): Invoice {
    return {
        id: row.id,
        visitId: row.visit_id,
        workDescription: row.work_description ?? "",
        parts: row.parts ?? [],
        laborHours: row.labor_hours,
        laborRate: row.labor_rate,
        partsTotal: row.parts_total,
        laborTotal: row.labor_total,
        total: row.total,
        profit: row.profit,
        status: row.status,
    };
}

export async function fetchInvoiceForVisit(visitId: string): Promise<Invoice | null> {
    const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("visit_id", visitId)
        .maybeSingle();

    if (error) throw error;
    return data ? rowToInvoice(data) : null;
}

export async function createInvoice(input: InvoiceInput): Promise<Invoice> {
    const { partsTotal, laborTotal, total, profit } = computeTotals(
        input.parts, input.laborHours, input.laborRate
    );

    const { data, error } = await supabase
        .from("invoices")
        .insert({
            visit_id: input.visitId,
            work_description: input.workDescription,
            parts: input.parts,
            labor_hours: input.laborHours,
            labor_rate: input.laborRate,
            parts_total: partsTotal,
            labor_total: laborTotal,
            total: total,
            profit: profit,
            status: "unpaid",
        })
        .select()
        .single();

    if (error) throw error;
    return rowToInvoice(data);
}

export async function updateInvoice(id: string, input: InvoiceInput): Promise<Invoice> {
    const { partsTotal, laborTotal, total, profit } = computeTotals(
        input.parts, input.laborHours, input.laborRate
    );

    const { data, error } = await supabase
        .from("invoices")
        .update({
            work_description: input.workDescription,
            parts: input.parts,
            labor_hours: input.laborHours,
            labor_rate: input.laborRate,
            parts_total: partsTotal,
            labor_total: laborTotal,
            total: total,
            profit: profit,
        })
        .eq("id", id)
        .select()
        .single();
        
    if (error) throw error;
    return rowToInvoice(data);
}

export async function setInvoiceStatus(id: string, status: string): Promise<void> {
    const { error } = await supabase.from("invoices").update({ status }).eq("id", id);
    if (error) throw error;
}