"use server";

import { headers } from "next/headers";
import { signBookingTicket, verifyTurnstile } from "./booking-ticket";

export async function issueBookingTicket(captchaToken: string | null): Promise<{ ticket: string | null } | { error: string }> {
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
  const ticketSecret = process.env.BOOKING_TICKET_SECRET;
  if (!turnstileSecret && !ticketSecret) {
    return { ticket: null };
  }
  if (!turnstileSecret || !ticketSecret) {
    return { error: "Doğrulama ayarı eksik. Site anahtarı, gizli anahtar ve bilet sırrı birlikte tanımlanmalı." };
  }
  if (!captchaToken) {
    return { error: "Doğrulama kutusunu işaretleyin." };
  }
  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const ok = await verifyTurnstile(captchaToken, turnstileSecret, ip);
  if (!ok) return { error: "Doğrulama başarısız. Tekrar deneyin." };
  return { ticket: signBookingTicket(ticketSecret) };
}
