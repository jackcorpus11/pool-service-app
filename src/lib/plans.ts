import { ServicePlan } from "../types/plan";
import { supabase } from "./supabase";

export async function fetchPlansForPool(poolId: string): Promise<ServicePlan[]> {
  const { data, error } = await supabase
    .from("service_plans")
    .select("*")
    .eq("pool_id", poolId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return data.map((row) => ({
    id: row.id,
    poolId: row.pool_id,
    scheduleType: row.schedule_type,
    intervalDays: row.interval_days,
    weekdays: row.weekdays ?? [],
    startDate: row.start_date,
    active: row.active,
  }));
}

export async function createPlan(details: Omit<ServicePlan, "id">): Promise<ServicePlan> {
  const { data, error } = await supabase
    .from("service_plans")
    .insert({
      pool_id: details.poolId,
      schedule_type: details.scheduleType,
      interval_days: details.intervalDays,
      weekdays: details.weekdays,
      start_date: details.startDate,
      active: details.active,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    poolId: data.pool_id,
    scheduleType: data.schedule_type,
    intervalDays: data.interval_days,
    weekdays: data.weekdays ?? [],
    startDate: data.start_date,
    active: data.active,
  };
}

export async function deletePlanById(id: string): Promise<void> {
  const { error } = await supabase.from("service_plans").delete().eq("id", id);
  if (error) throw error;
}