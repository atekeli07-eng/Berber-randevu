import type { ButtonHTMLAttributes, ReactNode } from "react";

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger" | "quiet";
}) {
  const styles = {
    primary: "bg-clay text-card hover:bg-clay-dark",
    ghost: "border border-line bg-card text-ink hover:border-ink",
    danger: "bg-bad text-card hover:opacity-90",
    quiet: "text-muted hover:text-ink",
  }[variant];
  return (
    <button
      className={cx(
        "inline-flex h-11 items-center justify-center rounded-full px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        styles,
        className,
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  "h-12 w-full rounded-2xl border border-line bg-card px-3 text-base outline-none transition placeholder:text-muted/70 focus:border-clay";

export function Notice({
  tone = "bad",
  children,
}: {
  tone?: "bad" | "good" | "warn";
  children: ReactNode;
}) {
  const styles = {
    bad: "bg-bad-soft text-bad",
    good: "bg-good-soft text-good",
    warn: "bg-warn-soft text-gold",
  }[tone];
  return <p className={cx("rounded-2xl px-3 py-2 text-sm", styles)}>{children}</p>;
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cx("rounded-3xl border border-line bg-card p-5", className)}>{children}</section>;
}
