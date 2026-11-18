import type { Staff } from "@berber/shared";
import { StaffManager } from "@/components/staff-manager";
import { requireOwner } from "@/lib/owner";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const { supabase, salon } = await requireOwner();
  const { data } = await supabase.from("staff").select("*").eq("salon_id", salon.id).order("name");
  return <StaffManager salonId={salon.id} staff={(data ?? []) as Staff[]} />;
}
