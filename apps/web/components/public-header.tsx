import Link from "next/link";

export function PublicHeader({ dark = false }: { dark?: boolean }) {
  return (
    <header className={`mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 py-5 ${dark ? "text-card" : ""}`}>
      <Link href="/" className="font-serif text-xl tracking-tight">
        Berberimrandevu
      </Link>
      <nav className="flex items-center gap-2 text-sm">
        <Link href="/giris" className={`rounded-full px-3 py-2 ${dark ? "text-card/80" : "text-ink"}`}>
          Giriş yap
        </Link>
        <Link href="/kayit" className="rounded-full bg-clay px-4 py-2 font-semibold text-card">
          1 Ay Ücretsiz Dene
        </Link>
      </nav>
    </header>
  );
}
