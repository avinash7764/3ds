"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAdminAction } from "@/components/admin/api";
import { Avatar, Badge, Button, Icon } from "@/components/ui";
import { formatDate, minutesToHuman } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/session";

type Row = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: Role;
  courseCount: number;
  totalMinutes: number;
  createdAt: string;
  lastLoginAt: string | null;
  headline: string | null;
};

const ROLES: Role[] = ["STUDENT", "INSTRUCTOR", "ADMIN"];

export function UsersTable({ users, me, query }: { users: Row[]; me: { id: string; email: string }; query: string }) {
  const router = useRouter();
  const { run, busy, error } = useAdminAction("/api/admin/users");
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ email: "", name: "", role: "STUDENT" as Role });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-5 py-4">
          <p className="text-[13px] font-bold text-ink-800">
            {users.length} account{users.length === 1 ? "" : "s"}
            {query ? <span className="ml-1.5 font-normal text-slate-500">matching “{query}”</span> : null}
          </p>
          <div className="flex items-center gap-2">
            <form method="get" action="/admin/users" className="flex gap-2">
              <input name="q" defaultValue={query} placeholder="Search name or email" className="input h-9 w-44 text-[13px]" />
              <button className="inline-flex h-9 items-center rounded-lg border border-ink-200 px-3 text-[12.5px] font-bold text-ink-700 hover:border-volt-400">
                <Icon name="search" className="h-3.5 w-3.5" />
              </button>
            </form>
            <Button size="sm" onClick={() => setCreating((v) => !v)}>
              <Icon name="plus" className="h-4 w-4" /> Add account
            </Button>
          </div>
        </header>

        {creating ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const ok = await run({ action: "create", ...draft });
              if (ok) {
                setDraft({ email: "", name: "", role: "STUDENT" });
                setCreating(false);
                router.refresh();
              }
            }}
            className="grid gap-3 border-b border-ink-100 bg-volt-50/50 p-5 sm:grid-cols-[1.2fr_1fr_.8fr_auto]"
          >
            <input required type="email" placeholder="student@gmail.com" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} className="input" />
            <input placeholder="Display name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="input" />
            <select value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value as Role })} className="input">
              {ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            <Button type="submit" size="md" disabled={busy}>
              {busy ? "Creating…" : "Create"}
            </Button>
          </form>
        ) : null}

        {error ? <p className="border-b border-ink-100 bg-rose-50 px-5 py-3 text-[12.5px] font-bold text-rose-700">{error}</p> : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[52rem] text-left text-[13px]">
            <thead className="bg-ink-50/70 text-[11px] uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-5 py-2.5 font-bold">Account</th>
                <th className="px-3 py-2.5 font-bold">Role</th>
                <th className="px-3 py-2.5 font-bold">Courses</th>
                <th className="px-3 py-2.5 font-bold">Last sign-in</th>
                <th className="px-5 py-2.5 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {users.map((u) => (
                <tr key={u.id} className={cn("hover:bg-ink-50/40", u.id === me.id && "bg-volt-50/40")}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name ?? u.email} image={u.image} size={34} />
                      <div className="min-w-0">
                        <p className="truncate font-bold text-ink-900">
                          {u.name ?? "—"} {u.id === me.id ? <span className="text-[11px] font-bold text-volt-600">(you)</span> : null}
                        </p>
                        <p className="truncate text-[11.5px] text-slate-500">{u.email}</p>
                        {u.headline ? <p className="truncate text-[11px] text-ink-400">{u.headline}</p> : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {ROLES.map((r) => (
                        <button
                          key={r}
                          disabled={busy || u.role === r}
                          onClick={() => run({ action: "role", userId: u.id, role: r })}
                          className={cn(
                            "rounded-lg border px-2 py-1 text-[10.5px] font-bold uppercase tracking-wide transition-colors",
                            u.role === r
                              ? r === "ADMIN"
                                ? "border-ink-900 bg-ink-900 text-white"
                                : r === "INSTRUCTOR"
                                  ? "border-violet-300 bg-violet-100 text-violet-700"
                                  : "border-volt-300 bg-volt-100 text-volt-700"
                              : "border-ink-200 text-ink-400 hover:border-volt-400 hover:text-volt-700",
                          )}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-bold tabular-nums text-ink-900">{u.courseCount}</p>
                    <p className="text-[11px] text-slate-500">{minutesToHuman(u.totalMinutes)} of content</p>
                  </td>
                  <td className="px-3 py-3 text-[12px] text-slate-500">
                    {u.lastLoginAt ? formatDate(u.lastLoginAt) : <span className="text-ink-300">never</span>}
                    <p className="text-[11px] text-ink-400">joined {formatDate(u.createdAt)}</p>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link href={`/admin/learners?email=${encodeURIComponent(u.email)}`} className="rounded-lg border border-ink-200 px-2 py-1 text-[11.5px] font-bold text-ink-600 hover:border-volt-400">
                        Progress
                      </Link>
                      {confirmDelete === u.id ? (
                        <>
                          <button
                            disabled={busy}
                            onClick={() => run({ action: "delete", userId: u.id }).then(() => setConfirmDelete(null))}
                            className="rounded-lg bg-rose-600 px-2 py-1 text-[11.5px] font-bold text-white hover:bg-rose-700"
                          >
                            Confirm delete
                          </button>
                          <button onClick={() => setConfirmDelete(null)} className="rounded-lg px-2 py-1 text-[11.5px] font-bold text-ink-500 hover:bg-ink-50">
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          disabled={u.id === me.id}
                          onClick={() => setConfirmDelete(u.id)}
                          className={cn(
                            "inline-flex h-7 w-7 items-center justify-center rounded-lg border transition-colors",
                            u.id === me.id ? "cursor-not-allowed border-ink-100 text-ink-200" : "border-rose-200 text-rose-500 hover:bg-rose-50",
                          )}
                          title={u.id === me.id ? "You cannot delete yourself" : "Delete account"}
                        >
                          <Icon name="trash" className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-[12px] leading-5 text-slate-500">
        Deleting an account removes its enrolments, progress and certificates (SQLite <code className="font-mono">ON DELETE CASCADE</code>).
        Course content itself is never touched.
      </p>
    </div>
  );
}
