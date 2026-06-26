import { ChemicalReading, ReadingInput } from "../types/reading";
import { supabase } from "./supabase";

function rowToReading(row: any): ChemicalReading {
    return {
        id: row.id,
        visitId: row.visit_id,
        ph: row.ph,
        freeChlorine: row.free_chlorine,
        totalAlkalinity: row.total_alkalinity,
        calciumHardness: row.calcium_hardness,
        cyanuricAcid: row.cyanuric_acid,
        salt: row.salt,
        waterTemp: row.water_temp,
        notes: row.notes ?? "",
    };
}

export async function fetchReadingForVisit(visitId: string): Promise<ChemicalReading | null> {
    const { data, error } = await supabase
        .from("chemical_readings")
        .select("*")
        .eq("visit_id", visitId)
        .maybeSingle();
    
    if (error) throw error;
    return data ? rowToReading(data) : null;
}

export async function completeVisit(
    visitId: string,
    poolId: string,
    visitDate: string,
    reading: ReadingInput
): Promise<void> {
    const { error: readingError } = await supabase.from("chemical_readings").insert({
        visit_id: visitId,
        ph: reading.ph,
        free_chlorine: reading.freeChlorine,
        total_alkalinity: reading.totalAlkalinity,
        calcium_hardness: reading.calciumHardness,
        cyanuric_acid: reading.cyanuricAcid,
        salt: reading.salt,
        water_temp: reading.waterTemp,
        notes: reading.notes
    });
    if (readingError) throw readingError;

    const { error: visitError } = await supabase
        .from("service_visits")
        .update({ status: "done" })
        .eq("id", visitId);
    if (visitError) throw visitError;

    const { error: poolError } = await supabase
        .from("pools")
        .update({ last_visit: visitDate })
        .eq("id", poolId);
    if (poolError) throw poolError;
}