import { ServicePlan } from "../types/plan";
import { ServiceVisit } from "../types/visit";
import { supabase } from "./supabase";

export type VisitWithDetails = ServiceVisit & {
  clientName: string;
  clientAddress: string;
  poolKind: string;
  latitude: number | null;
  longitude: number | null;
};

const WEEKDAY_NUMBERS: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};
 
// READ — visits joined with client name + address, for the schedule
export async function fetchVisitsWithDetails(): Promise<VisitWithDetails[]> {
  const { data, error } = await supabase
    .from("service_visits")
    .select("*, pools(kind, clients(name, address, latitude, longitude))")
    .order("visit_date", { ascending: true });

  if (error) throw error;

  return data.map((row: any) => ({
    id: row.id,
    poolId: row.pool_id,
    planId: row.plan_id,
    visitDate: row.visit_date,
    status: row.status,
    jobType: row.job_type,
    poolKind: row.pools?.kind ?? "pool",
    clientName: row.pools?.clients?.name ?? "Unknown client",
    clientAddress: row.pools?.clients?.address ?? "",
    latitude: row.pools?.clients?.latitude ?? null,
    longitude: row.pools?.clients?.longitude ?? null,
  }));
}

// GENERATE — turn a plan into dated visits (both modes), stamped with a job type
export async function generateVisitsForPlan(
  plan: ServicePlan,
  jobType: string = "cleaning",
  monthsAhead: number = 3
): Promise<void> {
  const dates: string[] = [];
  const start = new Date(plan.startDate + "T00:00:00");
  const cutoff = new Date(start);
  cutoff.setMonth(cutoff.getMonth() + monthsAhead);

  if (plan.scheduleType === "interval") {
    const interval = plan.intervalDays ?? 7;
    const current = new Date(start);
    while (current <= cutoff) {
      dates.push(current.toISOString().slice(0, 10));
      current.setDate(current.getDate() + interval);
    }
  } else {
    const targetDays = plan.weekdays.map((d) => WEEKDAY_NUMBERS[d]);
    const current = new Date(start);
    while (current <= cutoff) {
      if (targetDays.includes(current.getDay())) {
        dates.push(current.toISOString().slice(0, 10));
      }
      current.setDate(current.getDate() + 1);
    }
  }

  const rows = dates.map((d) => ({
    plan_id: plan.id,
    pool_id: plan.poolId,
    visit_date: d,
    status: "scheduled",
    job_type: jobType,
  }));

  const { error } = await supabase.from("service_visits").insert(rows);
  if (error) throw error;
}

// CREATE — a single one-off visit (not tied to a plan)
export async function createOneOffVisit(
  poolId: string,
  visitDate: string,
  jobType: string
): Promise<void> {
  const { error } = await supabase.from("service_visits").insert({
    pool_id: poolId,
    plan_id: null,
    visit_date: visitDate,
    status: "scheduled",
    job_type: jobType,
  });
  if (error) throw error;
}

// UPDATE — change a visit's job type
export async function updateVisitJobType(id: string, jobType: string): Promise<void> {
  const { error } = await supabase.from("service_visits").update({ job_type: jobType }).eq("id", id);
  if (error) throw error;
}

// DELETE — remove a visit
export async function deleteVisitById(id: string): Promise<void> {
  const { error } = await supabase.from("service_visits").delete().eq("id", id);
  if (error) throw error;
}

export async function skipVisit(id: string): Promise<void> {
  const { error } = await supabase
    .from("service_visits")
    .update({ status: "skipped" })
    .eq("id", id);
  if (error) throw error;
}

export async function rescheduleVisit(id: string, newDate: string): Promise<void> {
  const { error } = await supabase
    .from("service_visits")
    .update({ visit_date: newDate, status: "scheduled" })
    .eq("id", id);
  if (error) throw error;
}

export type HistoryEntry = { 
  id: string;
  visitDate: string;
  jobType: string;
  clientName: string;
  poolKind: string;
  reading: {
    ph: number | null;
    freeChlorine: number | null;
    totalAlkalinity: number | null;
    cyanuricAcid: number | null;
    calciumHardness: number | null;
    salt: number | null;
    waterTemp: number | null;
    notes: string;
  } | null;
};

export async function fetchAllHistory(): Promise<HistoryEntry[]> {
  const { data, error } = await supabase
    .from("service_visits")
    .select("*, pool(kind, clients(name)), chemical_readings(*)")
    .eq("status", "done")
    .order("visit_date", { ascending: false });

    if (error) throw error;

  return data
    .filter((row: any) => row.status === "done")
    .map((row: any) => {
      const r = row.chemical_readings?.[0];
      return {
        id: row.id,
        visitDate: row.visit_date,
        jobType: row.job_type,
        clientName: row.pool?.clients?.name ?? "Unknown Client",
        poolKind: row.pool?.kind ?? "pool",
        reading: r
          ? {
            ph: r.ph,
            freeChlorine: r.free_chlorine,
            totalAlkalinity: r.total_alkalinity,
            cyanuricAcid: r.cyanuric_acid,
            calciumHardness: r.calcium_hardness,
            salt: r.salt,
            waterTemp: r.water_temp,
            notes: r.notes?? "",
          }
          : null,
      };
    });
}

export type VisitContact = { name: string; phone: string; email: string };

export async function fetchVisitContact(visitId: string): Promise<VisitContact> {
  const { data, error } = await supabase
    .from("service_visits")
    .select("pools(clients(name, phone, email))")
    .eq("id", visitId)
    .single();
  if (error) throw error;
  const c = ( data as any).pools?.clients;
  return {
    name: c?.name ?? "Customer",
    phone: c?.phone ?? "",
    email: c?.email ?? "",
  };
}