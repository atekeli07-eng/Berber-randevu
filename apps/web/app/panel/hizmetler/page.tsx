import type { Service } from "@berber/shared";
import { ServicesManager } from "@/components/services-manager";
import { getOwnerContext } from "@/lib/owner";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const { supabase, salon } = await getOwnerContext();
  const { data } = await supabase
    .from("services")
    .select("*")
    .eq("salon_id", salon.id)
    .order("sort_order")
    .order("name");
  return <ServicesManager salonId={salon.id} services={(data ?? []) as Service[]} />;
}
