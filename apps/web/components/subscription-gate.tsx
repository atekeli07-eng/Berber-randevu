"use client";

import {
  SUBSCRIPTION_STATUS_LABEL,
  accessEndsAt,
  salonAcceptsBookings,
  subscriptionReminder,
  subscriptionStatus,
  wholeDaysLeft,
  type Salon,
} from "@berber/shared";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function SubscriptionGate({
  salon,
  role,
  children,
}: {
  salon: Salon;
  role: "owner" | "staff";
  children: ReactNode;
}) {
  const path = usePathname();
  const billing = {
    trialEndsAt: salon.trial_ends_at,
    paidUntil: salon.paid_until,
    suspended: salon.suspended,
  };
  const status = subscriptionStatus(billing);
  const open = salonAcceptsBookings(billing);
  const end = accessEndsAt(billing);
  const days = end ? wholeDaysLeft(end) : 0;

  if (!open) {
    if (role === "owner" && path.startsWith("/panel/abonelik")) return <>{children}</>;
    return (
      <section className="mx-auto max-w-lg rounded-3xl border border-line bg-card p-6">
        <p className="text-xs font-semibold tracking-[0.16em] text-gold">{SUBSCRIPTION_STATUS_LABEL[status].toUpperCase()}</p>
        <h1 className="mt-2 font-serif text-4xl">
          {status === "suspended" ? "Salon askıya alındı" : "Abonelik süresi doldu"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          {role === "owner"
            ? "Yeni randevu alınmıyor. Mevcut kayıtlar duruyor. Havale bildirin; onaydan sonra süre uzar."
            : "Abonelik salon sahibine aittir. Süre yenilenince takvim yeniden açılır."}
        </p>
        {role === "owner" ? (
          <Link href="/panel/abonelik" className="mt-6 inline-flex h-11 items-center rounded-full bg-clay px-5 text-sm font-semibold text-card">
            Aboneliği aç
          </Link>
        ) : null}
      </section>
    );
  }

  return (
    <>
      {subscriptionReminder(billing) ? (
        <p className="mb-4 rounded-2xl bg-warn-soft px-4 py-3 text-sm text-gold">
          {status === "trial" ? "Deneme" : "Abonelik"} sürenizin bitmesine {days} gün kaldı.
          {role === "owner" ? (
            <>
              {" "}
              <Link href="/panel/abonelik" className="font-semibold underline">
                Abonelik
              </Link>
            </>
          ) : null}
        </p>
      ) : null}
      {children}
    </>
  );
}
