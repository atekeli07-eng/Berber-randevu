"use client";

import { translateError } from "@berber/shared";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { Button, Notice, inputClass } from "./ui";

export function PaymentReport({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit() {
    setPending(true);
    setError(null);
    setInfo(null);
    const supabase = createBrowserSupabase();
    const { error: rpcError } = await supabase.rpc("report_bank_transfer", { p_note: note.trim() || null });
    setPending(false);
    if (rpcError) {
      setError(translateError(rpcError));
      return;
    }
    setNote("");
    setInfo("Bildirim alındı. Havale kontrol edilince süre uzar.");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {error ? <Notice>{error}</Notice> : null}
      {info ? <Notice tone="good">{info}</Notice> : null}
      <label className="block text-sm font-medium">
        Not
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className={`${inputClass} mt-1.5 h-24 py-3`}
          placeholder="İsteğe bağlı. Dekont no veya adınız."
          maxLength={500}
        />
      </label>
      <Button type="button" onClick={() => void submit()} disabled={pending || disabled}>
        {pending ? "Gönderiliyor…" : "Ödemeyi yaptım bildir"}
      </Button>
    </div>
  );
}
