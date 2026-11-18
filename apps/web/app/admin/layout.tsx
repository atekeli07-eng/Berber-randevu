import Link from "next/link";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { email } = await requireAdmin();
  return (
    <div className="min-h-screen bg-paper md:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-ink text-card md:flex">
        <div className="px-6 py-7">
          <p className="font-serif text-lg">Berberimrandevu</p>
          <p className="mt-1 text-[11px] tracking-[0.18em] text-card/60">KURUCU</p>
          <p className="mt-4 truncate text-xs text-card/60">{email}</p>
        </div>
        <nav className="flex flex-col gap-1 px-3 text-sm">
          <Link href="/admin" className="rounded-2xl px-4 py-3 hover:bg-white/5">Özet</Link>
          <Link href="/admin/salonlar" className="rounded-2xl px-4 py-3 hover:bg-white/5">Salonlar</Link>
          <Link href="/admin/ayarlar" className="rounded-2xl px-4 py-3 hover:bg-white/5">Ücret ve IBAN</Link>
          <Link href="/panel" className="rounded-2xl px-4 py-3 text-card/60 hover:bg-white/5">Salon paneli</Link>
        </nav>
      </aside>
      <div className="mx-auto w-full max-w-5xl px-4 py-6 pb-24">
        <nav className="mb-4 flex gap-3 text-sm font-semibold md:hidden">
          <Link href="/admin">Özet</Link>
          <Link href="/admin/salonlar">Salonlar</Link>
          <Link href="/admin/ayarlar">Ayar</Link>
        </nav>
        {children}
      </div>
    </div>
  );
}
