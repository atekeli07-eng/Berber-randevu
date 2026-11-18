import { AuthAside } from "@/components/auth-aside";
import { LoginForm } from "@/components/auth-forms";
import { PublicHeader } from "@/components/public-header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Giriş",
  description: "Berberimrandevu salon paneline girin. Bugünün randevularını, ekibi ve hizmetleri yönetin.",
  openGraph: {
    title: "Giriş · Berberimrandevu",
    description: "Salon panelinize e-posta ve şifre ile girin.",
    locale: "tr_TR",
  },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ yapilandirma?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="hero-wash min-h-screen">
      <PublicHeader />
      <main className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-8 lg:grid-cols-2">
        <AuthAside
          kicker="SALON SAHİBİ"
          title="Günün listesi burada."
          text="Müşteri linkten yazar. Siz randevuyu görür, arar, tamamlar veya iptal edersiniz."
        />
        <LoginForm missingConfig={params.yapilandirma === "1"} />
      </main>
    </div>
  );
}
