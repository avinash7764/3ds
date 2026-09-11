import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminUserMenu } from "@/components/admin/user-menu";
import { Avatar, Badge, Icon, LinkButton } from "@/components/ui";
import { LogoMark } from "@/components/logo";
import { currentUser } from "@/server/auth";
import { countUsers } from "@/server/queries";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "Overview", icon: "grid", exact: true },
  { href: "/admin/courses", label: "Courses & videos", icon: "video" },
  { href: "/admin/learners", label: "Learners", icon: "users" },
  { href: "/admin/users", label: "Accounts & roles", icon: "shield" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "ADMIN")
    return (
      <div className="container-x py-24">
        <div className="card mx-auto max-w-lg p-8 text-center">
          <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <Icon name="shield" className="h-5 w-5" />
          </span>
          <h1 className="mt-4 text-xl font-bold">Admin access only</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            You're signed in as <strong>{user.email}</strong> with the <strong>{user.role}</strong> role. Add that address to{" "}
            <code className="font-mono text-[12px]">ADMIN_EMAILS</code> in <code className="font-mono text-[12px]">.env</code> and sign in again,
            or ask an existing admin to promote you from Accounts &amp; roles.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <LinkButton href="/dashboard">My dashboard</LinkButton>
            <LinkButton href="/courses" variant="outline">Browse courses</LinkButton>
          </div>
        </div>
      </div>
    );

  const admins = countUsers("ADMIN");

  return (
    <div className="min-h-screen bg-ink-50/60 lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="panel-dark hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-r lg:border-white/10">
        <div className="grid-overlay absolute inset-0 opacity-40" aria-hidden="true" />
        <div className="relative flex-1 p-5">
          <Link href="/admin" className="flex items-center gap-3">
            <LogoMark />
            <span>
              <span className="block text-[15px] font-extrabold tracking-tight text-white">3DS Academy</span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-volt-300">Admin console</span>
            </span>
          </Link>

          <nav className="mt-8 space-y-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-bold text-ink-200 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Icon name={item.icon} className="h-4 w-4 text-volt-300/80" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-volt-300">Publishing checklist</p>
            <ul className="mt-2.5 space-y-2 text-[12px] leading-5 text-ink-200">
              {["Course details + thumbnail", "Modules in order", "Every lesson has a YouTube/Drive link", "Set a price (0 = free)", "Flip to Published"].map(
                (line, i) => (
                  <li key={line} className="flex gap-2">
                    <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full border border-volt-400/60 text-[9px] font-bold text-volt-300">
                      {i + 1}
                    </span>
                    {line}
                  </li>
                ),
              )}
            </ul>
          </div>

          <div className="mt-6 space-y-2">
            <LinkButton href="/courses" variant="subtle" size="sm" className="w-full">
              View public site
            </LinkButton>
            <p className="text-center text-[11px] text-ink-400">
              {admins} admin{admins === 1 ? "" : "s"} · SQLite + Next.js
            </p>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 border-b border-ink-100 bg-white/95 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <div className="lg:hidden">
              <LogoMark className="h-8 w-8" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-400">Course & video management</p>
              <p className="truncate text-[15px] font-extrabold tracking-tight text-ink-900">3DS Academy control room</p>
            </div>
            <Badge tone="dark" className="hidden sm:inline-flex">
              <Icon name="check" className="h-3 w-3 text-emerald-300" /> Live data
            </Badge>
            <nav className="flex items-center gap-1 lg:hidden">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className="rounded-lg p-2 text-ink-600 hover:bg-ink-50" aria-label={item.label}>
                  <Icon name={item.icon} className="h-4 w-4" />
                </Link>
              ))}
            </nav>
            <AdminUserMenu
              user={{
                name: user.name ?? user.email,
                email: user.email,
                image: user.image,
                role: user.role,
              }}
            />
          </div>
        </header>
        <main className="min-w-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
