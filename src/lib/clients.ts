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
    phone: row.phone,
  }));
}

// CREATE — add one client
export async function createClient(details: Omit<Client, "id">): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .insert({
      name: details.name,
      address: details.address,
      phone: details.phone,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    address: data.address,
    phone: data.phone,
  };
}

// UPDATE — change one client by id
export async function updateClient(id: string, details: Omit<Client, "id">): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .update({
      name: details.name,
      address: details.address,
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
    phone: data.phone,
  };
}

// DELETE — remove one client by id
export async function deleteClientById(id: string): Promise<void> {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw error;
}