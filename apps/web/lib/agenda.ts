import type { AppointmentStatus } from "@berber/shared";

export type AgendaItem = {
  id: string;
  customerName: string;
  customerPhone: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  staffId: string;
  staffName: string;
  serviceId: string;
  serviceName: string;
  notes: string | null;
};

function relatedName(value: unknown): string {
  if (Array.isArray(value)) return relatedName(value[0]);
  if (value && typeof value === "object" && "name" in value) {
    return String((value as { name: unknown }).name ?? "");
  }
  return "";
}

export function toAgendaItem(row: Record<string, unknown>): AgendaItem {
  const status = row.status;
  const safeStatus: AppointmentStatus =
    status === "done" || status === "cancelled" || status === "booked" ? status : "booked";
  return {
    id: String(row.id),
    customerName: String(row.customer_name ?? ""),
    customerPhone: String(row.customer_phone ?? ""),
    startsAt: String(row.starts_at),
    endsAt: String(row.ends_at),
    status: safeStatus,
    staffId: String(row.staff_id),
    staffName: relatedName(row.staff),
    serviceId: String(row.service_id),
    serviceName: relatedName(row.services),
    notes: row.notes ? String(row.notes) : null,
  };
}
