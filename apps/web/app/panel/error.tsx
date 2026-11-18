"use client";

export default function PanelError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="space-y-3">
      <h1 className="font-serif text-3xl">Sayfa açılamadı.</h1>
      <button type="button" className="rounded-full bg-clay px-4 py-2 text-sm font-semibold text-card" onClick={reset}>
        Tekrar dene
      </button>
    </div>
  );
}
