"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar, Icon } from "@/components/ui";

export function AdminUserMenu({ user }: { user: { name: string; email: string; image: string | null; role: string } }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-ink-100 bg-white py-1 pl-1 pr-2.5"
        aria-expanded={open}
      >
        <Avatar name={user.name} image={user.image} size={28} />
        <Icon name="chevronDown" className="h-4 w-4 text-ink-400" />
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-60 rounded-2xl border border-ink-100 bg-white p-1.5 shadow-card">
          <div className="px-3 py-2">
            <p className="truncate text-[13px] font-bold text-ink-900">{user.name}</p>
            <p className="truncate text-[11px] text-slate-500">{user.email}</p>
          </div>
          <div className="my-1 h-px bg-ink-100" />
          <Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold text-ink-800 hover:bg-ink-50">
            <Icon name="grid" className="h-4 w-4 text-ink-400" /> Student view
          </Link>
          <Link href="/courses" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold text-ink-800 hover:bg-ink-50">
            <Icon name="book" className="h-4 w-4 text-ink-400" /> Public catalogue
          </Link>
          <button onClick={signOut} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] font-semibold text-rose-600 hover:bg-rose-50">
            <Icon name="logout" className="h-4 w-4" /> Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
