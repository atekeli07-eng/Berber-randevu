export function AuthAside({ kicker, title, text }: { kicker: string; title: string; text: string }) {
  return (
    <aside className="hidden lg:block">
      <p className="text-xs font-semibold tracking-[0.18em] text-gold">{kicker}</p>
      <h2 className="mt-3 font-serif text-5xl leading-tight">{title}</h2>
      <p className="mt-4 max-w-md text-base leading-7 text-muted">{text}</p>
    </aside>
  );
}
