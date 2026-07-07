import { Client } from "../types/client";
import { Coords } from "./geocoding";
import { supabase } from "./supabase";

function rowToClient(row: any): Client {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    phone: row.phone,
    email: row.email ?? "",
    latitude: row.latitude,
    longitude: row.longitude,
  };
}

export async function fetchClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data.map(rowToClient);
}

export async function createClient(details: Omit<Client, "id" | "latitude" | "longitude">): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .insert({
      name: details.name,
      address: details.address,
      phone: details.phone,
      email: details.email,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToClient(data);
}

export async function updateClient(id: string, details: Omit<Client, "id" | "latitude" | "longitude">): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .update({
      name: details.name,
      address: details.address,
      phone: details.phone,
      email: details.email,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return rowToClient(data);
}

export async function deleteClientById(id: string): Promise<void> {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchClientsNeedingCoords(): Promise<Client[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .is("latitude", null);
  if (error) throw error;
  return data.map(rowToClient);
}

export async function saveClientCoords(id: string, coords: Coords): Promise<void> {
  const { error } = await supabase
    .from("clients")
    .update({ latitude: coords.latitude, longitude: coords.longitude })
    .eq("id", id);
  if (error) throw error;
}

export async function fetchClientsWithCoords(): Promise<Client[]> {
  const { data, error } = await supabase.from("clients").select("*");
  if (error) throw error;
  return data
    .filter((row) => row.latitude !== null && row.longitude !== null)
    .map(rowToClient);
}