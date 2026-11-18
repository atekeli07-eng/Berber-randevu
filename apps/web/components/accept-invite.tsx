"use client";

import { isValidPassword } from "@berber/shared";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { translateAuthError, translateError } from "@/lib/errors";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { Button, Card, Field, Notice, inputClass } from "./ui";

export function AcceptInvite({
  token,
  email,
  salonName,
  staffName,
  accepted,
}: {
  token: string;
  email: string;
  salonName: string;
  staffName: string;
  accepted: boolean;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(accepted ? "Bu davet daha önce kabul edildi. Giriş yapın." : null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!isValidPassword(password)) {
      setError("Şifre en az 8 karakter olmalı.");
      return;
    }
    setPending(true);
    setError(null);
    const supabase = createBrowserSupabase();
    const { data, error: signError } = await supabase.auth.signUp({ email, password });
    if (signError) {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) {
        setPending(false);
        setError(translateAuthError(signError));
        return;
      }
    }
    if (!data.session && !signError) {
      window.localStorage.setItem("berber-davet", token);
      setPending(false);
      setInfo("E-postadaki bağlantıyı onaylayın, sonra giriş yapın. Davet hesabınıza bağlanır.");
      return;
    }
    const { error: acceptError } = await supabase.rpc("accept_staff_invite", { p_token: token });
    setPending(false);
    if (acceptError) {
      setError(translateError(acceptError));
      return;
    }
    router.push("/panel");
    router.refresh();
  }

  return (
    <Card>
      <p className="text-xs font-semibold tracking-[0.16em] text-gold">{salonName}</p>
      <h1 className="mt-2 font-serif text-4xl">{staffName}</h1>
      <p className="mt-2 text-sm text-muted">Bu hesap yalnızca kendi randevularınızı görür. E-posta: {email}</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        {error ? <Notice>{error}</Notice> : null}
        {info ? <Notice tone="good">{info}</Notice> : null}
        <Field label="Şifre">
          <input className={inputClass} type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </Field>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Kaydediliyor…" : "Hesabı aç ve bağla"}
        </Button>
      </form>
    </Card>
  );
}
