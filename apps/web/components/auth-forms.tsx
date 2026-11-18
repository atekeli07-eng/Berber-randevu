"use client";

import { isValidEmail, isValidPassword } from "@berber/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { translateAuthError } from "@/lib/errors";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { Button, Card, Field, Notice, inputClass } from "./ui";

function PasswordField({
  id,
  label,
  hint,
  value,
  onChange,
  autoComplete,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <Field label={label} hint={hint}>
      <div className="relative">
        <input
          id={id}
          className={`${inputClass} pr-20`}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          required
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-clay"
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? "Gizle" : "Göster"}
        </button>
      </div>
    </Field>
  );
}

export function LoginForm({ missingConfig }: { missingConfig: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!isValidEmail(email)) {
      setError("Geçerli bir e-posta yazın. Örnek: ad@salon.com");
      return;
    }
    if (!password) {
      setError("Şifreyi yazın.");
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
      <p className="text-xs font-semibold tracking-[0.16em] text-gold">SALON PANELİ</p>
      <h1 className="mt-2 font-serif text-4xl">Panele girin</h1>
      <p className="mt-2 text-sm leading-6 text-muted">Bugünün randevuları, ekip ve hizmetler bu hesapta.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        {missingConfig ? (
          <Notice tone="warn">
            Sunucu ayarı eksik. Site yöneticisi Supabase adresini ve anon anahtarını tanımlamalı.
          </Notice>
        ) : null}
        {error ? <Notice>{error}</Notice> : null}
        <Field label="E-posta">
          <input
            id="login-email"
            className={inputClass}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            inputMode="email"
            required
            placeholder="ad@salon.com"
          />
        </Field>
        <PasswordField id="login-password" label="Şifre" value={password} onChange={setPassword} autoComplete="current-password" />
        <Button type="submit" className="w-full" disabled={pending || missingConfig}>
          {pending ? "Giriliyor…" : "Giriş Yap"}
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
          1 ay ücretsiz deneyin
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
      setError("Salon adı 2 ile 80 karakter arasında olmalı. Tabeladaki adı yazın.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Geçerli bir e-posta yazın. Onay ve şifre sıfırlama bu adrese gider.");
      return;
    }
    if (!isValidPassword(password)) {
      setError("Şifre en az 8, en fazla 72 karakter olmalı.");
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
        setInfo("Hesap açıldı. E-postadaki bağlantıyı onayladıktan sonra giriş yapın. Gelen kutusu boşsa gereksiz klasörüne bakın.");
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
      <p className="text-xs font-semibold tracking-[0.16em] text-gold">30 GÜN DENEME</p>
      <h1 className="mt-2 font-serif text-4xl">Salonunuzu açın</h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        Kart istenmez. Kayıtla salonunuz da oluşur. Deneme bitince devam etmek isterseniz havale ile ödersiniz.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        {error ? <Notice>{error}</Notice> : null}
        {info ? <Notice tone="good">{info}</Notice> : null}
        <Field label="Tabeladaki salon adı" hint="Müşterinin göreceği ad. 2–80 karakter.">
          <input
            id="signup-salon"
            className={inputClass}
            value={salonName}
            onChange={(event) => setSalonName(event.target.value)}
            autoComplete="organization"
            required
            placeholder="Kerem Berber"
          />
        </Field>
        <Field label="E-posta" hint="Panele bu adresle girersiniz.">
          <input
            id="signup-email"
            className={inputClass}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            inputMode="email"
            required
            placeholder="ad@salon.com"
          />
        </Field>
        <PasswordField
          id="signup-password"
          label="Şifre"
          hint="En az 8 karakter. Göster ile yazdığınızı kontrol edin."
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
        />
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Açılıyor…" : "1 Ay Ücretsiz Dene"}
        </Button>
      </form>
      <p className="mt-4 text-xs leading-5 text-muted">
        Devam ederek <Link href="/kosullar" className="underline">kullanım koşullarını</Link> ve{" "}
        <Link href="/kvkk" className="underline">aydınlatma metnini</Link> okuduğunuzu kabul edersiniz.
      </p>
      <p className="mt-3 text-sm text-muted">
        Hesabınız var mı?{" "}
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
      setError("Geçerli bir e-posta yazın. Kayıt olduğunuz adresi kullanın.");
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
      setInfo("Bağlantı gönderildi. Birkaç dakika içinde gelmezse gereksiz klasörüne bakın.");
    } catch (caught) {
      setError(translateAuthError(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <p className="text-xs font-semibold tracking-[0.16em] text-gold">HESAP</p>
      <h1 className="mt-2 font-serif text-4xl">Şifrenizi yenileyin</h1>
      <p className="mt-2 text-sm leading-6 text-muted">Kayıtlı e-postanıza tek kullanımlık bir bağlantı gider.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        {error ? <Notice>{error}</Notice> : null}
        {info ? <Notice tone="good">{info}</Notice> : null}
        <Field label="E-posta">
          <input
            id="reset-email"
            className={inputClass}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            inputMode="email"
            required
            placeholder="ad@salon.com"
          />
        </Field>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Gönderiliyor…" : "Bağlantı gönder"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted">
        <Link href="/giris" className="underline">
          Girişe dön
        </Link>
      </p>
    </Card>
  );
}
