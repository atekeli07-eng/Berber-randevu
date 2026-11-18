import { calendarDateInZone, dayBounds, formatDayHeading } from "@berber/shared";
import { DashboardView, type DashItem } from "@/components/dashboard-view";
import { toAgendaItem } from "@/lib/agenda";
import { getOwnerContext } from "@/lib/owner";

export const dynamic = "force-dynamic";

export default async function PanelHome() {
  const { supabase, salon } = await getOwnerContext();
  const today = calendarDateInZone(new Date(), salon.timezone);
  const bounds = dayBounds(today, salon.timezone);
  const [{ data: appointmentRows }, { count: staffCount }, { count: serviceCount }] = await Promise.all([
    supabase
      .from("appointments")
      .select("*, staff(name), services(name)")
      .eq("salon_id", salon.id)
      .gte("starts_at", bounds.start.toISOString())
      .lt("starts_at", bounds.end.toISOString())
      .order("starts_at"),
    supabase.from("staff").select("id", { count: "exact", head: true }).eq("salon_id", salon.id).eq("active", true),
    supabase.from("services").select("id", { count: "exact", head: true }).eq("salon_id", salon.id).eq("active", true),
  ]);

  const todayItems = (appointmentRows ?? []).map((row) => toAgendaItem(row as Record<string, unknown>));
  const upcoming: DashItem[] = todayItems
    .filter((item) => item.status === "booked")
    .slice(0, 6)
    .map((item) => ({
      id: item.id,
      customerName: item.customerName,
      startsAt: item.startsAt,
      status: item.status,
      staffName: item.staffName,
      serviceName: item.serviceName,
    }));

  return (
    <DashboardView
      salonName={salon.name}
      city={salon.city}
      bookingPath={`/s/${salon.slug}`}
      todayLabel={formatDayHeading(today, salon.timezone)}
      bookedToday={todayItems.filter((item) => item.status === "booked").length}
      doneToday={todayItems.filter((item) => item.status === "done").length}
      staffCount={staffCount ?? 0}
      serviceCount={serviceCount ?? 0}
      upcoming={upcoming}
      timeZone={salon.timezone}
    />
  );
}
