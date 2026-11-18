"use client";

import { useState } from "react";
import { translateError } from "@/lib/errors";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { Button, Field, Notice, inputClass } from "./ui";

export function StaffInvite({ staffId }: { staffId: string }) {
  const [email, setEmail] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function createInvite(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const { data, error: rpcError } = await createBrowserSupabase().rpc("create_staff_invite", {
      p_staff_id: staffId,
      p_email: email.trim(),
    });
    setPending(false);
    if (rpcError || typeof data !== "string") {
      setError(translateError(rpcError ?? new Error("Davet oluşturulamadı")));
      return;
    }
    setLink(`${window.location.origin}/davet/${data}`);
  }

  return (
    <form onSubmit={createInvite} className="space-y-3">
      <h2 className="font-serif text-2xl">Personel hesabı</h2>
      <p className="text-sm text-muted">
        Davet bir e-postaya bağlanır. Bu sürüm e-posta göndermez; bağlantıyı personele siz iletin. Personel yalnızca kendi takvimini görür.
      </p>
      {error ? <Notice>{error}</Notice> : null}
      <Field label="E-posta">
        <input className={inputClass} type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Hazırlanıyor…" : "Davet bağlantısı oluştur"}
      </Button>
      {link ? <input readOnly className={inputClass} value={link} /> : null}
    </form>
  );
}
