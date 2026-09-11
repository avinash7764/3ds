import Link from "next/link";
import { notFound } from "next/navigation";
import { Curriculum } from "@/components/curriculum";
import { EnrollButton } from "@/components/enroll-button";
import { ReviewForm } from "@/components/review-form";
import { VideoPlayer } from "@/components/video-player";
import { Avatar, Badge, Icon, LinkButton } from "@/components/ui";
import { ShareButtons } from "@/components/share";
import { formatDate, minutesToHuman, toLines } from "@/lib/constants";
import { priceFmt } from "@/lib/utils";
import { renderMarkdown } from "@/lib/markdown";
import { completedLessonIds, enrollmentCards, getCourseDetailBySlug } from "@/server/queries";
import { currentUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const course = getCourseDetailBySlug(params.slug);
  return {
    title: course?.title ?? "Course",
    description: course?.subtitle ?? course?.description.slice(0, 160),
  };
}

export default async function CoursePage({ params, searchParams }: { params: { slug: string }; searchParams: { locked?: string } }) {
  const course = getCourseDetailBySlug(params.slug);
  if (!course) notFound();

  const user = await currentUser();
  const mine = user ? enrollmentCards(user.id).find((e) => e.courseId === course.id) : undefined;
  const completed = user ? completedLessonIds(user.id, course.id) : new Set<string>();
  const isDraft = !course.published;
  const learnHref = mine?.next ? `/learn/${course.slug}/${mine.next.id}` : null;
  const bullets = toLines(course.whatYouLearn);
  const requires = toLines(course.requirements);

  return (
    <>
      {/* ------------------------------ header band ------------------------------ */}
      <section className="panel-dark">
        <div className="grid-overlay absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="container-x relative py-10 lg:py-14">
          <nav className="flex flex-wrap items-center gap-2 text-[12px] font-semibold text-ink-300">
            <Link href="/" className="hover:text-white">Home</Link>
            <span className="text-ink-500">/</span>
            <Link href="/courses" className="hover:text-white">Courses</Link>
            <span className="text-ink-500">/</span>
            <Link href={`/courses?category=${encodeURIComponent(course.category)}`} className="hover:text-white">{course.category}</Link>
          </nav>

          {isDraft ? (
            <p className="mt-4 inline-flex items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-400/15 px-3 py-2 text-[13px] font-semibold text-amber-200">
              <Icon name="eye" className="h-4 w-4" /> Draft — visible only to admins until you publish it in the course builder.
            </p>
          ) : null}

          <div className="mt-5 grid gap-10 lg:grid-cols-[1.15fr_.85fr] lg:gap-14">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="volt" className="border-volt-400/40 bg-volt-500/20 text-volt-100">{course.level}</Badge>
                <Badge tone="dark" className="border-white/20 bg-white/10 text-ink-100">{course.category}</Badge>
                <Badge tone="dark" className="border-white/20 bg-white/10 text-ink-100">{course.language}</Badge>
                {course.featured ? <Badge tone="dark" className="border-flame/50 bg-flame/90 text-white">★ Featured</Badge> : null}
              </div>
              <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-[2.6rem] sm:leading-[1.15]">{course.title}</h1>
              {course.subtitle ? <p className="mt-4 max-w-2xl text-[15px] leading-7 text-ink-200">{course.subtitle}</p> : null}

              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px] font-semibold text-ink-200">
                {course.ratingAvg ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="text-amber-300">★★★★★</span>
                    <span className="text-white">{course.ratingAvg.toFixed(1)}</span>
                    <span className="text-ink-400">({course.ratingCount} reviews)</span>
                  </span>
                ) : (
                  <span className="text-ink-400">No reviews yet</span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="users" className="h-4 w-4 text-volt-300" /> {course.studentCount.toLocaleString("en-IN")} learners
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="book" className="h-4 w-4 text-volt-300" /> {course.lessonCount} lessons
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="clock" className="h-4 w-4 text-volt-300" /> {minutesToHuman(course.durationMins)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="sparkle" className="h-4 w-4 text-volt-300" /> Updated {formatDate(course.updatedAt)}
                </span>
              </div>

              {course.instructor ? (
                <div className="mt-7 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                  <Avatar name={course.instructor.name} image={course.instructor.image} size={44} />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-volt-300">Created by</p>
                    <p className="truncate text-[15px] font-bold text-white">{course.instructor.name}</p>
                    <p className="truncate text-[12px] text-ink-300">{course.instructor.headline ?? "3DS Academy mentor"}</p>
                  </div>
                </div>
              ) : null}
            </div>

            {/* price / trailer card */}
            <aside className="lg:pl-4">
              <div className="card overflow-hidden">
                <div className="border-b border-ink-100 bg-ink-950">
                  <p className="px-4 pt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-volt-300">Course trailer</p>
                  <VideoPlayer url={course.heroVideoUrl} title={`${course.title} — trailer`} className="rounded-none" />
                </div>
                <div className="p-5">
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-extrabold tracking-tight text-ink-900">{priceFmt(course.price)}</span>
                    {course.mrpPrice > course.price ? (
                      <span className="pb-1 text-sm font-semibold text-slate-400 line-through">{priceFmt(course.mrpPrice)}</span>
                    ) : null}
                    {course.mrpPrice > course.price ? (
                      <Badge tone="rose" className="mb-1.5 ml-auto">
                        {Math.round(((course.mrpPrice - course.price) / course.mrpPrice) * 100)}% off
                      </Badge>
                    ) : null}
                  </div>

                  <div className="mt-4">
                    <EnrollButton
                      courseSlug={course.slug}
                      price={course.price}
                      enrolled={Boolean(mine)}
                      continueHref={learnHref}
                      signedIn={Boolean(user)}
                      title={course.title}
                    />
                  </div>

                  <ul className="mt-5 space-y-2.5 border-t border-ink-100 pt-4 text-[13px] text-slate-600">
                    {[
                      { icon: "video", label: `${course.lessonCount} on-demand lessons (YouTube / Drive)` },
                      { icon: "clock", label: `${minutesToHuman(course.durationMins)} of guided practice` },
                      { icon: "download", label: `${course.resources.length} downloadable resources` },
                      { icon: "award", label: "Certificate of completion" },
                      { icon: "grid", label: "Mobile, tablet & desktop access" },
                    ].map((row) => (
                      <li key={row.label} className="flex items-start gap-2.5">
                        <Icon name={row.icon} className="mt-0.5 h-4 w-4 flex-none text-volt-500" /> {row.label}
                      </li>
                    ))}
                  </ul>

                  {mine ? (
                    <div className="mt-4 rounded-xl border border-volt-200 bg-volt-50 p-3">
                      <p className="text-[12px] font-bold uppercase tracking-wide text-volt-700">Your progress</p>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                        <div className="h-full rounded-full bg-volt-500" style={{ width: `${mine.progressPct}%` }} />
                      </div>
                      <p className="mt-2 text-[12px] font-semibold text-ink-700">
                        {completed.size} of {course.lessonCount} lessons complete
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* -------------------------------- body -------------------------------- */}
      <div className="container-x grid gap-10 py-14 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-12">
          <section id="learn">
            <h2 className="text-xl font-bold tracking-tight">What you'll learn</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {bullets.map((b) => (
                <li key={b} className="flex gap-2.5 rounded-xl border border-ink-100 bg-white p-3.5 text-[13.5px] leading-6 text-slate-700 shadow-card">
                  <Icon name="check" className="mt-0.5 h-4 w-4 flex-none text-volt-500" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </section>

          <section id="curriculum">
            <h2 className="text-xl font-bold tracking-tight">Course content</h2>
            <p className="mt-1.5 text-sm text-slate-600">
              {mine
                ? "Your position is saved after every lesson — close the tab and pick up here tomorrow."
                : "Preview lessons are free. Enrol to unlock the full track."}
            </p>
            <div className="card mt-5 p-4 sm:p-5">
              <Curriculum modules={course.modules} enrolled={Boolean(mine)} completed={[...completed]} courseSlug={course.slug} showProgress />
            </div>
          </section>

          <section id="about">
            <h2 className="text-xl font-bold tracking-tight">Description</h2>
            <div
              className="prose-course mt-4 max-w-none text-[15px]"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(course.description) }}
            />
          </section>

          {requires.length ? (
            <section id="requirements">
              <h2 className="text-xl font-bold tracking-tight">Requirements</h2>
              <ul className="mt-4 space-y-2 text-[14px] text-slate-600">
                {requires.map((r) => (
                  <li key={r} className="flex gap-2.5">
                    <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-ink-300" /> {r}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {course.resources.length ? (
            <section id="resources">
              <h2 className="text-xl font-bold tracking-tight">Resources & handbooks</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {course.resources.map((r) => (
                  <li key={r.id}>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="card flex items-start gap-3 p-4 transition-colors hover:border-volt-300"
                    >
                      <span className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-ink-900 text-volt-300">
                        <Icon name={r.kind === "DRIVE" ? "layers" : r.kind === "PDF" ? "download" : "external"} className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[14px] font-bold text-ink-900">{r.title}</span>
                        <span className="mt-0.5 block truncate text-[12px] text-slate-500">
                          {r.kind} {r.sizeText ? `· ${r.sizeText}` : ""}
                        </span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section id="reviews">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Student reviews</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {course.ratingAvg ? `${course.ratingAvg.toFixed(1)} average from ${course.ratingCount} reviews` : "Be the first to review this course"}
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {course.reviews.map((r) => (
                <article key={r.id} className="card p-5">
                  <header className="flex items-center gap-3">
                    <Avatar name={r.userName} size={36} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-ink-900">{r.userName ?? "Student"}</p>
                      <p className="text-[12px] text-slate-500">{formatDate(r.createdAt)}</p>
                    </div>
                    <span className="ml-auto text-[13px] font-bold text-amber-500">{"★".repeat(r.rating)}<span className="text-ink-200">{"★".repeat(5 - r.rating)}</span></span>
                  </header>
                  <p className="mt-3 text-[14px] leading-7 text-slate-700">{r.comment}</p>
                </article>
              ))}
              {!course.reviews.length ? (
                <p className="rounded-xl border border-dashed border-ink-200 px-4 py-6 text-center text-sm text-slate-500">
                  No reviews yet. Finish a few lessons and tell everyone what worked.
                </p>
              ) : null}
            </div>

            {mine ? (
              <div className="mt-5">
                <ReviewForm
                  courseSlug={course.slug}
                  initial={course.reviews.find((r) => r.userEmail === user?.email) ? { rating: 5, comment: "" } : undefined}
                />
              </div>
            ) : user ? (
              <p className="mt-5 rounded-xl border border-ink-100 bg-ink-50 px-4 py-3 text-[13px] text-slate-600">
                Only enrolled students can review.{" "}
                <Link href={`/courses/${course.slug}`} className="font-bold text-volt-700 hover:underline">
                  Enrol above
                </Link>{" "}
                to leave one.
              </p>
            ) : null}
          </section>

          {course.faqs.length ? (
            <section id="faq">
              <h2 className="text-xl font-bold tracking-tight">Frequently asked questions</h2>
              <div className="mt-4 divide-y divide-ink-100 overflow-hidden rounded-2xl border border-ink-100 bg-white">
                {course.faqs.map((f) => (
                  <details key={f.id} className="group px-5 py-4 open:bg-ink-50/60">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[14px] font-bold text-ink-900">
                      {f.question}
                      <Icon name="chevronDown" className="h-4 w-4 flex-none text-ink-400 transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="mt-2.5 text-[13.5px] leading-7 text-slate-600">{f.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        {/* ------------------------------- sidebar ------------------------------- */}
        <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          <div className="card p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-400">Tags</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(course.tags ?? "").split(",").filter(Boolean).map((t) => (
                <Badge key={t}>{t.trim()}</Badge>
              ))}
            </div>
            <div className="my-4 h-px bg-ink-100" />
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-400">Share</p>
            <div className="mt-3">
              <ShareButtons slug={course.slug} title={course.title} />
            </div>
          </div>

          {course.instructor?.bio ? (
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <Avatar name={course.instructor.name} image={course.instructor.image} size={40} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink-900">{course.instructor.name}</p>
                  <p className="truncate text-[12px] text-slate-500">{course.instructor.headline}</p>
                </div>
              </div>
              <p className="mt-3 text-[13px] leading-6 text-slate-600">{course.instructor.bio}</p>
            </div>
          ) : null}

          <div className="card border-volt-200 bg-volt-50/70 p-5">
            <p className="inline-flex items-center gap-2 text-[13px] font-bold text-ink-900">
              <Icon name="award" className="h-4 w-4 text-volt-600" /> Certificate included
            </p>
            <p className="mt-2 text-[13px] leading-6 text-slate-600">
              Complete all {course.lessonCount} lessons and {course.certificateOn ?? "this course"} will appear as a verifiable credential in
              your dashboard.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}

