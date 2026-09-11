import Link from "next/link";
import { CourseCardItem } from "@/components/course-card";
import { Badge, Icon, LinkButton, SectionHeading, Stat } from "@/components/ui";
import { get, all } from "@/server/db";
import { listFeaturedCourses } from "@/server/queries";
import { minutesToHuman } from "@/lib/constants";

export const dynamic = "force-dynamic";

const TRACKS = [
  {
    title: "Design — CATIA & xDesign",
    copy: "Sketcher, Part Design, Assembly, Generative Shape Design. Model real components with fully-constrained, change-proof geometry.",
    image: "/media/track-design.jpg",
    href: "/courses?category=Design",
    icon: "cube",
    tags: ["Part Design", "Assembly", "GSD"],
  },
  {
    title: "Simulation — SIMULIA Abaqus",
    copy: "Mesh convergence, contact, nonlinearity and reports you can defend in a design review — not just colourful stress plots.",
    image: "/media/track-simulation.jpg",
    href: "/courses?category=Simulation",
    icon: "gauge",
    tags: ["FEA", "Modal", "Isight"],
  },
  {
    title: "PLM & Manufacturing — ENOVIA / DELMIA",
    copy: "Requirements to release, change actions, revision control, then robot offline programming for the shop floor.",
    image: "/media/track-plm.jpg",
    href: "/courses?category=PLM%20%26%20Collaboration",
    icon: "layers",
    tags: ["3DSpace", "ECO", "Robotics"],
  },
];

const COMPANY_LOGOS = [
  "Tata Motors",
  "Mahindra",
  "Airbus",
  "Boeing",
  "Maruti Suzuki",
  "L&T Precision",
  "Bosch",
  "Suzuki R&D",
  "Tata Advanced Systems",
  "Ashok Leyland",
  "Infosys CP4D",
  "Tech Mahindra",
];

const FEATURES = [
  { icon: "book", title: "Beginner-friendly paths", copy: "Every track starts with the platform, the workbench and the mouse — no assumed prior CAD exposure." },
  { icon: "sparkle", title: "Advanced concepts", copy: "Class-A surfacing, mesh convergence, configuration management and robot post-processing for the final years." },
  { icon: "cube", title: "Real-world projects", copy: "Gearbox housing, reciprocating compressor, pressure-vessel nozzle, welding cell — parts you can show in an interview." },
  { icon: "video", title: "YouTube & Drive lessons", copy: "Faculty publish a lesson by pasting a link. Our player embeds YouTube videos, playlists, Drive files and hosted MP4s alike." },
  { icon: "download", title: "Comprehensive resources", copy: "Handbooks, shortcut cards, practice sketches and project input files attached to each course and lesson." },
  { icon: "shield", title: "Industry-aligned roles", copy: "Course outcomes map to Dassault Systèmes role certifications so students know what to attempt next." },
];

const PATH_STEPS = [
  { label: "Ideate", tool: "3DEXPERIENCE · 3DDashboard", copy: "Capture the brief, requirements and the product breakdown." },
  { label: "Design", tool: "CATIA · xDesign · GSD", copy: "Solids, assemblies and Class-A surfaces on one data model." },
  { label: "Simulate", tool: "SIMULIA Abaqus", copy: "Structural, modal and thermal validation with proofs." },
  { label: "Manufacture", tool: "DELMIA · CATIA Machining", copy: "Process plans, robot paths and cycle-time checks." },
  { label: "Manage", tool: "ENOVIA · 3DSpace", copy: "Revisions, change actions and a controlled release." },
];

export default async function HomePage() {
  const featured = listFeaturedCourses(3);
  const stats =
    get<{ courses: number; lessons: number; minutes: number; students: number; certs: number; rating: number | null; reviewers: number }>(
      `SELECT (SELECT COUNT(*) FROM courses WHERE published = 1) AS courses,
              (SELECT COUNT(*) FROM lessons) AS lessons,
              (SELECT COALESCE(SUM(duration_mins), 0) FROM courses WHERE published = 1) AS minutes,
              (SELECT COUNT(DISTINCT user_id) FROM enrollments) AS students,
              (SELECT COUNT(*) FROM certificates) AS certs,
              (SELECT ROUND(AVG(rating), 1) FROM reviews) AS rating,
              (SELECT COUNT(*) FROM reviews) AS reviewers`,
    ) ?? { courses: 0, lessons: 0, minutes: 0, students: 0, certs: 0, rating: null, reviewers: 0 };
  const testimonials = all<{ comment: string; rating: number; name: string | null; course_title: string }>(
    `SELECT r.comment, r.rating, u.name, c.title AS course_title
       FROM reviews r JOIN users u ON u.id = r.user_id JOIN courses c ON c.id = r.course_id
      ORDER BY r.created_at DESC LIMIT 6`,
  );

  return (
    <>
      {/* ------------------------------- HERO ------------------------------- */}
      <section className="panel-dark relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/media/hero.jpg" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-br from-ink-950 via-ink-950/90 to-ink-900/70" />
        <div className="grid-overlay absolute inset-0 opacity-70" aria-hidden="true" />
        <div className="container-x relative grid items-center gap-12 py-20 lg:grid-cols-[1.1fr_.9fr] lg:py-28">
          <div className="animate-fadeUp">
            <span className="eyebrow border-white/20 bg-white/10 text-volt-200">
              <Icon name="cube" className="h-3.5 w-3.5" /> Learn CAD/CAE the right way
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.4rem]">
              Master the <span className="bg-gradient-to-r from-volt-200 to-volt-400 bg-clip-text text-transparent">3DEXPERIENCE®</span>{" "}
              platform, one lesson at a time
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-7 text-ink-200 sm:text-base">
              Confused about which course to take? We've got you covered — structured tracks for CATIA, SIMULIA, ENOVIA and DELMIA, with
              real parts to model, videos from YouTube or Google Drive, and a certificate when you finish. Built for engineering students
              and the faculty who run their labs.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <LinkButton href="/courses" size="lg" variant="volt">
                Explore Courses <Icon name="arrowRight" className="h-4 w-4" />
              </LinkButton>
              <LinkButton href="/pricing" size="lg" variant="subtle">
                See pricing
              </LinkButton>
            </div>

            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-white/10 pt-6">
              <Stat dark value={`${stats.courses}+`} label="Courses" />
              <Stat dark value={`${stats.students.toLocaleString("en-IN")}`} label="Students" />
              <Stat dark value={stats.rating ? String(stats.rating) : "—"} label={`Avg rating${stats.reviewers ? ` (${stats.reviewers})` : ""}`} />
            </dl>
          </div>

          {/* floating product card */}
          <div className="relative animate-fadeUp lg:pl-6">
            <div className="absolute -inset-6 rounded-[2rem] bg-volt-500/20 blur-3xl" aria-hidden="true" />
            <div className="card animate-floaty relative overflow-hidden border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.14em] text-volt-200">
                <span>Live course preview</span>
                <span className="inline-flex items-center gap-1.5 text-ink-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> 3DPlay
                </span>
              </div>
              {featured[0] ? (
                <Link href={`/courses/${featured[0].slug}`} className="mt-4 block overflow-hidden rounded-2xl border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={featured[0].thumbnail ?? "/media/track-design.jpg"} alt={featured[0].title} className="h-44 w-full object-cover" />
                  <div className="bg-ink-950/70 p-4">
                    <p className="line-clamp-1 text-[15px] font-bold text-white">{featured[0].title}</p>
                    <p className="mt-1.5 text-[12px] text-ink-300">
                      {featured[0].lessonCount} lessons · {minutesToHuman(featured[0].durationMins)} · {featured[0].level}
                    </p>
                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                      <div className="h-full w-2/3 rounded-full bg-volt-400" />
                    </div>
                  </div>
                </Link>
              ) : null}
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] font-semibold text-ink-200">
                {[
                  ["Modules", String(featured[0]?.lessonCount ? Math.ceil(featured[0].lessonCount / 4) : 3)],
                  ["Projects", "4"],
                  ["Certificate", "Yes"],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-white/10 bg-white/5 px-2 py-2.5">
                    <div className="text-base font-extrabold text-white">{v}</div>
                    {k}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------- PRACTICE BAND --------------------------- */}
      <section id="tracks" className="container-x py-20">
        <SectionHeading
          eyebrow="Code Smarter → Model Smarter"
          title="Real engineering practice, not button tours"
          lead="On 3DS Academy you don't just watch CAD — you build parts that reflect real shop-floor constraints, submit them, and get feedback. From beginner lessons to advanced surfacing trusted by working engineers."
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {TRACKS.map((t) => (
            <Link key={t.title} href={t.href} className="card group relative flex flex-col overflow-hidden transition-all hover:-translate-y-1 hover:shadow-[0_26px_60px_-28px_rgba(11,18,51,.4)]">
              <div className="relative h-44 overflow-hidden bg-ink-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.image} alt={t.title} className="h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-ink-950/10 to-transparent" />
                <span className="absolute left-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur">
                  <Icon name={t.icon} />
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-[17px] font-bold tracking-tight">{t.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{t.copy}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {t.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-volt-700">
                  Browse the track <Icon name="chevronRight" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ------------------------------ STATS BAND ----------------------------- */}
      <section className="panel-dark">
        <div className="grid-overlay absolute inset-0 opacity-50" aria-hidden="true" />
        <div className="container-x relative grid gap-8 py-14 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-volt-300">Students finish their first portfolio project in</p>
            <p className="mt-2 text-3xl font-extrabold text-white">
              6 <span className="text-lg font-bold text-ink-300">weeks</span>
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-volt-300">Learners enrolled on this instance</p>
            <p className="mt-2 text-3xl font-extrabold text-white">{stats.students.toLocaleString("en-IN")}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-volt-300">Guided lesson minutes</p>
            <p className="mt-2 text-3xl font-extrabold text-white">{Math.round(stats.minutes / 60).toLocaleString("en-IN")} hrs</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-volt-300">Certificates issued</p>
            <p className="mt-2 text-3xl font-extrabold text-white">{stats.certs.toLocaleString("en-IN")}</p>
          </div>
        </div>
      </section>

      {/* ------------------------------- LOGO STRIP ------------------------------ */}
      <section className="border-b border-ink-100 bg-white py-12">
        <div className="container-x">
          <p className="text-center text-sm font-semibold text-slate-500">Our students land roles at</p>
          <div className="relative mt-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
            <div className="flex w-max animate-marquee gap-3">
              {[...COMPANY_LOGOS, ...COMPANY_LOGOS].map((name, i) => (
                <span
                  key={name + i}
                  className="whitespace-nowrap rounded-xl border border-ink-100 bg-ink-50/60 px-4 py-2.5 text-[13px] font-bold tracking-tight text-ink-600"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
          <p className="mt-5 text-center text-xs text-slate-400">+ many more OEMs, Tier-1 suppliers and engineering services firms</p>
        </div>
      </section>

      {/* --------------------------------- COURSES -------------------------------- */}
      <section className="container-x py-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            align="left"
            eyebrow="Courses"
            title="Core offerings for a digital-engineering syllabus"
            lead="Nine published tracks, 100+ lessons, all playable in the browser. Faculty can add more in minutes from the admin panel."
          />
          <LinkButton href="/courses" variant="outline" size="md" className="mb-2">
            All courses <Icon name="arrowRight" className="h-4 w-4" />
          </LinkButton>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.length ? (
            featured.map((course) => <CourseCardItem key={course.id} course={course} />)
          ) : (
            <p className="text-sm text-slate-500">No published courses yet — run <code>npm run db:seed</code>.</p>
          )}
        </div>
      </section>

      {/* -------------------------------- FEATURES -------------------------------- */}
      <section className="border-y border-ink-100 bg-ink-50/50 py-20">
        <div className="container-x">
          <SectionHeading eyebrow="Why students stay" title="Everything a CAD course needs — and nothing it doesn't" />
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="card p-5 transition-colors hover:border-volt-300">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-ink-900 text-volt-300">
                  <Icon name={f.icon} />
                </span>
                <h3 className="mt-4 text-[15px] font-bold">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-600">{f.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------ LEARNING PATH ------------------------------ */}
      <section id="paths" className="container-x py-20">
        <SectionHeading
          eyebrow="Learning path"
          title="One platform, five stages of a virtual twin"
          lead="Follow the same sequence industry teams use. Each stage links to the courses that teach it."
        />
        <ol className="mt-12 grid gap-4 lg:grid-cols-5">
          {PATH_STEPS.map((step, i) => (
            <li key={step.label} className="card relative p-5">
              <span className="absolute right-4 top-4 text-4xl font-black text-ink-100">{i + 1}</span>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-volt-600">{step.tool}</p>
              <h3 className="mt-2 text-lg font-bold tracking-tight">{step.label}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{step.copy}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ------------------------------- TESTIMONIALS ------------------------------ */}
      <section className="border-y border-ink-100 bg-white py-20">
        <div className="container-x">
          <SectionHeading eyebrow="Testimonials" title="What learners say after finishing a track" />
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.slice(0, 6).map((t, i) => (
              <figure key={i} className="card flex h-full flex-col justify-between p-5">
                <blockquote className="text-[15px] leading-7 text-slate-700">“{t.comment}”</blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-ink-100 pt-4">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink-900 text-[12px] font-bold text-white">
                    {(t.name ?? "S").split(" ").map((p) => p[0]).slice(0, 2).join("")}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-ink-900">{t.name ?? "Student"}</span>
                    <span className="block truncate text-[12px] text-slate-500">{t.course_title}</span>
                  </span>
                  <span className="ml-auto text-[12px] font-bold text-amber-500">{"★".repeat(t.rating)}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------- CERTIFICATES ------------------------------ */}
      <section id="certificates" className="container-x py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Certificates"
              title="Finish every lesson, get a verifiable certificate"
              lead="Progress is tracked lesson by lesson. At 100% the platform mints a credential ID that a recruiter or college office can verify on a public page — no PDF editing involved."
            />
            <ul className="mt-6 space-y-3 text-sm text-slate-600">
              {[
                "Automatic issue when the last lesson is marked complete",
                "Public verification URL with learner name + course + hours",
                "Downloadable & printable from the student dashboard",
                "Admin can re-issue or revoke from the course panel",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2.5">
                  <Icon name="check" className="mt-0.5 h-4 w-4 flex-none text-volt-500" /> {line}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-volt-200/50 to-ink-200/40 blur-2xl" aria-hidden="true" />
            <div className="card relative overflow-hidden p-7">
              <div className="flex items-start justify-between gap-4 border-b border-dashed border-ink-200 pb-5">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-volt-600">Certificate of completion</p>
                  <p className="mt-2 text-2xl font-extrabold tracking-tight text-ink-900">Arjun Verma</p>
                  <p className="text-sm text-slate-500">has completed all 12 lessons of</p>
                  <p className="mt-1 text-[15px] font-bold text-ink-900">3DEXPERIENCE Platform Foundation</p>
                </div>
                <LogoBadge />
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 text-center text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                <div className="rounded-xl bg-ink-50 px-2 py-3">
                  <div className="text-base font-extrabold text-ink-900">12h</div>
                  Hours
                </div>
                <div className="rounded-xl bg-ink-50 px-2 py-3">
                  <div className="text-base font-extrabold text-ink-900">2026</div>
                  Issued
                </div>
                <div className="rounded-xl bg-ink-50 px-2 py-3">
                  <div className="text-base font-extrabold text-emerald-600">Valid</div>
                  Status
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between gap-4 border-t border-ink-100 pt-4">
                <p className="font-mono text-[11px] text-slate-500">3DSA-9F2C41-KX04</p>
                <Link href="/verify" className="text-[12px] font-bold text-volt-700 hover:underline">
                  Verify a credential →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------- CTA ----------------------------------- */}
      <section className="panel-dark">
        <div className="absolute inset-0" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/media/journey.jpg" alt="" className="h-full w-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/90 to-ink-900/60" />
        </div>
        <div className="container-x relative flex flex-col items-start gap-6 py-16 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Start your 3DEXPERIENCE journey</h2>
            <p className="mt-3 max-w-xl text-[15px] leading-7 text-ink-200">
              Sign in with your college Gmail, pick a track, and your next lesson is waiting. Faculty can upload a recorded class by
              pasting a YouTube or Drive link — no video re-encoding, no servers to manage.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <LinkButton href="/login" size="lg" variant="volt">
              Sign in & start free
            </LinkButton>
            <LinkButton href="/courses" size="lg" variant="subtle">
              Browse courses
            </LinkButton>
          </div>
        </div>
      </section>
    </>
  );
}

function LogoBadge() {
  return (
    <span className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-ink-900 text-volt-300">
      <svg viewBox="0 0 32 32" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
        <path d="M16 3l11 6v14l-11 6-11-6V9z" />
        <path d="M16 16l11-7M16 16v13M16 16L5 9" />
      </svg>
    </span>
  );
}
