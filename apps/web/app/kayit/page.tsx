import { AuthAside } from "@/components/auth-aside";
import { SignupForm } from "@/components/auth-forms";
import { PublicHeader } from "@/components/public-header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "1 ay ücretsiz dene",
  description: "Berber salonunuz için randevu sayfasını 30 gün ücretsiz açın. Kart gerekmez. Müşteri hesap açmadan saat seçer.",
  openGraph: {
    title: "1 ay ücretsiz dene · Berberimrandevu",
    description: "Salonunuzu kaydedin. Kart istenmez.",
    locale: "tr_TR",
  },
};

export default function SignupPage() {
  return (
    <div className="hero-wash min-h-screen">
      <PublicHeader />
      <main className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-8 lg:grid-cols-2">
        <AuthAside
          kicker="YENİ SALON"
          title="Link bu akşam hazır olsun."
          text="Hizmeti, süreyi ve berberi yazın. Müşteri kalan saati kendisi seçsin. Deneme bitince karttan çekim olmaz."
        />
        <SignupForm />
      </main>
    </div>
  );
}
