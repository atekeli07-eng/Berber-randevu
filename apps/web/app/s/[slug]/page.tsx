import { resolveSalonImage } from "@berber/shared";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicBooking } from "@/components/public-booking";
import { SalonBanner } from "@/components/salon-banner";
import { loadPublicCatalog } from "@/lib/catalog";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!hasSupabaseEnv()) return { title: "Randevu" };
  const catalog = await loadPublicCatalog(slug);
  return { title: catalog ? `${catalog.salon.name} randevu` : "Salon bulunamadı" };
}

export default async function BookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabaseEnv()) {
    return (
      <main className="mx-auto max-w-lg px-5 py-16">
        <h1 className="font-serif text-4xl">Bağlantı hazır değil.</h1>
        <p className="mt-3 text-sm text-muted">Salon sahibi Supabase ayarlarını tamamladığında bu sayfa açılır.</p>
      </main>
    );
  }
  const catalog = await loadPublicCatalog(slug);
  if (!catalog) notFound();

  const logoUrl = resolveSalonImage(process.env.NEXT_PUBLIC_SUPABASE_URL, catalog.salon.logo_path, catalog.salon.updated_at);
  const coverUrl = resolveSalonImage(process.env.NEXT_PUBLIC_SUPABASE_URL, catalog.salon.cover_path, catalog.salon.updated_at);

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <SalonBanner salon={catalog.salon} logoUrl={logoUrl} coverUrl={coverUrl} />
      <PublicBooking catalog={catalog} />
    </main>
  );
}
