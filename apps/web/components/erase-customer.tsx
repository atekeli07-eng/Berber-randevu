"use client";

import { useState } from "react";
import { translateError } from "@/lib/errors";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { Button, Field, Notice, inputClass } from "./ui";

export function EraseCustomer() {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function erase(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setInfo(null);
    const { data, error: rpcError } = await createBrowserSupabase().rpc("erase_customer_data", { p_phone: phone });
    setPending(false);
    if (rpcError) {
      setError(translateError(rpcError));
      return;
    }
    setInfo(`${Number(data ?? 0)} kayıt anonimleştirildi.`);
  }

  return (
    <form onSubmit={erase} className="space-y-3">
      <h2 className="font-serif text-2xl">Müşteri verisini sil</h2>
      <p className="text-sm text-muted">Bu salondaki randevularda ad ve telefon silinir. Randevu saati takvimde kalır.</p>
      {error ? <Notice>{error}</Notice> : null}
      {info ? <Notice tone="good">{info}</Notice> : null}
      <Field label="Cep telefonu">
        <input className={inputClass} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="05xx xxx xx xx" />
      </Field>
      <Button type="submit" variant="danger" disabled={pending}>
        {pending ? "Siliniyor…" : "Bu telefona ait veriyi sil"}
      </Button>
    </form>
  );
}
