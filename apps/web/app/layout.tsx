import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin", "latin-ext"],
  variable: "--font-outfit",
});

const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-fraunces",
});

const description = "Berberimrandevu, berber salonları için randevu defteridir. Müşteri hesap açmadan gün ve saat seçer.";

function siteUrl(): URL | undefined {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!value) return undefined;
  try {
    return new URL(value);
  } catch {
    return undefined;
  }
}

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: {
    default: "Berberimrandevu",
    template: "%s · Berberimrandevu",
  },
  description,
  openGraph: {
    title: "Berberimrandevu",
    description,
    locale: "tr_TR",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className={`${outfit.variable} ${fraunces.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
