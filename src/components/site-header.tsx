"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Avatar, Badge, Icon, LinkButton } from "@/components/ui";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import type { PublicUser } from "@/lib/session";

const NAV = [
  { href: "/courses", label: "Courses" },
  { href: "/#tracks", label: "Tracks" },
  { href: "/#paths", label: "Learning paths" },
  { href: "/#certificates", label: "Certificates" },
  { href: "/pricing", label: "Pricing" },
];

export function SiteHeader({ user }: { user: PublicUser | null }) {
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all",
        scrolled ? "border-b border-ink-100 bg-white/90 backdrop-blur-md" : "border-b border-transparent bg-white",
      )}
    >
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href.split("#")[0]) && !item.href.includes("#"));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                  active ? "bg-ink-50 text-ink-900" : "text-slate-600 hover:bg-ink-50 hover:text-ink-900",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenu((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-ink-100 bg-white py-1 pl-1 pr-3 text-sm font-semibold text-ink-800 transition-colors hover:border-ink-300"
                aria-haspopup="menu"
                aria-expanded={menu}
              >
                <Avatar name={user.name ?? user.email} image={user.image} size={30} />
                <span className="hidden max-w-[9rem] truncate sm:inline">{user.name ?? user.email.split("@")[0]}</span>
                <Icon name="chevronDown" className="h-4 w-4 text-ink-400" />
              </button>
              {menu ? (
                <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-ink-100 bg-white p-1.5 shadow-card" role="menu">
                  <div className="px-3 py-2">
                    <p className="truncate text-sm font-semibold text-ink-900">{user.name ?? "Student"}</p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                    <Badge tone={user.role === "ADMIN" ? "dark" : "volt"} className="mt-2">
                      {user.role.toLowerCase()}
                    </Badge>
                  </div>
                  <div className="my-1 h-px bg-ink-100" />
                  <MenuLink href="/dashboard" icon="grid" label="Student dashboard" onClick={() => setMenu(false)} />
                  <MenuLink href="/dashboard/certificates" icon="award" label="My certificates" onClick={() => setMenu(false)} />
                  {user.role === "ADMIN" ? (
                    <MenuLink href="/admin" icon="settings" label="Admin panel" onClick={() => setMenu(false)} />
                  ) : null}
                  <div className="my-1 h-px bg-ink-100" />
                  <button
                    onClick={signOut}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    <Icon name="logout" className="h-4 w-4" /> Sign out
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <LinkButton href="/login" variant="ghost" size="sm">
                Sign in
              </LinkButton>
              <LinkButton href="/login?next=/dashboard" variant="primary" size="sm">
                Start learning free
              </LinkButton>
            </div>
          )}

          <button
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-ink-100 text-ink-800 lg:hidden"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-ink-100 bg-white lg:hidden">
          <div className="container-x flex flex-col py-3">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-lg px-2 py-2.5 text-sm font-semibold text-slate-700 hover:bg-ink-50">
                {item.label}
              </Link>
            ))}
            {user ? null : (
              <LinkButton href="/login" size="md" className="mt-2">
                Sign in with Google
              </LinkButton>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}

function MenuLink({ href, label, icon, onClick }: { href: string; label: string; icon: string; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-ink-800 hover:bg-ink-50"
    >
      <Icon name={icon} className="h-4 w-4 text-ink-400" />
      {label}
    </Link>
  );
}
