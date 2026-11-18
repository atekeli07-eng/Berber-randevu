"use client";

import { canCustomerCancel } from "@berber/shared";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { translateError } from "@/lib/errors";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { Button, Notice } from "./ui";

export function CancelActions({
  token,
  status,
  startsAt,
  cutoffHours,
}: {
  token: string;
  status: string;
  startsAt: string;
  cutoffHours: number;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const allowed = status === "booked" && canCustomerCancel(new Date(startsAt), new Date(), cutoffHours);

  async function cancel() {
    setPending(true);
    setError(null);
    const { error: rpcError } = await createBrowserSupabase().rpc("cancel_public_appointment", { p_token: token });
    setPending(false);
    if (rpcError) {
      setError(translateError(rpcError));
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-6 space-y-3">
      {error ? <Notice>{error}</Notice> : null}
      {status === "cancelled" ? <Notice tone="warn">Bu randevu iptal edildi. Saat yeniden açıldı.</Notice> : null}
      {status === "booked" && !allowed ? <Notice>İptal süresi doldu. Salonu arayın.</Notice> : null}
      {allowed ? (
        <Button type="button" variant="danger" disabled={pending} onClick={cancel}>
          {pending ? "İptal ediliyor…" : "Randevuyu iptal et"}
        </Button>
      ) : null}
    </div>
  );
}
