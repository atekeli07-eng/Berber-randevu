import type { DayOff, Staff, WorkingHour } from "@berber/shared";
import { notFound } from "next/navigation";
import { StaffEditor } from "@/components/staff-editor";
import { getOwnerContext } from "@/lib/owner";

export const dynamic = "force-dynamic";

export default async function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, salon } = await getOwnerContext();
  const { data: staffRow } = await supabase.from("staff").select("*").eq("id", id).eq("salon_id", salon.id).maybeSingle();
  if (!staffRow) notFound();
  const [{ data: hours }, { data: daysOff }] = await Promise.all([
    supabase.from("working_hours").select("*").eq("staff_id", id),
    supabase.from("days_off").select("*").eq("staff_id", id).order("off_date"),
  ]);
  return (
    <StaffEditor
      staff={staffRow as Staff}
      hours={(hours ?? []) as WorkingHour[]}
      daysOff={(daysOff ?? []) as DayOff[]}
    />
  );
}
