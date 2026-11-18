import {
  calendarDateInZone,
  dayBounds,
  translateError,
  type AppointmentStatus,
  type DayOff,
  type Salon,
  type Service,
  type Staff,
  type WorkingHour,
} from "@berber/shared";
import { getSupabase } from "./supabase";

export type MobileAppointment = {
  id: string;
  customerName: string;
  customerPhone: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  staffId: string;
  staffName: string;
  serviceName: string;
};

function relatedName(value: unknown): string {
  if (Array.isArray(value)) return relatedName(value[0]);
  if (value && typeof value === "object" && "name" in value) {
    return String((value as { name: unknown }).name ?? "");
  }
  return "";
}

function asStatus(status: unknown): AppointmentStatus {
  if (status === "done" || status === "cancelled" || status === "booked" || status === "blocked") return status;
  return "booked";
}

export type AccessRole = "owner" | "staff";

export async function loadAccess(): Promise<{ role: AccessRole; salon: Salon; staffId: string | null }> {
  const supabase = getSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("Oturum bulunamadı. Tekrar giriş yapın.");
  await supabase.rpc("accept_staff_invite", { p_token: null }).then(
    () => undefined,
    () => undefined,
  );
  const { data: owned, error: ownedError } = await supabase.from("salons").select("*").eq("owner_id", userData.user.id).maybeSingle();
  if (ownedError) throw new Error(translateError(ownedError));
  if (owned) return { role: "owner", salon: owned as Salon, staffId: null };
  const { data: staffRow, error: staffError } = await supabase
    .from("staff")
    .select("id, salon_id")
    .eq("user_id", userData.user.id)
    .eq("active", true)
    .maybeSingle();
  if (staffError) throw new Error(translateError(staffError));
  if (!staffRow) throw new Error("Bu hesaba bağlı salon yok.");
  const { data: salonRow, error: salonError } = await supabase.from("salons").select("*").eq("id", staffRow.salon_id).maybeSingle();
  if (salonError) throw new Error(translateError(salonError));
  if (!salonRow) throw new Error("Bu hesaba bağlı salon yok.");
  return { role: "staff", salon: salonRow as Salon, staffId: String(staffRow.id) };
}

export async function loadSalonGraph(): Promise<{
  salon: Salon;
  staff: Staff[];
  services: Service[];
  workingHours: WorkingHour[];
  daysOff: DayOff[];
}> {
  const { salon } = await loadAccess();
  const supabase = getSupabase();

  const [{ data: staffRows, error: staffError }, { data: serviceRows, error: serviceError }] = await Promise.all([
    supabase.from("staff").select("*").eq("salon_id", salon.id).order("name"),
    supabase.from("services").select("*").eq("salon_id", salon.id).order("sort_order"),
  ]);
  if (staffError) throw new Error(translateError(staffError));
  if (serviceError) throw new Error(translateError(serviceError));
  const staff = (staffRows ?? []) as Staff[];
  const services = (serviceRows ?? []) as Service[];
  const ids = staff.map((person) => person.id);
  if (ids.length === 0) {
    return { salon, staff, services, workingHours: [], daysOff: [] };
  }
  const [{ data: hours, error: hourError }, { data: offs, error: offError }] = await Promise.all([
    supabase.from("working_hours").select("*").in("staff_id", ids),
    supabase.from("days_off").select("*").in("staff_id", ids),
  ]);
  if (hourError) throw new Error(translateError(hourError));
  if (offError) throw new Error(translateError(offError));
  return {
    salon,
    staff,
    services,
    workingHours: (hours ?? []) as WorkingHour[],
    daysOff: (offs ?? []) as DayOff[],
  };
}

export async function loadAppointments(salon: Salon, date: string): Promise<MobileAppointment[]> {
  const supabase = getSupabase();
  const bounds = dayBounds(date, salon.timezone);
  const { data, error } = await supabase
    .from("appointments")
    .select("*, staff(name), services(name)")
    .eq("salon_id", salon.id)
    .gte("starts_at", bounds.start.toISOString())
    .lt("starts_at", bounds.end.toISOString())
    .order("starts_at");
  if (error) throw new Error(translateError(error));
  return (data ?? []).map((row) => {
    const record = row as Record<string, unknown>;
    return {
      id: String(record.id),
      customerName: String(record.customer_name ?? ""),
      customerPhone: String(record.customer_phone ?? ""),
      startsAt: String(record.starts_at),
      endsAt: String(record.ends_at),
      status: asStatus(record.status),
      staffId: String(record.staff_id),
      staffName: relatedName(record.staff),
      serviceName: relatedName(record.services),
    };
  });
}

export async function loadAppointment(id: string): Promise<{ salon: Salon; item: MobileAppointment | null }> {
  const graph = await loadSalonGraph();
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("appointments")
    .select("*, staff(name), services(name)")
    .eq("id", id)
    .eq("salon_id", graph.salon.id)
    .maybeSingle();
  if (error) throw new Error(translateError(error));
  if (!data) return { salon: graph.salon, item: null };
  const record = data as Record<string, unknown>;
  return {
    salon: graph.salon,
    item: {
      id: String(record.id),
      customerName: String(record.customer_name ?? ""),
      customerPhone: String(record.customer_phone ?? ""),
      startsAt: String(record.starts_at),
      endsAt: String(record.ends_at),
      status: asStatus(record.status),
      staffId: String(record.staff_id),
      staffName: relatedName(record.staff),
      serviceName: relatedName(record.services),
    },
  };
}

export function todayInSalon(salon: Salon): string {
  return calendarDateInZone(new Date(), salon.timezone);
}

export async function setAppointmentStatus(id: string, status: "done" | "cancelled"): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
  if (error) throw new Error(translateError(error));
}
