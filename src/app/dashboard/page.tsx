import Link from "next/link";
import { CourseCardItem } from "@/components/course-card";
import { Badge, EmptyState, Icon, LinkButton, ProgressBar, Stat } from "@/components/ui";
import { minutesToHuman, formatDate } from "@/lib/constants";
import { learningStats, recommendedFor, enrollmentCards, recentCompletions, findFlatLesson } from "@/server/queries";
import { currentUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function DashboardOverview() {
  const user = (await currentUser())!;
  const enrolments = enrollmentCards(user.id);
  const stats = learningStats(user.id);
  const recommended = recommendedFor(user.id, 3);
  const recent = recentCompletions(user.id, 6);
  const inProgress = enrolments.filter((e) => e.status !== "COMPLETED");
  const nextUp = inProgress[0] ?? enrolments[0] ?? null;
  const nextLesson = nextUp?.nextLessonId ? findFlatLesson(nextUp.nextLessonId) : null;

  return (
    <div className="space-y-8">
      <section className="panel-dark overflow-hidden rounded-3xl">
        <div className="grid-overlay absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.4fr_.6fr] lg:items-center">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-volt-300">Welcome back</p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              {greeting()}, {user.name?.split(" ")[0] ?? "engineer"} 👋
            </h1>
            {nextUp && nextLesson ? (
              <p className="mt-3 max-w-xl text-[14px] leading-7 text-ink-200">
                You're <strong className="text-white">{Math.round(nextUp.progressPct)}%</strong> through{" "}
                <strong className="text-white">{nextUp.course.title}</strong>. Next up:{" "}
                <span className="text-volt-200">{nextLesson.title}</span> ({nextLesson.durationMins} min, {nextLesson.moduleTitle}).
              </p>
            ) : (
              <p className="mt-3 max-w-xl text-[14px] leading-7 text-ink-200">
                You're not enrolled in a track yet. Pick one below — the free platform foundation course takes about two hours.
              </p>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              {nextUp && nextLesson ? (
                <LinkButton href={`/learn/${nextUp.course.slug}/${nextLesson.id}`} variant="volt" size="lg">
                  Continue learning <Icon name="arrowRight" className="h-4 w-4" />
                </LinkButton>
              ) : (
                <LinkButton href="/courses" variant="volt" size="lg">
                  Browse courses <Icon name="arrowRight" className="h-4 w-4" />
                </LinkButton>
              )}
              <LinkButton href="/courses" variant="subtle" size="lg">
                Add another course
              </LinkButton>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-3">
            {[
              { value: stats.courses, label: "Courses", icon: "book" },
              { value: stats.completed, label: "Completed", icon: "check" },
              { value: stats.lessons, label: "Lessons done", icon: "video" },
              { value: minutesToHuman(stats.minutes), label: "Curriculum time", icon: "clock" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
                <Icon name={s.icon} className="h-4 w-4 text-volt-300" />
                <div className="mt-2 text-2xl font-extrabold text-white">{s.value}</div>
                <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-300">{s.label}</div>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {enrolments.length ? (
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-tight">Your courses</h2>
              <Link href="/dashboard/courses" className="text-[13px] font-bold text-volt-700 hover:underline">
                See all {enrolments.length}
              </Link>
            </div>
            {enrolments.slice(0, 3).map((e) => (
              <article key={e.id} className="card flex flex-col gap-4 p-4 sm:flex-row">
                <div className="relative h-32 w-full flex-none overflow-hidden rounded-xl bg-ink-950 sm:w-52">
                  {e.course.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.course.thumbnail} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-volt-300">
                      <Icon name="cube" className="h-8 w-8" />
                    </span>
                  )}
                  <Link href={`/learn/${e.course.slug}${e.next ? `/${e.next.id}` : ""}`} className="absolute inset-0 flex items-center justify-center bg-ink-950/40 opacity-0 transition-opacity hover:opacity-100">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-ink-900">
                      <Icon name="play" className="h-5 w-5" />
                    </span>
                  </Link>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={e.status === "COMPLETED" ? "green" : "volt"}>{e.status === "COMPLETED" ? "Completed" : "In progress"}</Badge>
                    <span className="text-[12px] font-semibold text-slate-500">{e.course.category}</span>
                  </div>
                  <h3 className="mt-2 line-clamp-1 text-[15px] font-bold text-ink-900">{e.course.title}</h3>
                  <p className="mt-1 text-[13px] text-slate-500">
                    {e.completedCount}/{e.course.lessonCount} lessons
                    {e.nextLessonTitle ? ` · next: ${e.nextLessonTitle}` : ""}
                  </p>
                  <ProgressBar value={e.progressPct} showLabel className="mt-3" />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {e.next ? (
                      <LinkButton href={`/learn/${e.course.slug}/${e.next.id}`} size="sm" variant="primary">
                        {e.progressPct > 0 ? "Resume" : "Start first lesson"}
                      </LinkButton>
                    ) : null}
                    <LinkButton href={`/courses/${e.course.slug}`} size="sm" variant="outline">
                      Course page
                    </LinkButton>
                    {e.certificate ? (
                      <LinkButton href={`/dashboard/certificates/${(e.certificate as { credentialId: string }).credentialId}`} size="sm" variant="ghost">
                        <Icon name="award" className="h-3.5 w-3.5" /> Certificate
                      </LinkButton>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold tracking-tight">Recent activity</h2>
            <ol className="card divide-y divide-ink-100">
              {recent.length ? (
                recent.map((r) => (
                  <li key={r.lessonId + r.completedAt} className="flex gap-3 p-4">
                    <span className="mt-0.5 inline-flex h-7 w-7 flex-none items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      <Icon name="check" className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13.5px] font-bold text-ink-900">{r.lessonTitle}</p>
                      <Link href={`/courses/${r.courseSlug}`} className="truncate text-[12px] text-slate-500 hover:text-volt-700">
                        {r.courseTitle}
                      </Link>
                      <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-300">{formatDate(r.completedAt)}</p>
                    </div>
                  </li>
                ))
              ) : (
                <li className="p-5 text-[13px] leading-6 text-slate-500">
                  Nothing yet — finish a lesson and it shows up here, and your progress starts counting toward the certificate.
                </li>
              )}
            </ol>

            {stats.avgProgress > 0 ? (
              <div className="card p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-400">Average completion</p>
                <p className="mt-2 text-3xl font-extrabold text-ink-900">{stats.avgProgress}%</p>
                <ProgressBar value={stats.avgProgress} className="mt-3" />
                <p className="mt-3 text-[12.5px] leading-6 text-slate-500">
                  {stats.avgProgress >= 80
                    ? "Almost there — a couple more lessons and you're certified."
                    : "Aim for one lesson a day. Most students finish a track in 3 weeks."}
                </p>
              </div>
            ) : null}
          </div>
        </section>
      ) : (
        <EmptyState
          title="No enrolments yet"
          lead="Start with the free 3DEXPERIENCE Platform Foundation course, then add a CATIA or SIMULIA track once you're comfortable with 3DSpace."
          action={
            <LinkButton href="/courses" size="lg">
              Explore courses <Icon name="arrowRight" className="h-4 w-4" />
            </LinkButton>
          }
        />
      )}

      {recommended.length ? (
        <section>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold tracking-tight">Recommended next</h2>
              <p className="mt-1 text-[13px] text-slate-500">Based on what your batch is finishing right now.</p>
            </div>
            <Link href="/courses" className="text-[13px] font-bold text-volt-700 hover:underline">
              All courses
            </Link>
          </div>
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((c) => (
              <CourseCardItem key={c.id} course={c} compact />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}
