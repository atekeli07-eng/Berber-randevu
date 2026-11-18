import { translateError, type Service } from "@berber/shared";
import { getSupabase } from "./supabase";

export async function loadServices(salonId: string): Promise<Service[]> {
  const { data, error } = await getSupabase()
    .from("services")
    .select("*")
    .eq("salon_id", salonId)
    .order("sort_order")
    .order("name");
  if (error) throw new Error(translateError(error));
  return (data ?? []) as Service[];
}

export async function countServiceAppointments(serviceId: string): Promise<number> {
  const { count, error } = await getSupabase()
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("service_id", serviceId);
  if (error) throw new Error(translateError(error));
  return count ?? 0;
}

export async function insertService(
  salonId: string,
  value: Pick<Service, "name" | "duration_minutes" | "price_kurus" | "description">,
  sortOrder: number,
): Promise<void> {
  const { error } = await getSupabase().from("services").insert({
    salon_id: salonId,
    ...value,
    sort_order: sortOrder,
  });
  if (error) throw new Error(translateError(error));
}

export async function updateService(id: string, values: Partial<Service>): Promise<void> {
  const { error } = await getSupabase().from("services").update(values).eq("id", id);
  if (error) throw new Error(translateError(error));
}

export async function deleteService(id: string): Promise<void> {
  const { error } = await getSupabase().from("services").delete().eq("id", id);
  if (error) throw new Error(translateError(error));
}
