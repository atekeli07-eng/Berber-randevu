import type { AppointmentStatus } from "./constants";

export type Salon = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  phone: string | null;
  /** Sokak ve kapı numarası. */
  address: string | null;
  district: string | null;
  city: string | null;
  description: string | null;
  maps_url: string | null;
  instagram: string | null;
  /** Müşteriye görünen kısa çalışma saati özeti. Personel takviminden bağımsızdır. */
  hours_summary: string | null;
  /** storage salon-media içindeki nesne yolu, ya da önizlemede yerel bir yol. */
  logo_path: string | null;
  cover_path: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
};

export type Service = {
  id: string;
  salon_id: string;
  name: string;
  duration_minutes: number;
  price_kurus: number;
  description: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Staff = {
  id: string;
  salon_id: string;
  name: string;
  title: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type WorkingHour = {
  id: string;
  staff_id: string;
  day_of_week: number;
  start_minute: number;
  end_minute: number;
};

export type DayOff = {
  id: string;
  staff_id: string;
  off_date: string;
  reason: string | null;
};

export type Appointment = {
  id: string;
  salon_id: string;
  staff_id: string;
  service_id: string;
  customer_name: string;
  customer_phone: string;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

/** Slot hesabının kullandığı çalışma aralığı. Gün içi dakika, salon saat diliminde. */
export type WorkingInterval = {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
};

/** İptal edilmemiş randevuların kapattığı aralık. */
export type BusyRange = {
  startsAt: Date;
  endsAt: Date;
};

export type TimeSlot = {
  startsAt: Date;
  endsAt: Date;
};

export type BookAppointmentInput = {
  salonSlug: string;
  staffId: string;
  serviceId: string;
  startsAt: Date;
  customerName: string;
  customerPhone: string;
};

export type BookAppointmentResult = {
  id: string;
  starts_at: string;
  ends_at: string;
  customer_name: string;
  service_name: string;
  staff_name: string;
  salon_name: string;
};
