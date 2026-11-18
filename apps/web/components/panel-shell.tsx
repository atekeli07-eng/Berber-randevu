"use client";

import { resolveSalonImage, type Salon } from "@berber/shared";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { cx } from "./ui";

const LINKS = [
  { href: "/panel", label: "Bugün" },
  { href: "/panel/randevular", label: "Randevu" },
  { href: "/panel/hizmetler", label: "Hizmet" },
  { href: "/panel/personel", label: "Ekip" },
  { href: "/panel/salon", label: "Salon" },
];

function isActive(href: string, path: string): boolean {
  if (href === "/panel") return path === "/panel";
  return path.startsWith(href);
}

export function PanelShell({
  salon,
  email,
  role = "owner",
  children,
}: {
  salon: Pick<Salon, "name" | "slug" | "logo_path" | "updated_at">;
  email: string;
  role?: "owner" | "staff";
  children: ReactNode;
}) {
  const path = usePathname();
  const router = useRouter();
  const logoUrl = resolveSalonImage(process.env.NEXT_PUBLIC_SUPABASE_URL, salon.logo_path, salon.updated_at);
  const links = role === "owner" ? LINKS : LINKS.filter((link) => link.href === "/panel" || link.href === "/panel/randevular");

  async function signOut() {
    const supabase = createBrowserSupabase();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen md:pl-64">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col bg-bark text-card md:flex">
        <div className="px-6 py-7">
          <p className="text-[11px] tracking-[0.22em] text-card/60">SALON PANELİ</p>
          {logoUrl ? <img src={logoUrl} alt="" className="mt-4 h-14 w-14 rounded-2xl object-cover" /> : null}
          <p className="mt-2 font-serif text-2xl leading-tight">{salon.name}</p>
          <p className="mt-2 truncate text-xs text-card/60">{email}</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cx(
                "rounded-2xl px-4 py-3 text-sm",
                isActive(link.href, path) ? "bg-card text-ink" : "text-card/80 hover:bg-white/5",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <button type="button" onClick={signOut} className="m-3 rounded-2xl px-4 py-3 text-left text-sm text-card/70">
          Çıkış yap
        </button>
      </aside>

      <div className="mx-auto w-full max-w-5xl px-4 py-6 pb-28 md:px-8 md:pb-10">{children}</div>

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-card md:hidden">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cx(
              "px-1 py-3 text-center text-[11px] font-semibold",
              isActive(link.href, path) ? "text-clay" : "text-muted",
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
