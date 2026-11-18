import Link from "next/link";

export default function MissingSalonPage() {
  return (
    <main className="mx-auto max-w-lg px-5 py-24">
      <h1 className="font-serif text-4xl">Salon kaydı bulunamadı.</h1>
      <p className="mt-3 text-sm text-muted">
        Hesap açılırken salon oluşturulamadıysa Supabase SQL günlüğüne bakın. Gerekirse çıkış yapıp yeniden kayıt olun.
      </p>
      <Link href="/giris" className="mt-6 inline-block text-sm font-semibold text-clay">
        Giriş sayfası
      </Link>
    </main>
  );
}
