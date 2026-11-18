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

export const metadata: Metadata = {
  title: {
    default: "Berberimrandevu",
    template: "%s · Berberimrandevu",
  },
  description: "Berberimrandevu, berber salonları için randevu defteridir. Müşteri hesap açmadan gün ve saat seçer.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className={`${outfit.variable} ${fraunces.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
