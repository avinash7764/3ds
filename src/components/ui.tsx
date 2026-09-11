import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ---------------------------------- Button --------------------------------- */

type Variant = "primary" | "volt" | "outline" | "ghost" | "danger" | "subtle";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-ink-900 text-white hover:bg-ink-800 border border-transparent shadow-sm",
  volt: "bg-volt-500 text-white hover:bg-volt-600 border border-transparent shadow-sm",
  outline: "border border-ink-200 bg-white text-ink-800 hover:border-ink-400 hover:bg-ink-50",
  ghost: "border border-transparent text-ink-700 hover:bg-ink-100",
  danger: "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
  subtle: "border border-white/20 bg-white/10 text-white hover:bg-white/20 backdrop-blur",
};
const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-[15px] gap-2.5",
};

const buttonClass = (variant: Variant = "primary", size: Size = "md", className?: string) =>
  cn(
    "inline-flex select-none items-center justify-center rounded-xl font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function LinkButton({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

/* ---------------------------------- Badge ---------------------------------- */

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "volt" | "green" | "amber" | "rose" | "violet" | "dark";
  className?: string;
}) {
  const tones = {
    neutral: "bg-ink-50 text-ink-700 border-ink-100",
    volt: "bg-volt-50 text-volt-700 border-volt-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
    dark: "bg-ink-900 text-white border-ink-900",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------- Section head ------------------------------ */

export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "center",
  dark = false,
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: "center" | "left";
  dark?: boolean;
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      {eyebrow ? <span className={cn("eyebrow", dark && "border-white/20 bg-white/10 text-volt-200")}>{eyebrow}</span> : null}
      <h2 className={cn("mt-4 text-3xl font-bold tracking-tight sm:text-4xl", dark && "text-white")}>{title}</h2>
      {lead ? <p className={cn("mt-4 text-[15px] leading-7", dark ? "text-ink-200" : "text-slate-600")}>{lead}</p> : null}
    </div>
  );
}

/* -------------------------------- Progress -------------------------------- */

export function ProgressBar({ value, className, showLabel = false }: { value: number; className?: string; showLabel?: boolean }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100">
        <div
          className={cn("h-full rounded-full transition-[width] duration-500", v >= 100 ? "bg-emerald-500" : "bg-volt-500")}
          style={{ width: `${v}%` }}
        />
      </div>
      {showLabel ? <span className="w-9 text-right text-xs font-bold tabular-nums text-ink-600">{v}%</span> : null}
    </div>
  );
}

/* --------------------------------- Avatar --------------------------------- */

export function Avatar({
  name,
  image,
  size = 36,
  className,
}: {
  name?: string | null;
  image?: string | null;
  size?: number;
  className?: string;
}) {
  const initials = (name ?? "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={image}
        alt={name ?? "avatar"}
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        className={cn("rounded-full object-cover ring-1 ring-ink-100", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className={cn("inline-flex items-center justify-center rounded-full bg-ink-900 font-bold text-white ring-1 ring-ink-100", className)}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden="true"
    >
      {initials || "?"}
    </span>
  );
}

/* ---------------------------------- Misc ---------------------------------- */

export function Stat({ value, label, dark = false }: { value: ReactNode; label: string; dark?: boolean }) {
  return (
    <div>
      <div className={cn("text-3xl font-extrabold tracking-tight sm:text-4xl", dark ? "text-white" : "text-ink-900")}>{value}</div>
      <div className={cn("mt-1 text-xs font-semibold uppercase tracking-[0.15em]", dark ? "text-ink-300" : "text-ink-400")}>{label}</div>
    </div>
  );
}

export function Icon({ name, className }: { name: string; className?: string }) {
  const paths: Record<string, ReactNode> = {
    play: <path d="M8 5v14l11-7z" />,
    check: <path d="M20 6L9 17l-5-5" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />,
    chevronRight: <path d="M9 18l6-6-6-6" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />,
    chevronDown: <path d="M6 9l6 6 6-6" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />,
    arrowRight: <path d="M5 12h14M13 6l6 6-6 6" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" fill="none" strokeWidth="2" stroke="currentColor" />
        <path d="M12 7v5l3 2" fill="none" strokeWidth="2" strokeLinecap="round" stroke="currentColor" />
      </>
    ),
    users: (
      <>
        <path d="M16 20v-1a4 4 0 00-4-4H6a4 4 0 00-4 4v1" fill="none" strokeWidth="2" strokeLinecap="round" stroke="currentColor" />
        <circle cx="9" cy="7" r="3.2" fill="none" strokeWidth="2" stroke="currentColor" />
        <path d="M22 20v-1a4 4 0 00-3-3.87M16 3.13A4 4 0 0119 7" fill="none" strokeWidth="2" strokeLinecap="round" stroke="currentColor" />
      </>
    ),
    book: (
      <>
        <path d="M4 5.5A2.5 2.5 0 016.5 3H20v15H6.5A2.5 2.5 0 004 20.5z" fill="none" strokeWidth="2" strokeLinejoin="round" stroke="currentColor" />
        <path d="M4 5.5V20.5" stroke="currentColor" strokeWidth="2" />
      </>
    ),
    cube: (
      <path
        d="M12 2.6l8 4.2v10.4l-8 4.2-8-4.2V6.8z M12 12l8-4.4M12 12v9.4M12 12L4 7.6"
        fill="none"
        strokeWidth="1.6"
        strokeLinejoin="round"
        stroke="currentColor"
      />
    ),
    sparkle: <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />,
    video: (
      <>
        <rect x="2.5" y="5.5" width="13" height="13" rx="3" fill="none" strokeWidth="2" stroke="currentColor" />
        <path d="M15.5 10.5l6-3.5v10l-6-3.5z" fill="none" strokeWidth="2" strokeLinejoin="round" stroke="currentColor" />
      </>
    ),
    upload: (
      <>
        <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
        <path d="M4 15v3a2 2 0 002 2h12a2 2 0 002-2v-3" fill="none" strokeWidth="2" strokeLinecap="round" stroke="currentColor" />
      </>
    ),
    download: (
      <>
        <path d="M12 4v12m0 0l4.5-4.5M12 16l-4.5-4.5" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
        <path d="M4 18v1a2 2 0 002 2h12a2 2 0 002-2v-1" fill="none" strokeWidth="2" strokeLinecap="round" stroke="currentColor" />
      </>
    ),
    shield: <path d="M12 3l7.5 3v5.5c0 4.4-3 8.2-7.5 9.5-4.5-1.3-7.5-5.1-7.5-9.5V6z" fill="none" strokeWidth="2" strokeLinejoin="round" stroke="currentColor" />,
    award: (
      <>
        <circle cx="12" cy="9" r="5.5" fill="none" strokeWidth="2" stroke="currentColor" />
        <path d="M8.5 14L7 21l5-2.2L17 21l-1.5-7" fill="none" strokeWidth="2" strokeLinejoin="round" stroke="currentColor" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="6.5" fill="none" strokeWidth="2" stroke="currentColor" />
        <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
    gauge: (
      <>
        <path d="M4 18a9 9 0 1116 0" fill="none" strokeWidth="2" strokeLinecap="round" stroke="currentColor" />
        <path d="M12 15l4-4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
    layers: (
      <>
        <path d="M12 3l8.5 4.5L12 12 3.5 7.5z" fill="none" strokeWidth="2" strokeLinejoin="round" stroke="currentColor" />
        <path d="M4 12.5l8 4.3 8-4.3M4 16.8l8 4.2 8-4.2" fill="none" strokeWidth="2" strokeLinejoin="round" stroke="currentColor" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3.2" fill="none" strokeWidth="2" stroke="currentColor" />
        <path
          d="M19.4 15a1.7 1.7 0 00.34 1.87l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.7 1.7 0 00-2.87 1.2V21a2 2 0 11-4 0v-.09A1.7 1.7 0 006 19.4a1.7 1.7 0 00-1.87.34l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.7 1.7 0 003.6 14H3.5a2 2 0 110-4h.09A1.7 1.7 0 004.6 6a1.7 1.7 0 00-.34-1.87l-.06-.06a2 2 0 112.83-2.83l.06.06A1.7 1.7 0 0010 3.6V3.5a2 2 0 114 0v.09A1.7 1.7 0 0018 4.6a1.7 1.7 0 001.87-.34l.06-.06a2 2 0 112.83 2.83l-.06.06A1.7 1.7 0 0020.4 10h.1a2 2 0 110 4h-.09"
          fill="none"
          strokeWidth="1.6"
          stroke="currentColor"
        />
      </>
    ),
    logout: <path d="M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3M10 8l-4 4 4 4M6 12h10" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />,
    grid: (
      <>
        <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" fill="none" strokeWidth="2" stroke="currentColor" />
        <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" fill="none" strokeWidth="2" stroke="currentColor" />
        <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" fill="none" strokeWidth="2" stroke="currentColor" />
        <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" fill="none" strokeWidth="2" stroke="currentColor" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" fill="none" strokeWidth="2.2" strokeLinecap="round" stroke="currentColor" />,
    trash: (
      <path
        d="M4 7h16M9 7V4.5h6V7m-8 0l.8 13a1.5 1.5 0 001.5 1.4h5.4a1.5 1.5 0 001.5-1.4L17 7"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
      />
    ),
    external: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 014 19V8a1.5 1.5 0 011.5-1.5H10" fill="none" strokeWidth="2" strokeLinecap="round" stroke="currentColor" />,
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2.5" fill="none" strokeWidth="2" stroke="currentColor" />
        <path d="M4 7l8 6 8-6" fill="none" strokeWidth="2" strokeLinejoin="round" stroke="currentColor" />
      </>
    ),
    eye: (
      <>
        <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12S18 18.5 12 18.5 2.5 12 2.5 12z" fill="none" strokeWidth="2" stroke="currentColor" />
        <circle cx="12" cy="12" r="3" fill="none" strokeWidth="2" stroke="currentColor" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={cn("h-5 w-5 flex-none", className)} aria-hidden="true">
      {paths[name] ?? paths.cube}
    </svg>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-ink-100", className)} />;
}

export function EmptyState({ title, lead, action }: { title: string; lead?: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-50 text-ink-500">
        <Icon name="cube" />
      </span>
      <h3 className="text-lg font-semibold text-ink-900">{title}</h3>
      {lead ? <p className="max-w-md text-sm text-slate-600">{lead}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
