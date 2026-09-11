import Link from "next/link";
import type { Metadata } from "next";
import { Badge, Icon } from "@/components/ui";
import { formatDate } from "@/lib/constants";
import { certificateView } from "@/server/queries";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { credentialId: string } }): Metadata {
  const cert = certificateView(params.credentialId);
  return {
    title: cert ? `Credential ${cert.credentialId} — verified` : "Credential not found",
    description: cert ? `3DS Academy certificate for ${cert.userName ?? cert.userEmail} — ${cert.courseTitle}` : "Unknown credential",
  };
}

export default function VerifyCredentialPage({ params }: { params: { credentialId: string } }) {
  const cert = certificateView(params.credentialId);

  return (
    <div className="container-x flex min-h-[70vh] flex-col justify-center py-16">
      <div className="mx-auto w-full max-w-2xl">
        <Link href="/" className="inline-flex items-center gap-2 text-[13px] font-bold text-volt-700 hover:underline">
          <Icon name="shield" className="h-4 w-4" /> 3DS Academy credential verification
        </Link>

        {cert ? (
          <div className="card mt-6 overflow-hidden">
            <div className="flex items-center gap-3 border-b border-ink-100 bg-emerald-50 px-6 py-4">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white">
                <Icon name="check" className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[15px] font-bold text-emerald-900">This certificate is genuine</p>
                <p className="text-[12px] text-emerald-700">Issued and recorded by 3DS Academy</p>
              </div>
              <Badge tone="green" className="ml-auto">Valid</Badge>
            </div>
            <dl className="divide-y divide-ink-100 px-6">
              {[
                ["Credential ID", cert.credentialId, true],
                ["Learner", cert.userName ?? "—", false],
                ["Email on record", cert.userEmail, false],
                ["Course", cert.courseTitle, false],
                ["Track", `${cert.category} · ${cert.level}`, false],
                ["Learning time", `${cert.hours} hours`, false],
                ["Issued on", formatDate(cert.issuedAt), false],
                ["Mentor", cert.instructorName ?? "3DS Academy", false],
              ].map(([k, v, mono]) => (
                <div key={String(k)} className="flex items-start justify-between gap-6 py-3.5">
                  <dt className="text-[12px] font-bold uppercase tracking-wide text-ink-400">{k}</dt>
                  <dd className={mono ? "font-mono text-[13px] font-bold text-ink-900" : "text-right text-[13.5px] font-semibold text-ink-900"}>{v}</dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap items-center justify-between gap-3 bg-ink-50 px-6 py-4">
              <p className="text-[12px] text-slate-500">
                Records are read straight from the platform database — there is nothing to forge here.
              </p>
              <Link href="/courses" className="text-[12px] font-bold text-volt-700 hover:underline">
                Browse the catalogue →
              </Link>
            </div>
          </div>
        ) : (
          <div className="card mt-6 border-rose-200 p-8 text-center">
            <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <Icon name="shield" className="h-5 w-5" />
            </span>
            <h1 className="mt-4 text-xl font-bold text-ink-900">Credential not found</h1>
            <p className="mx-auto mt-2 max-w-md text-[14px] leading-6 text-slate-600">
              <code className="rounded bg-ink-50 px-1.5 py-0.5 font-mono text-[12.5px]">{params.credentialId}</code> doesn't match any issued
              certificate. Check the ID — it looks like <code className="font-mono text-[12.5px]">3DSA-XXXXXX-XXXX</code> — or ask the learner for
              their shareable link.
            </p>
            <form action="/verify" method="get" className="mx-auto mt-6 flex max-w-sm gap-2">
              <input name="q" placeholder="Paste a credential ID" className="input" />
              <button className="rounded-xl bg-ink-900 px-4 text-[13px] font-bold text-white hover:bg-volt-600">Check</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
