import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Field({ label, hint, children, className }: { label: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="label">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11.5px] leading-5 text-slate-500">{hint}</span> : null}
    </label>
  );
}

export function TextInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("input", className)} {...props} />;
}

export function TextArea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("input resize-y leading-6", className)} {...props} />;
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn("input", className)} {...props}>
      {children}
    </select>
  );
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-ink-200 bg-white p-3 transition-colors hover:border-volt-400">
      <span className="relative mt-0.5 inline-flex">
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-5 w-9 rounded-full bg-ink-200 transition-colors peer-checked:bg-volt-500" />
        <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-bold text-ink-900">{label}</span>
        {hint ? <span className="mt-0.5 block text-[11.5px] leading-5 text-slate-500">{hint}</span> : null}
      </span>
    </label>
  );
}

export function Panel({ title, lead, actions, children, tone = "default" }: { title: string; lead?: string; actions?: ReactNode; children: ReactNode; tone?: "default" | "dark" }) {
  return (
    <section className={cn("card overflow-hidden", tone === "dark" && "border-ink-800 bg-ink-950")}>
      <header className={cn("flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4", tone === "dark" ? "border-white/10" : "border-ink-100")}>
        <div className="min-w-0">
          <h2 className={cn("text-[15px] font-bold tracking-tight", tone === "dark" && "text-white")}>{title}</h2>
          {lead ? <p className={cn("mt-0.5 text-[12.5px] leading-5", tone === "dark" ? "text-ink-300" : "text-slate-500")}>{lead}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </header>
      <div className={cn("p-5", tone === "dark" && "text-ink-100")}>{children}</div>
    </section>
  );
}

export function ErrorNote({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[12.5px] font-semibold text-rose-700">
      {message}
    </p>
  );
}
