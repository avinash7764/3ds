import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar, Badge, Icon, LinkButton } from "@/components/ui";
import { Logo } from "@/components/logo";
import { currentUser } from "@/server/auth";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: "grid" },
  { href: "/dashboard/courses", label: "My courses", icon: "book" },
  { href: "/dashboard/certificates", label: "Certificates", icon: "award" },
  { href: "/dashboard/profile", label: "Profile", icon: "settings" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/login?next=/dashboard");

  return (
    <div className="min-h-screen bg-ink-50/50">
      <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/95 backdrop-blur">
        <div className="container-x flex h-16 items-center justify-between gap-4">
          <Logo href="/dashboard" />
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-bold text-ink-600 transition-colors hover:bg-ink-50 hover:text-ink-900"
              >
                <Icon name={item.icon} className="h-4 w-4 text-ink-400" /> {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {user.role === "ADMIN" ? (
              <LinkButton href="/admin" size="sm" variant="outline">
                <Icon name="settings" className="h-4 w-4" /> Admin panel
              </LinkButton>
            ) : null}
            <LinkButton href="/courses" size="sm" variant="ghost" className="hidden sm:inline-flex">
              Browse courses
            </LinkButton>
            <span className="flex items-center gap-2 rounded-full border border-ink-100 bg-white py-1 pl-1 pr-3">
              <Avatar name={user.name ?? user.email} image={user.image} size={28} />
              <span className="hidden text-[12px] font-bold text-ink-800 sm:inline">{user.name ?? user.email.split("@")[0]}</span>
            </span>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-ink-100 px-4 py-2 md:hidden">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-bold text-ink-600 hover:bg-ink-50">
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="container-x py-8">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Badge tone="volt">Student workspace</Badge>
          <span className="text-[13px] text-slate-500">Signed in as {user.email}</span>
        </div>
        {children}
      </main>
    </div>
  );
}
