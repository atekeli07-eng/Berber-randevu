import {
  addCalendarDays,
  calendarDateInZone,
  type DayOff,
  type Salon,
  type Service,
  type Staff,
  type WorkingHour,
} from "@berber/shared";
import { cache } from "react";
import type { BusyRow } from "@/components/booking-wizard";
import { createClient } from "./supabase/server";

export type PublicCatalog = {
  salon: Salon;
  services: Service[];
  staff: Staff[];
  workingHours: WorkingHour[];
  daysOff: DayOff[];
  busy: BusyRow[];
};

export const loadPublicCatalog = cache(async (slug: string): Promise<PublicCatalog | null> => {
  const supabase = await createClient();
  const { data: salonRow } = await supabase.from("salons").select("*").eq("slug", slug).maybeSingle();
  if (!salonRow) return null;
  const salon = salonRow as Salon;
  const today = calendarDateInZone(new Date(), salon.timezone);
  const last = addCalendarDays(today, 60);

  const [{ data: serviceRows }, { data: staffRows }] = await Promise.all([
    supabase.from("services").select("*").eq("salon_id", salon.id).eq("active", true).order("sort_order"),
    supabase.from("staff").select("*").eq("salon_id", salon.id).eq("active", true).order("name"),
  ]);
  const services = (serviceRows ?? []) as Service[];
  const staff = (staffRows ?? []) as Staff[];
  const staffIds = staff.map((person) => person.id);

  let workingHours: WorkingHour[] = [];
  let daysOff: DayOff[] = [];
  if (staffIds.length > 0) {
    const [{ data: hourRows }, { data: offRows }] = await Promise.all([
      supabase.from("working_hours").select("*").in("staff_id", staffIds),
      supabase.from("days_off").select("*").in("staff_id", staffIds).gte("off_date", today).lte("off_date", last),
    ]);
    workingHours = (hourRows ?? []) as WorkingHour[];
    daysOff = (offRows ?? []) as DayOff[];
  }

  const { data: busyRows } = await supabase.rpc("get_salon_busy_ranges", {
    p_slug: slug,
    p_from: today,
    p_to: last,
  });

  return {
    salon,
    services,
    staff,
    workingHours,
    daysOff,
    busy: (busyRows ?? []) as BusyRow[],
  };
});
