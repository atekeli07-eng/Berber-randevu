"use client";

import { parseTryToKurus, translateError } from "@berber/shared";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { Button, Notice, inputClass } from "./ui";

export function ApprovePayment({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function approve() {
    setPending(true);
    setError(null);
    const { error: rpcError } = await createBrowserSupabase().rpc("approve_salon_payment", { p_payment_id: paymentId });
    setPending(false);
    if (rpcError) {
      setError(translateError(rpcError));
      return;
    }
    router.refresh();
  }

  return (
    <div>
      {error ? <Notice>{error}</Notice> : null}
      <Button type="button" onClick={() => void approve()} disabled={pending}>
        {pending ? "Onaylanıyor…" : "Havaleyi onayla"}
      </Button>
    </div>
  );
}

export function ExtendSalon({ salonId }: { salonId: string }) {
  const router = useRouter();
  const [months, setMonths] = useState("1");
  const [amount, setAmount] = useState("0");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function extend() {
    const parsed = parseTryToKurus(amount);
    const count = Number(months);
    if (parsed === null || !Number.isInteger(count)) {
      setError("Ay ve tutar geçersiz.");
      return;
    }
    setPending(true);
    setError(null);
    const { error: rpcError } = await createBrowserSupabase().rpc("admin_extend_salon", {
      p_salon_id: salonId,
      p_months: count,
      p_amount_kurus: parsed,
      p_note: note.trim() || null,
    });
    setPending(false);
    if (rpcError) {
      setError(translateError(rpcError));
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {error ? <Notice>{error}</Notice> : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm">Ay
          <input value={months} onChange={(event) => setMonths(event.target.value)} className={`${inputClass} mt-1`} inputMode="numeric" />
        </label>
        <label className="text-sm">Tutar (TL)
          <input value={amount} onChange={(event) => setAmount(event.target.value)} className={`${inputClass} mt-1`} inputMode="decimal" />
        </label>
        <label className="text-sm">Not
          <input value={note} onChange={(event) => setNote(event.target.value)} className={`${inputClass} mt-1`} />
        </label>
      </div>
      <Button type="button" onClick={() => void extend()} disabled={pending}>
        {pending ? "Kaydediliyor…" : "Süre ekle"}
      </Button>
    </div>
  );
}

export function SuspendSalon({ salonId, suspended }: { salonId: string; suspended: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function toggle() {
    setPending(true);
    setError(null);
    const { error: rpcError } = await createBrowserSupabase().rpc("admin_set_suspended", {
      p_salon_id: salonId,
      p_suspended: !suspended,
    });
    setPending(false);
    if (rpcError) {
      setError(translateError(rpcError));
      return;
    }
    router.refresh();
  }

  return (
    <div>
      {error ? <Notice>{error}</Notice> : null}
      <Button type="button" variant={suspended ? "primary" : "danger"} onClick={() => void toggle()} disabled={pending}>
        {suspended ? "Askıyı kaldır" : "Askıya al"}
      </Button>
    </div>
  );
}

export function BillingSettingsForm({
  priceTl,
  iban,
  holder,
  bank,
  trialDays,
}: {
  priceTl: string;
  iban: string;
  holder: string;
  bank: string;
  trialDays: string;
}) {
  const router = useRouter();
  const [price, setPrice] = useState(priceTl);
  const [ibanValue, setIban] = useState(iban);
  const [holderValue, setHolder] = useState(holder);
  const [bankValue, setBank] = useState(bank);
  const [days, setDays] = useState(trialDays);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function save() {
    const parsed = parseTryToKurus(price);
    const trial = Number(days);
    if (parsed === null || !Number.isInteger(trial)) {
      setError("Ücret ve deneme günü sayı olmalı.");
      return;
    }
    setPending(true);
    setError(null);
    setInfo(null);
    const { error: rpcError } = await createBrowserSupabase().rpc("admin_update_billing_settings", {
      p_monthly_price_kurus: parsed,
      p_iban: ibanValue,
      p_account_holder: holderValue,
      p_bank_name: bankValue,
      p_trial_days: trial,
    });
    setPending(false);
    if (rpcError) {
      setError(translateError(rpcError));
      return;
    }
    setInfo("Kaydedildi. Yeni salonların deneme süresi bundan sonra geçerli.");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {error ? <Notice>{error}</Notice> : null}
      {info ? <Notice tone="good">{info}</Notice> : null}
      <label className="block text-sm">Aylık ücret (TL)
        <input value={price} onChange={(event) => setPrice(event.target.value)} className={`${inputClass} mt-1`} />
      </label>
      <label className="block text-sm">IBAN
        <input value={ibanValue} onChange={(event) => setIban(event.target.value)} className={`${inputClass} mt-1`} />
      </label>
      <label className="block text-sm">Hesap sahibi
        <input value={holderValue} onChange={(event) => setHolder(event.target.value)} className={`${inputClass} mt-1`} />
      </label>
      <label className="block text-sm">Banka
        <input value={bankValue} onChange={(event) => setBank(event.target.value)} className={`${inputClass} mt-1`} />
      </label>
      <label className="block text-sm">Yeni kayıtların deneme günü
        <input value={days} onChange={(event) => setDays(event.target.value)} className={`${inputClass} mt-1`} inputMode="numeric" />
      </label>
      <Button type="button" onClick={() => void save()} disabled={pending}>
        {pending ? "Kaydediliyor…" : "Kaydet"}
      </Button>
    </div>
  );
}
