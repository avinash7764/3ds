"use client";

import { useState } from "react";
import { Icon } from "@/components/ui";

export function ShareButtons({ slug, title }: { slug: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/courses/${slug}` : `/courses/${slug}`;

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          } catch {
            setCopied(false);
          }
        }}
        className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 py-1.5 text-[12px] font-bold text-ink-700 transition-colors hover:border-volt-400"
      >
        <Icon name={copied ? "check" : "external"} className={copied ? "h-3.5 w-3.5 text-emerald-600" : "h-3.5 w-3.5"} />
        {copied ? "Link copied" : "Copy course link"}
      </button>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 py-1.5 text-[12px] font-bold text-ink-700 transition-colors hover:border-volt-400"
      >
        Share on WhatsApp
      </a>
    </div>
  );
}
