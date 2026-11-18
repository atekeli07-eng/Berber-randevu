import {
  calendarDateInZone,
  dayBounds,
  type DayOff,
  type Service,
  type Staff,
  type WorkingHour,
} from "@berber/shared";
import { AppointmentsBoard } from "@/components/appointments-board";
import { toAgendaItem } from "@/lib/agenda";
import { getAccessContext } from "@/lib/owner";

export const dynamic = "force-dynamic";

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tarih?: string }>;
}) {
  const params = await searchParams;
  const { supabase, salon, role, staffId } = await getAccessContext();
  const today = calendarDateInZone(new Date(), salon.timezone);
  const date = params.tarih && /^\d{4}-\d{2}-\d{2}$/.test(params.tarih) ? params.tarih : today;
  const bounds = dayBounds(date, salon.timezone);

  let appointmentQuery = supabase
    .from("appointments")
    .select("*, staff(name), services(name)")
    .eq("salon_id", salon.id)
    .gte("starts_at", bounds.start.toISOString())
    .lt("starts_at", bounds.end.toISOString())
    .order("starts_at");
  if (staffId) appointmentQuery = appointmentQuery.eq("staff_id", staffId);
  const [{ data: staffRows }, { data: serviceRows }, { data: appointmentRows }] = await Promise.all([
    supabase.from("staff").select("*").eq("salon_id", salon.id).order("name"),
    supabase.from("services").select("*").eq("salon_id", salon.id).order("sort_order"),
    appointmentQuery,
  ]);
  const staff = ((staffRows ?? []) as Staff[]).filter((person) => role === "owner" || person.id === staffId);
  const staffIds = staff.map((person) => person.id);
  const [{ data: hourRows }, { data: offRows }] =
    staffIds.length === 0
      ? [{ data: [] }, { data: [] }]
      : await Promise.all([
          supabase.from("working_hours").select("*").in("staff_id", staffIds),
          supabase.from("days_off").select("*").in("staff_id", staffIds).eq("off_date", date),
        ]);
  const hours = (hourRows ?? []) as WorkingHour[];
  const offs = (offRows ?? []) as DayOff[];

  return (
    <AppointmentsBoard
      salon={salon}
      staff={staff}
      services={(serviceRows ?? []) as Service[]}
      workingHours={hours}
      daysOff={offs}
      appointments={(appointmentRows ?? []).map((row) => toAgendaItem(row as Record<string, unknown>))}
      date={date}
    />
  );
}
