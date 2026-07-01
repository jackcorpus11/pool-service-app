import { Settings } from "../types/settings";
import { supabase } from "./supabase";

// there's only ever ONE settings row (id = 1)
export async function fetchSettings(): Promise<Settings> {
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) throw error;

  return {
    businessName: data.business_name ?? "",
    businessPhone: data.business_phone ?? "",
    partsMarkupPercent: data.parts_markup_percent,
    laborRate: data.labor_rate,
  };
}

export async function updateSettings(settings: Settings): Promise<Settings> {
  const { data, error } = await supabase
    .from("settings")
    .update({
      business_name: settings.businessName,
      business_phone: settings.businessPhone,
      parts_markup_percent: settings.partsMarkupPercent,
      labor_rate: settings.laborRate,
    })
    .eq("id", 1)
    .select()
    .single();

  if (error) throw error;

  return {
    businessName: data.business_name ?? "",
    businessPhone: data.business_phone ?? "",
    partsMarkupPercent: data.parts_markup_percent,
    laborRate: data.labor_rate,
  };
}