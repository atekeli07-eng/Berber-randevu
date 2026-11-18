"use client";

import { isValidEmail, isValidPassword } from "@berber/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { translateAuthError } from "@/lib/errors";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { Button, Card, Field, Notice, inputClass } from "./ui";

export function LoginForm({ missingConfig }: { missingConfig: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!isValidEmail(email) || !password) {
      setError("E-posta ve şifreyi kontrol edin.");
      return;
    }
    setPending(true);
    try {
      const supabase = createBrowserSupabase();
      const { error: signError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signError) {
        setError(translateAuthError(signError));
        return;
      }
      router.push("/panel");
      router.refresh();
    } catch (caught) {
      setError(translateAuthError(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <h1 className="font-serif text-4xl">Giriş yap</h1>
      <p className="mt-2 text-sm text-muted">Salon panelinize dönün.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {missingConfig ? (
          <Notice tone="warn">
            Supabase ayarları yok. README’deki adımlarla proje açıp apps/web/.env.local dosyasını doldurun.
          </Notice>
        ) : null}
        {error ? <Notice>{error}</Notice> : null}
        <Field label="E-posta">
          <input className={inputClass} type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
        </Field>
        <Field label="Şifre">
          <input className={inputClass} type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
        </Field>
        <Button type="submit" className="w-full" disabled={pending || missingConfig}>
          {pending ? "Giriliyor…" : "Giriş yap"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted">
        <Link href="/sifre-sifirla" className="underline">
          Şifremi unuttum
        </Link>
      </p>
      <p className="mt-2 text-sm text-muted">
        Salonunuz yok mu?{" "}
        <Link href="/kayit" className="font-semibold text-ink underline">
          Kayıt olun
        </Link>
      </p>
    </Card>
  );
}

export function SignupForm() {
  const router = useRouter();
  const [salonName, setSalonName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const name = salonName.trim().replace(/\s+/g, " ");
    if (name.length < 2 || name.length > 80) {
      setError("Salon adı 2 ile 80 karakter arasında olmalı.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Geçerli bir e-posta girin.");
      return;
    }
    if (!isValidPassword(password)) {
      setError("Şifre en az 8 karakter olmalı.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const supabase = createBrowserSupabase();
      const { data, error: signError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { salon_name: name },
          emailRedirectTo: `${window.location.origin}/panel`,
        },
      });
      if (signError) {
        setError(translateAuthError(signError));
        return;
      }
      if (!data.session) {
        setInfo("Hesap açıldı. E-postadaki bağlantıyı onayladıktan sonra giriş yapın.");
        return;
      }
      router.push("/panel");
      router.refresh();
    } catch (caught) {
      setError(translateAuthError(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <h1 className="font-serif text-4xl">Salonunu aç</h1>
      <p className="mt-2 text-sm text-muted">Kayıtla birlikte salon kaydınız da oluşur.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {error ? <Notice>{error}</Notice> : null}
        {info ? <Notice tone="good">{info}</Notice> : null}
        <Field label="Salon adı">
          <input className={inputClass} value={salonName} onChange={(event) => setSalonName(event.target.value)} />
        </Field>
        <Field label="E-posta">
          <input className={inputClass} type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
        </Field>
        <Field label="Şifre" hint="En az 8 karakter.">
          <input className={inputClass} type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" />
        </Field>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Açılıyor…" : "Hesap oluştur"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted">
        Zaten hesabınız var mı?{" "}
        <Link href="/giris" className="font-semibold text-ink underline">
          Giriş yapın
        </Link>
      </p>
    </Card>
  );
}

export function ResetForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!isValidEmail(email)) {
      setError("Geçerli bir e-posta girin.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const supabase = createBrowserSupabase();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/giris`,
      });
      if (resetError) {
        setError(translateAuthError(resetError));
        return;
      }
      setInfo("Sıfırlama bağlantısı e-postanıza gönderildi.");
    } catch (caught) {
      setError(translateAuthError(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <h1 className="font-serif text-4xl">Şifreyi yenile</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {error ? <Notice>{error}</Notice> : null}
        {info ? <Notice tone="good">{info}</Notice> : null}
        <Field label="E-posta">
          <input className={inputClass} type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </Field>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Gönderiliyor…" : "Bağlantı gönder"}
        </Button>
      </form>
    </Card>
  );
}
