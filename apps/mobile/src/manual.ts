import { translateError } from "@berber/shared";
import { getSupabase } from "./supabase";

export async function createManualAppointment(input: {
  staffId: string;
  serviceId: string;
  startsAt: string;
  customerName: string;
  customerPhone: string | null;
}): Promise<void> {
  const { error } = await getSupabase().rpc("create_manual_appointment", {
    p_staff_id: input.staffId,
    p_service_id: input.serviceId,
    p_starts_at: input.startsAt,
    p_customer_name: input.customerName,
    p_customer_phone: input.customerPhone,
  });
  if (error) throw new Error(translateError(error));
}

export async function createBlockedTime(input: { staffId: string; startsAt: string; durationMinutes: number }): Promise<void> {
  const { error } = await getSupabase().rpc("create_blocked_time", {
    p_staff_id: input.staffId,
    p_starts_at: input.startsAt,
    p_duration_minutes: input.durationMinutes,
  });
  if (error) throw new Error(translateError(error));
}

export async function eraseCustomer(phone: string): Promise<number> {
  const { data, error } = await getSupabase().rpc("erase_customer_data", { p_phone: phone });
  if (error) throw new Error(translateError(error));
  return Number(data ?? 0);
}
