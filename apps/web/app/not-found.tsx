import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg px-5 py-24">
      <p className="text-xs font-semibold tracking-[0.18em] text-gold">404</p>
      <h1 className="mt-2 font-serif text-5xl">Bu sayfa yok.</h1>
      <Link href="/" className="mt-6 inline-block text-sm font-semibold text-clay">
        Ana sayfaya dön
      </Link>
    </main>
  );
}
