import { Pool } from "../types/pool";
import { supabase } from "./supabase";

export type PoolWithClient = {
  id: string;
  label: string;
};

function rowToPool(row: any): Pool {
  return {
    id: row.id,
    clientId: row.client_id,
    kind: row.kind,
    poolType: row.pool_type,
    poolSize: row.pool_size,
    equipmentNotes: row.equipment_notes,
    accessNotes: row.access_notes ?? "",
    waterFeatures: row.water_features ?? "",
    chemicalNotes: row.chemical_notes ?? "",
    lastServiced: row.last_serviced,
    gallons: row.gallons,
  };
}

export async function fetchPoolsForClient(clientId: string): Promise<Pool[]> {
  const { data, error } = await supabase
    .from("pools")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data.map(rowToPool);
}
export async function fetchPoolById(id: string): Promise<Pool | null> {
  const { data, error } = await supabase
    .from("pools")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToPool(data) : null;
}

export async function createPool(details: Omit<Pool, "id" | "lastServiced">): Promise<Pool> {
  const { data, error } = await supabase
    .from("pools")
    .insert({
      client_id: details.clientId,
      kind: details.kind,
      pool_type: details.poolType,
      pool_size: details.poolSize,
      equipment_notes: details.equipmentNotes,
      access_notes: details.accessNotes,
      water_features: details.waterFeatures,
      chemical_notes: details.chemicalNotes,
      gallons: details.gallons,
    })
    .select()
    .single();

  if (error) throw error;
  return rowToPool(data);
}

export async function deletePoolById(id: string): Promise<void> {
  const { error } = await supabase.from("pools").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchAllPoolsWithClient(): Promise<PoolWithClient[]> {
  const { data, error } = await supabase
    .from("pools")
    .select("id, kind, pool_type, clients(name)")
    .order("created_at", { ascending: true });

  if (error) throw error;

  return data.map((row: any) => ({
    id: row.id,
    label: `${row.clients?.name ?? "Unknown"} — ${row.kind === "pool" ? (row.pool_type || "pool") : row.kind}`,
  }));
}

export async function updatePool(id: string, details: Omit<Pool, "id" | "lastServiced">): Promise<Pool> {
  const { data, error } = await supabase
    .from("pools")
    .update({
      client_id: details.clientId,
      kind: details.kind,
      pool_type: details.poolType,
      pool_size: details.poolSize,
      equipment_notes: details.equipmentNotes,
      access_notes: details.accessNotes,
      water_features: details.waterFeatures,
      chemical_notes: details.chemicalNotes,
      gallons: details.gallons,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return rowToPool(data);
}

export async function fetchFirstPoolForClient(clientId: number): Promise<string | null> {
  const { data, error } = await supabase
    .from("pools")
    .select("id")
    .eq("client_id", clientId)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? data.id : null;
}