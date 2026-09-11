import Link from "next/link";
import { LogoMark } from "@/components/logo";
import { CATEGORIES } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="panel-dark mt-24">
      <div className="grid-overlay absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="container-x relative py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <LogoMark />
              <span className="text-lg font-extrabold tracking-tight text-white">
                3DS<span className="text-volt-300">Academy</span>
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-6 text-ink-300">
              A full-stack learning platform for the 3DEXPERIENCE® ecosystem — structured CAD/CAE/PLM courses, YouTube & Google Drive
              lessons, progress tracking, certificates, and an admin panel that lets faculty publish in minutes.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-300">
              <span className="rounded-full border border-white/15 px-2.5 py-1">CATIA</span>
              <span className="rounded-full border border-white/15 px-2.5 py-1">SIMULIA</span>
              <span className="rounded-full border border-white/15 px-2.5 py-1">ENOVIA</span>
              <span className="rounded-full border border-white/15 px-2.5 py-1">DELMIA</span>
              <span className="rounded-full border border-white/15 px-2.5 py-1">SOLIDWORKS</span>
            </div>
          </div>

          <FooterCol title="Courses" links={CATEGORIES.slice(0, 5).map((c) => ({ label: c, href: `/courses?category=${encodeURIComponent(c)}` }))} />
          <FooterCol
            title="Platform"
            links={[
              { label: "Student dashboard", href: "/dashboard" },
              { label: "Admin panel", href: "/admin" },
              { label: "Pricing", href: "/pricing" },
              { label: "Verify a certificate", href: "/verify" },
              { label: "Sign in", href: "/login" },
            ]}
          />
          <FooterCol
            title="Support"
            links={[
              { label: "FAQ & help", href: "/courses#faq" },
              { label: "Report a broken video", href: "mailto:support@3dsacademy.dev" },
              { label: "Instructor sign-up", href: "mailto:faculty@3dsacademy.dev" },
              { label: "GitHub repo", href: "https://github.com/avinash7764/3ds" },
            ]}
          />
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-ink-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} 3DS Academy. Built for engineering colleges & training centres.</p>
          <p className="max-w-xl sm:text-right">
            Independent education project. 3DEXPERIENCE, CATIA, SOLIDWORKS, SIMULIA, ENOVIA and DELMIA are trademarks of Dassault
            Systèmes; this site is not affiliated with or endorsed by Dassault Systèmes.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-volt-300">{title}</h4>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link href={l.href} className="text-sm text-ink-200 transition-colors hover:text-white" {...(l.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
