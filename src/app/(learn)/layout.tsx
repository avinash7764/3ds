import Link from "next/link";
import { Icon, LinkButton } from "@/components/ui";
import { Logo } from "@/components/logo";
import { currentUser } from "@/server/auth";

/** Distraction-light shell for the learning player. */
export default async function LearnLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  return (
    <div className="flex min-h-screen flex-col bg-ink-50/60">
      <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/95 backdrop-blur">
        <div className="container-x flex h-14 items-center justify-between gap-4">
          <Logo href="/dashboard" />
          <div className="flex items-center gap-2 text-sm">
            <Link href="/dashboard" className="hidden items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold text-ink-700 hover:bg-ink-50 sm:inline-flex">
              <Icon name="grid" className="h-4 w-4" /> Dashboard
            </Link>
            {user?.role === "ADMIN" ? (
              <LinkButton href="/admin" variant="outline" size="sm">
                Admin
              </LinkButton>
            ) : null}
            <LinkButton href="/" variant="ghost" size="sm">
              Exit
            </LinkButton>
          </div>
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
