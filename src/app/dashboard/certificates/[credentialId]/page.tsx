import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ui";
import { PrintButton } from "@/components/print-button";
import { formatDate } from "@/lib/constants";
import { certificateView } from "@/server/queries";
import { currentUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function CertificatePage({ params }: { params: { credentialId: string } }) {
  const cert = certificateView(params.credentialId);
  if (!cert) notFound();
  const user = await currentUser();

  return (
    <div className="mx-auto max-w-4xl">
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/dashboard/certificates" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-ink-600 hover:text-volt-700">
          <Icon name="chevronRight" className="h-4 w-4 rotate-180" /> All certificates
        </Link>
        <div className="flex gap-2">
          <PrintButton />
          <Link href={`/verify/${cert.credentialId}`} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-4 text-[13px] font-bold text-ink-700 hover:border-volt-400">
            <Icon name="shield" className="h-4 w-4" /> Verification page
          </Link>
        </div>
      </div>

      <article className="relative overflow-hidden rounded-[2rem] border-[10px] border-ink-900 bg-white p-8 shadow-card sm:p-12">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-50" aria-hidden="true" />
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-volt-100/60 blur-2xl" aria-hidden="true" />

        <div className="relative">
          <header className="flex flex-wrap items-start justify-between gap-6 border-b border-ink-100 pb-6">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-900 text-volt-300">
                <svg viewBox="0 0 32 32" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
                  <path d="M16 3l11 6v14l-11 6-11-6V9z" />
                  <path d="M16 16l11-7M16 16v13M16 16L5 9" />
                </svg>
              </span>
              <div>
                <p className="text-[17px] font-extrabold tracking-tight text-ink-900">
                  3DS<span className="text-volt-500">Academy</span>
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-400">3DEXPERIENCE® learning network</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-400">Credential ID</p>
              <p className="font-mono text-[13px] font-bold text-ink-900">{cert.credentialId}</p>
            </div>
          </header>

          <div className="py-10 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-volt-600">Certificate of completion</p>
            <p className="mt-8 text-[13px] font-semibold uppercase tracking-[0.14em] text-ink-400">This certifies that</p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">{cert.userName ?? cert.userEmail}</h1>
            <p className="mx-auto mt-6 max-w-xl text-[15px] leading-7 text-slate-600">
              has completed every lesson of
              <br />
              <strong className="text-ink-900">{cert.certificateOn ?? cert.courseTitle}</strong>
              <br />a {Math.round(cert.durationMins / 60)}-hour guided track on the 3DEXPERIENCE platform, covering{" "}
              {cert.level.toLowerCase()}-level {cert.category.toLowerCase()} skills.
            </p>
            <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-[12px] font-bold uppercase tracking-wide text-emerald-700">
              <Icon name="check" className="h-3.5 w-3.5" /> Verified · issued {formatDate(cert.issuedAt)}
            </p>
          </div>

          <footer className="grid gap-6 border-t border-ink-100 pt-6 sm:grid-cols-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-400">Learning time</p>
              <p className="mt-1 text-lg font-extrabold text-ink-900">{cert.hours} h</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-400">Level</p>
              <p className="mt-1 text-lg font-extrabold text-ink-900">{cert.level}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-400">Signed</p>
              <p className="mt-1 text-lg italic text-ink-900">{cert.instructorName ?? "3DS Academy"}</p>
              <p className="text-[11px] text-slate-500">Course mentor</p>
            </div>
          </footer>
        </div>
      </article>

      <p className="no-print mt-5 text-center text-[12px] leading-6 text-slate-500">
        {user?.email === cert.userEmail
          ? "Anyone with the credential ID can confirm this on the public verification page — no login required."
          : "This certificate belongs to another account; use the public verification page if you need to share it."}
      </p>
    </div>
  );
}
