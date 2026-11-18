import { AuthAside } from "@/components/auth-aside";
import { ResetForm } from "@/components/auth-forms";
import { PublicHeader } from "@/components/public-header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Şifre sıfırlama",
  description: "Berberimrandevu salon paneli şifrenizi e-posta bağlantısıyla yenileyin.",
  openGraph: {
    title: "Şifre sıfırlama · Berberimrandevu",
    description: "Kayıtlı e-postanıza sıfırlama bağlantısı gönderin.",
    locale: "tr_TR",
  },
};

export default function ResetPage() {
  return (
    <div className="hero-wash min-h-screen">
      <PublicHeader />
      <main className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-8 lg:grid-cols-2">
        <AuthAside
          kicker="HESAP"
          title="Şifre salonun kapısıdır."
          text="Bağlantı yalnızca kayıtlı e-postaya gider. Gelen kutusu boşsa gereksiz klasörüne bakın."
        />
        <ResetForm />
      </main>
    </div>
  );
}
