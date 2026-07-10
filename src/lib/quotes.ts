import { Quote, QuoteInput } from "../types/quote";
import { computeTotals } from "./invoices";
import { supabase } from "./supabase";

function rowToQuote(row: any): Quote {
    return {
        id: row.id,
        clientId: row.client_id,
        oneoffName: row.oneoff_name ?? "",
        oneoffPhone: row.oneoff_phone ?? "",
        oneoffEmail: row.oneoff_email ?? "",
        jobType: row.job_type,
        description: row.desctiption ?? "",
        parts: row.parts ?? [],
        laborHours: row.labor_hours,
        laborRate: row.labor_rate,
        partsTotal: row.parts_total,
        laborTotal: row.labor_total,
        total: row.total,
        proposedDate: row.proposed_date,
        status: row.status,
        tentativeVisitId: row.tentative_visit_id,
    };
}

export async function fetchQuotes(): Promise<Quote[]> {
    const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .order("created_at", { ascending: false });
    if (error) throw error;
    return data.map(rowToQuote);
}

export async function createQuote(input: QuoteInput, tentativeVisitId: string | null = null): Promise<Quote> {
    const { partsTotal, laborTotal, total } = computeTotals(input.parts, input.laborHours, input.laborRate);

    const { data, error } = await supabase
        .from("quotes")
        .insert({
            client_id: input.clientId,
            oneoff_name: input.oneoffName,
            oneoff_phone: input.oneoffPhone,
            oneoff_email: input.oneoffEmail,
            job_type: input.jobType,
            description: input.description,
            parts: input.parts,
            labor_hours: input.laborHours,
            labor_rate: input.laborRate,
            parts_total: partsTotal,
            labor_total: laborTotal,
            total,
            proposed_date: input.proposedDate,
            status: "draft",
            tentative_visit_id: tentativeVisitId,
        })
        .select()
        .single();
    if (error) throw error;
    return rowToQuote(data);
}

export async function updateQuote(id: string, input: QuoteInput): Promise<Quote> {
    const { partsTotal, laborTotal, total } = computeTotals(input.parts, input.laborHours, input.laborRate);

    const { data, error } = await supabase
        .from("quotes")
        .update({
            client_id: input.clientId,
            oneoff_name: input.oneoffName,
            oneoff_phone: input.oneoffPhone,
            oneoff_email: input.oneoffEmail,
            job_type: input.jobType,
            description: input.description,
            parts: input.parts,
            labor_hours: input.laborHours,
            labor_rate: input.laborRate,
            parts_total: partsTotal,
            labor_total: laborTotal,
            total,
            proposed_date: input.proposedDate,
        })
        .eq("id", id)
        .select()
        .single();
    if (error) throw error;
    return rowToQuote(data);
}

export async function setQuoteStatus(id: string, status: string): Promise<void> {
    const { error } = await supabase.from("quotes").update({ status }).eq("id", id);
    if (error) throw error;
}

export async function deleteQuoteById(id: string): Promise<void> {
    const { error } = await supabase.from("quotes").delete().eq("id", id);
    if (error) throw error;
}