"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui";

export function CopyLink({ path }: { path: string }) {
  const [origin, setOrigin] = useState(process.env.NEXT_PUBLIC_SITE_URL ?? "");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const url = `${origin}${path}`;

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <input readOnly value={url} className="h-12 flex-1 rounded-2xl border border-line bg-paper px-3 text-sm" />
      <Button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        }}
      >
        {copied ? "Kopyalandı" : "Bağlantıyı kopyala"}
      </Button>
    </div>
  );
}
