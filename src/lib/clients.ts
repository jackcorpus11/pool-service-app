import { Client } from "../types/client";
import { Coords } from "./geocoding";
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
    latitude: row.latitude,
    longitude: row.longitude,
  }));
}

// CREATE — add one client
export async function createClient(details: Omit<Client, "id" | "latitude" | "longitude">): Promise<Client> {
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
    latitude: data.latitude,
    longitude: data.longitude,
  };
}

// UPDATE — change one client by id
export async function updateClient(id: string, details: Omit<Client, "id" | "latitude" | "longitude">): Promise<Client> {
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
    latitude: data.latitude,
    longitude: data.longitude,
  };
}

// DELETE — remove one client by id
export async function deleteClientById(id: string): Promise<void> {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw error;
}

// fetch only clients that don't have coordinates yet
export async function fetchClientsNeedingCoords(): Promise<Client[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .is("latitude", null);

  if (error) throw error;

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    address: row.address,
    phone: row.phone,
    latitude: row.latitude,
    longitude: row.longitude,
  }));
}

// save coordinates onto a client
export async function saveClientCoords(id: string, coords: Coords): Promise<void> {
  const { error } = await supabase
    .from("clients")
    .update({ latitude: coords.latitude, longitude: coords.longitude })
    .eq("id", id);

  if (error) throw error;
}

export async function fetchClientsWithCoords(): Promise<Client[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("*");
  
  if (error) throw error;

  return data 
    .filter((row) => row.latitude != null && row.longitude != null)
    .map((row) => ({
      id: row.id,
      name: row.name,
      address: row.address,
      phone: row.phone,
      latitude: row.latitude,
      longitude: row.longitude,
  }));
}
