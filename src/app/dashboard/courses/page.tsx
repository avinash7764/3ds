import { CourseCardItem } from "@/components/course-card";
import { EmptyState, Icon, LinkButton, ProgressBar, Stat } from "@/components/ui";
import { minutesToHuman } from "@/lib/constants";
import { enrollmentCards, learningStats, listCourses } from "@/server/queries";
import { currentUser } from "@/server/auth";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MyCourses() {
  const user = (await currentUser())!;
  const enrolments = enrollmentCards(user.id);
  const stats = learningStats(user.id);
  const catalogue = listCourses({});
  const extra = catalogue.filter((c) => !enrolments.some((e) => e.courseId === c.id)).slice(0, 3);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">My courses</h1>
          <p className="mt-1.5 text-[14px] text-slate-600">
            Progress is stored per lesson on the server, so any device signed in to this Google account resumes in the same place.
          </p>
        </div>
        <LinkButton href="/courses" size="md">
          <Icon name="plus" className="h-4 w-4" /> Enrol in another course
        </LinkButton>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Enrolled", value: stats.courses },
          { label: "Completed", value: stats.completed },
          { label: "Lessons ticked", value: stats.lessons },
          { label: "Total hours owned", value: minutesToHuman(stats.minutes) },
        ].map((s) => (
          <div key={s.label} className="card p-5">
            <Stat value={s.value} label={s.label} />
          </div>
        ))}
      </div>

      {enrolments.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {enrolments.map((e) => (
            <div key={e.id} className="relative">
              <CourseCardItem
                course={e.course}
                progress={e.progressPct}
                nextHref={e.next ? `/learn/${e.course.slug}/${e.next.id}` : null}
              />
              {e.status === "COMPLETED" ? (
                <Link
                  href={`/dashboard/certificates/${(e.certificate as { credentialId?: string })?.credentialId ?? ""}`}
                  className="absolute right-3 top-3 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white"
                >
                  Certified
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nothing enrolled yet"
          lead="Pick a track from the catalogue below — the platform foundation course is free and takes about two hours."
          action={
            <LinkButton href="/courses" size="lg">
              Open the catalogue <Icon name="arrowRight" className="h-4 w-4" />
            </LinkButton>
          }
        />
      )}

      {extra.length ? (
        <section>
          <h2 className="text-lg font-bold tracking-tight">Popular with other students</h2>
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {extra.map((c) => (
              <CourseCardItem key={c.id} course={c} compact />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
