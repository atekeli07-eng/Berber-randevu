import Link from "next/link";

export function PublicHeader() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
      <Link href="/" className="font-serif text-xl tracking-tight">
        Berberimrandevu
      </Link>
      <nav className="flex items-center gap-2 text-sm">
        <Link href="/giris" className="rounded-full px-3 py-2">
          Giriş
        </Link>
        <Link href="/kayit" className="rounded-full bg-ink px-4 py-2 text-card">
          Salon aç
        </Link>
      </nav>
    </header>
  );
}
