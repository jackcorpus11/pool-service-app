export type Weekday = 
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type ServicePlan = {
    id: string;
    poolId: string;
    scheduleType: "interval" | "weekly";
    intervalDays: number | null;
    weekdays: Weekday[];
    startDate: string;
    active: boolean;
}