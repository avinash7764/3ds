import Link from "next/link";
import { CourseCardItem } from "@/components/course-card";
import { Badge, Icon, LinkButton, SectionHeading } from "@/components/ui";
import { listCourses } from "@/server/queries";
import { priceFmt } from "@/lib/utils";
import { get } from "@/server/db";

export const dynamic = "force-dynamic";

const PLANS = [
  {
    name: "Learner",
    price: "Free",
    tagline: "For one student, self-paced",
    features: ["Platform Foundation course, free forever", "YouTube & Drive lessons", "Lesson-level progress tracking", "Verifiable certificate"],
    limits: "Community support only",
    cta: { label: "Start free", href: "/login" },
    highlight: false,
  },
  {
    name: "Pro track",
    price: "₹1,499 – ₹4,999",
    tagline: "Per course, lifetime access",
    features: [
      "Everything in Learner",
      "Full advanced modules (GSD, DMU, Abaqus, DELMIA)",
      "Handbooks, project files & model reviews",
      "Priority doubt support within 72h",
    ],
    limits: "One Google account, no resale",
    cta: { label: "Browse paid courses", href: "/courses" },
    highlight: true,
  },
  {
    name: "College lab",
    price: "Custom",
    tagline: "For departments & training centres",
    features: [
      "40–200 seats with a faculty admin panel",
      "Upload your own recordings via Drive/YouTube links",
      "Batch progress view per course",
      "Onboarding + branded certificates",
    ],
    limits: "Annual contract, on-prem option",
    cta: { label: "Talk to us", href: "mailto:faculty@3dsacademy.dev" },
    highlight: false,
  },
];

export default function PricingPage() {
  const courses = listCourses({});
  const totals = get<{ free: number; paid: number; min: number; max: number }>(
    `SELECT SUM(CASE WHEN price = 0 THEN 1 ELSE 0 END) AS free,
            SUM(CASE WHEN price > 0 THEN 1 ELSE 0 END) AS paid,
            MIN(CASE WHEN price > 0 THEN price END) AS min,
            MAX(price) AS max
       FROM courses WHERE published = 1`,
  );

  return (
    <>
      <section className="border-b border-ink-100 bg-gradient-to-b from-ink-50 to-white">
        <div className="container-x py-16 text-center">
          <span className="eyebrow">Pricing</span>
          <h1 className="mx-auto mt-5 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl">
            Student-friendly prices, because licences aren't the bottleneck
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-7 text-slate-600">
            {totals?.free ?? 0} free course{totals?.free === 1 ? "" : "s"}, {totals?.paid ?? 0} paid tracks from {priceFmt(totals?.min ?? 0)} to{" "}
            {priceFmt(totals?.max ?? 0)} — one-time, no subscription, and the certificate is always included. Institutions get a separate
            contract with a faculty admin panel.
          </p>

          <div className="mt-12 grid gap-5 text-left lg:grid-cols-3">
            {PLANS.map((plan) => (
              <div key={plan.name} className={`card relative flex flex-col p-6 ${plan.highlight ? "ring-2 ring-volt-400" : ""}`}>
                {plan.highlight ? <Badge tone="dark" className="absolute -top-2.5 left-6 bg-volt-500">Most chosen</Badge> : null}
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-400">{plan.name}</p>
                <p className="mt-3 text-2xl font-extrabold tracking-tight text-ink-900">{plan.price}</p>
                <p className="mt-1 text-[13px] text-slate-500">{plan.tagline}</p>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2.5 text-[13.5px] leading-6 text-slate-700">
                      <Icon name="check" className="mt-0.5 h-4 w-4 flex-none text-volt-500" /> {f}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 rounded-xl bg-ink-50 px-3 py-2 text-[12px] text-slate-500">{plan.limits}</p>
                {plan.cta.href.startsWith("mailto:") ? (
                  <a
                    href={plan.cta.href}
                    className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white text-sm font-bold text-ink-800 hover:border-ink-400"
                  >
                    {plan.cta.label} <Icon name="arrowRight" className="h-4 w-4" />
                  </a>
                ) : (
                  <LinkButton href={plan.cta.href} variant={plan.highlight ? "primary" : "outline"} size="lg" className="mt-5 w-full">
                    {plan.cta.label}
                  </LinkButton>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x py-16">
        <SectionHeading align="left" eyebrow="All courses" title="Pay per track, keep it for life" />
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.slice(0, 6).map((c) => (
            <CourseCardItem key={c.id} course={c} compact />
          ))}
        </div>
        <p className="mt-8 text-[13px] text-slate-500">
          Checkout in this project writes the enrolment directly — plug Razorpay or Stripe into{" "}
          <code className="font-mono text-[12px]">POST /api/enroll</code> for real payments.{" "}
          <Link href="/courses" className="font-bold text-volt-700 hover:underline">
            See the full catalogue →
          </Link>
        </p>
      </section>
    </>
  );
}
