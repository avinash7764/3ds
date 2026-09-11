import Link from "next/link";
import { redirect } from "next/navigation";
import { VerifyForm } from "@/components/verify-form";
import { Icon } from "@/components/ui";
import { certificateView } from "@/server/queries";

export const dynamic = "force-dynamic";

export default async function VerifyLanding({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q?.trim();
  if (q && certificateView(q)) redirect(`/verify/${encodeURIComponent(q)}`);

  return (
    <div className="container-x py-16">
      <div className="mx-auto max-w-2xl text-center">
        <span className="eyebrow">
          <Icon name="shield" className="h-3.5 w-3.5" /> Credential verification
        </span>
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">Check a 3DS Academy certificate</h1>
        <p className="mt-4 text-[15px] leading-7 text-slate-600">
          Every certificate carries a credential ID like <code className="rounded bg-ink-50 px-1.5 py-0.5 font-mono text-[13px]">3DSA-17EE40-O0ND</code>.
          Paste it below to see the learner, the course, the hours and the issue date — straight from the platform database, no login needed.
        </p>

        <div className="card mt-8 p-6 text-left">
          <VerifyForm />
        </div>

        <div className="mt-10 grid gap-4 text-left sm:grid-cols-3">
          {[
            { icon: "award", title: "Issued automatically", copy: "The moment a learner ticks the last lesson, the platform mints the credential." },
            { icon: "video", title: "Backed by activity", copy: "Progress comes from real lesson events, not an uploaded PDF." },
            { icon: "settings", title: "Admin can revoke", copy: "Removing an enrolment from the course panel invalidates its certificate." },
          ].map((f) => (
            <div key={f.title} className="card p-4">
              <Icon name={f.icon} className="h-5 w-5 text-volt-600" />
              <p className="mt-2.5 text-[13.5px] font-bold text-ink-900">{f.title}</p>
              <p className="mt-1 text-[12.5px] leading-6 text-slate-600">{f.copy}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-[13px] text-slate-500">
          Want one for yourself?{" "}
          <Link href="/courses" className="font-bold text-volt-700 hover:underline">
            Start a course
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
