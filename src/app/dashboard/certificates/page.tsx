import Link from "next/link";
import { Badge, EmptyState, Icon, LinkButton } from "@/components/ui";
import { formatDate, minutesToHuman } from "@/lib/constants";
import { certificatesForUser } from "@/server/queries";
import { currentUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function CertificatesPage() {
  const user = (await currentUser())!;
  const certs = certificatesForUser(user.id);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight">Certificates</h1>
        <p className="mt-1.5 text-[14px] text-slate-600">
          Issued automatically when every lesson of a course is marked complete. Each one has a public credential ID anyone can verify.
        </p>
      </header>

      {certs.length ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {certs.map((cert) => (
            <article key={cert.id} className="card overflow-hidden">
              <div className="flex items-start gap-4 bg-gradient-to-r from-ink-900 to-ink-800 p-5 text-white">
                <span className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-white/10 text-volt-300">
                  <Icon name="award" className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-volt-300">Certificate of completion</p>
                  <h2 className="mt-1 line-clamp-2 text-[15px] font-bold leading-snug">{cert.courseTitle}</h2>
                  <p className="mt-1 text-[12px] text-ink-300">
                    {cert.level} · {cert.hours} hours · issued {formatDate(cert.issuedAt)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 p-5">
                <div>
                  <Badge tone="green">Verified</Badge>
                  <p className="mt-2 font-mono text-[12px] text-slate-500">{cert.credentialId}</p>
                </div>
                <div className="flex gap-2">
                  <LinkButton href={`/dashboard/certificates/${cert.credentialId}`} size="sm">
                    View & print
                  </LinkButton>
                  <Link
                    href={`/verify/${cert.credentialId}`}
                    className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-ink-200 px-3 text-[13px] font-semibold text-ink-700 hover:border-volt-400"
                  >
                    <Icon name="shield" className="h-3.5 w-3.5" /> Public link
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No certificates yet"
          lead="Finish every lesson in a course and the certificate appears here within a second — no manual request, no waiting."
          action={
            <LinkButton href="/dashboard" size="lg">
              Back to my learning <Icon name="arrowRight" className="h-4 w-4" />
            </LinkButton>
          }
        />
      )}
    </div>
  );
}
