import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-ink-900 shadow-glow", className)}>
      <svg viewBox="0 0 32 32" className="h-5 w-5" aria-hidden="true">
        <defs>
          <linearGradient id="lg-volt" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6cdbef" />
            <stop offset="100%" stopColor="#2ab9e2" />
          </linearGradient>
        </defs>
        <path d="M16 3l11 6v14l-11 6L5 23V9z" fill="none" stroke="url(#lg-volt)" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M16 16l11-7M16 16v13M16 16L5 9" fill="none" stroke="url(#lg-volt)" strokeWidth="1.4" strokeLinejoin="round" opacity="0.85" />
        <circle cx="16" cy="16" r="1.8" fill="#a9ecf6" />
      </svg>
    </span>
  );
}

export function Logo({ dark = false, href = "/" }: { dark?: boolean; href?: string }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-3">
      <LogoMark />
      <span className="leading-tight">
        <span className={cn("block text-[17px] font-extrabold tracking-tight", dark ? "text-white" : "text-ink-900")}>
          3DS<span className="text-volt-500">Academy</span>
        </span>
        <span className={cn("block text-[10px] font-semibold uppercase tracking-[0.16em]", dark ? "text-ink-300" : "text-ink-400")}>
          3DEXPERIENCE® learning
        </span>
      </span>
    </Link>
  );
}
