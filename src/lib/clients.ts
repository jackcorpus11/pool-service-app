import { Client } from "../types/client";
import { supabase } from "./supabase";

// READ — get all clients
export async function fetchClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    address: row.address,
    poolType: row.pool_type,
    poolSize: row.pool_size,
    phone: row.phone,
  }));
}

// CREATE — add one client, return the saved version
export async function createClient(details: Omit<Client, "id">): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .insert({
      name: details.name,
      address: details.address,
      pool_type: details.poolType,
      pool_size: details.poolSize,
      phone: details.phone,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    address: data.address,
    poolType: data.pool_type,
    poolSize: data.pool_size,
    phone: data.phone,
  };
}

// UPDATE — change one client by id, return the updated version
export async function updateClient(id: string, details: Omit<Client, "id">): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .update({
      name: details.name,
      address: details.address,
      pool_type: details.poolType,
      pool_size: details.poolSize,
      phone: details.phone,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    address: data.address,
    poolType: data.pool_type,
    poolSize: data.pool_size,
    phone: data.phone,
  };
}

// DELETE — remove one client by id
export async function deleteClientById(id: string): Promise<void> {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw error;
}