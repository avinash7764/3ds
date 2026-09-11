import Link from "next/link";
import { Icon, LinkButton } from "@/components/ui";
import { LogoMark } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50/60 px-4">
      <div className="card w-full max-w-lg p-8 text-center">
        <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-900 text-volt-300">
          <LogoMark className="h-9 w-9 bg-transparent shadow-none" />
        </span>
        <p className="mt-6 font-mono text-[12px] font-bold uppercase tracking-[0.2em] text-volt-600">Error 404</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight">This geometry doesn't exist</h1>
        <p className="mx-auto mt-3 max-w-sm text-[14px] leading-6 text-slate-600">
          The page you asked for was either deleted from the catalogue or you followed a stale link. Everything else is still in place.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <LinkButton href="/courses">
            <Icon name="book" className="h-4 w-4" /> Browse courses
          </LinkButton>
          <LinkButton href="/dashboard" variant="outline">
            My dashboard
          </LinkButton>
          <LinkButton href="/" variant="ghost">
            Home
          </LinkButton>
        </div>
        <p className="mt-6 text-[12px] text-slate-400">
          Faculty? <Link href="/admin/courses" className="font-bold text-volt-700 hover:underline">Open the course builder</Link>
        </p>
      </div>
    </div>
  );
}
