import { Pool } from "../types/pool";
import { supabase } from "./supabase";

// READ — get all pools for one client
export async function fetchPoolsForClient(clientId: string): Promise<Pool[]> {
  const { data, error } = await supabase
    .from("pools")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return data.map((row) => ({
    id: row.id,
    clientId: row.client_id,
    poolType: row.pool_type,
    poolSize: row.pool_size,
    equipmentNotes: row.equipment_notes,
  }));
}

// CREATE — add a pool under a client
export async function createPool(details: Omit<Pool, "id">): Promise<Pool> {
  const { data, error } = await supabase
    .from("pools")
    .insert({
      client_id: details.clientId,
      pool_type: details.poolType,
      pool_size: details.poolSize,
      equipment_notes: details.equipmentNotes,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    clientId: data.client_id,
    poolType: data.pool_type,
    poolSize: data.pool_size,
    equipmentNotes: data.equipment_notes,
  };
}

// UPDATE — change a pool by id
export async function updatePool(id: string, details: Omit<Pool, "id">): Promise<Pool> {
  const { data, error } = await supabase
    .from("pools")
    .update({
      client_id: details.clientId,
      pool_type: details.poolType,
      pool_size: details.poolSize,
      equipment_notes: details.equipmentNotes,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    clientId: data.client_id,
    poolType: data.pool_type,
    poolSize: data.pool_size,
    equipmentNotes: data.equipment_notes,
  };
}

// DELETE — remove a pool by id
export async function deletePoolById(id: string): Promise<void> {
  const { error } = await supabase.from("pools").delete().eq("id", id);
  if (error) throw error;
}