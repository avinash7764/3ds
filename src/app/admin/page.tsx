import Link from "next/link";
import { adminStats, weeklyEnrollments } from "@/server/queries";
import { get } from "@/server/db";
import { Badge, Icon, LinkButton, ProgressBar, Stat } from "@/components/ui";
import { minutesToHuman, formatDate } from "@/lib/constants";
import { priceFmt } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const { totals, byCourse, byCategory, activity } = adminStats();
  const trend = weeklyEnrollments(8);
  const drafts =
    get<{ count: number; lessons: number }>(
      `SELECT (SELECT COUNT(*) FROM courses WHERE published = 0) AS count,
              (SELECT COUNT(*) FROM lessons l JOIN modules m ON m.id = l.module_id JOIN courses c ON c.id = m.course_id WHERE c.published = 0) AS lessons`,
    ) ?? { count: 0, lessons: 0 };

  const maxWeek = Math.max(1, ...trend.map((t) => t.total));

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Overview</h1>
          <p className="mt-1.5 text-[14px] text-slate-600">
            Everything below is live from the SQLite database — publish a draft, add a lesson link, watch the numbers move.
          </p>
        </div>
        <div className="flex gap-2">
          <LinkButton href="/admin/courses/new" size="md">
            <Icon name="plus" className="h-4 w-4" /> New course
          </LinkButton>
          <LinkButton href="/admin/courses" size="md" variant="outline">
            Manage catalogue
          </LinkButton>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Students", value: totals.students, foot: `+${totals.newThisWeek} this week`, icon: "users" },
          { label: "Published courses", value: `${totals.published}`, foot: `${totals.drafts} draft${totals.drafts === 1 ? "" : "s"}`, icon: "book" },
          { label: "Lessons / videos", value: `${totals.lessons}`, foot: `${totals.videos} with a playable link`, icon: "video" },
          { label: "Enrolments", value: totals.enrollments, foot: `${totals.completions} completed`, icon: "award" },
        ].map((c) => (
          <div key={c.label} className="card p-5">
            <div className="flex items-start justify-between">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-ink-50 text-ink-500">
                <Icon name={c.icon} className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-400">{c.label}</p>
            <p className="mt-1 text-3xl font-extrabold tracking-tight text-ink-900">{c.value}</p>
            <p className="mt-1 text-[12px] font-semibold text-slate-500">{c.foot}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[15px] font-bold">Enrolments per week</h2>
            <Badge tone="volt">{totals.enrollments} total</Badge>
          </div>
          <div className="mt-6 flex h-40 items-end gap-2">
            {trend.length ? (
              trend.map((t) => (
                <div key={t.week} className="group flex flex-1 flex-col items-center gap-2">
                  <div className="relative flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-volt-600 to-volt-400 transition-all group-hover:from-volt-700"
                      style={{ height: `${Math.max(6, (t.total / maxWeek) * 100)}%` }}
                    />
                    <span className="absolute inset-x-0 -top-6 text-center text-[11px] font-bold text-ink-700 opacity-0 transition-opacity group-hover:opacity-100">
                      {t.total}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400">wk{t.week.split("-")[1]}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No enrolments yet.</p>
            )}
          </div>
          <div className="mt-4 grid gap-3 border-t border-ink-100 pt-4 sm:grid-cols-4">
            {[
              ["Content library", `${minutesToHuman(totals.minutes)} across ${totals.modules} modules`],
              ["Catalogue value", priceFmt(totals.revenue)],
              ["Avg completion", `${totals.avgProgress}%`],
              ["Attachments", `${totals.resources} links`],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">{k}</p>
                <p className="mt-1 text-[13.5px] font-bold text-ink-900">{v}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-[15px] font-bold">Drafts & quick actions</h2>
          <p className="mt-1.5 text-[12.5px] leading-6 text-slate-500">
            {drafts.count
              ? `${drafts.count} unpublished course${drafts.count === 1 ? "" : "s"} with ${drafts.lessons} lesson${drafts.lessons === 1 ? "" : "s"} waiting.`
              : "Nothing sitting unpublished — the catalogue is fully live."}
          </p>
          <Link
            href="/admin/courses"
            className="mt-4 flex items-center justify-between rounded-xl border border-ink-100 bg-ink-50/70 px-3.5 py-3 text-[13px] font-bold text-ink-800 hover:border-volt-400"
          >
            Review the catalogue <Icon name="chevronRight" className="h-4 w-4" />
          </Link>
          <Link
            href="/admin/courses/new"
            className="mt-2 flex items-center justify-between rounded-xl border border-ink-100 bg-ink-50/70 px-3.5 py-3 text-[13px] font-bold text-ink-800 hover:border-volt-400"
          >
            Upload a new course <Icon name="chevronRight" className="h-4 w-4" />
          </Link>
          <Link
            href="/admin/users"
            className="mt-2 flex items-center justify-between rounded-xl border border-ink-100 bg-ink-50/70 px-3.5 py-3 text-[13px] font-bold text-ink-800 hover:border-volt-400"
          >
            Manage {totals.students} students & {totals.instructors} faculty <Icon name="chevronRight" className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="card overflow-hidden">
          <header className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
            <h2 className="text-[15px] font-bold">Top courses</h2>
            <Link href="/admin/courses" className="text-[12.5px] font-bold text-volt-700 hover:underline">
              All {totals.courses}
            </Link>
          </header>
          <table className="w-full text-left text-[13px]">
            <thead className="bg-ink-50/70 text-[11px] uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-5 py-2.5 font-bold">Course</th>
                <th className="px-3 py-2.5 font-bold">Learners</th>
                <th className="px-3 py-2.5 font-bold">Lessons</th>
                <th className="hidden px-3 py-2.5 font-bold sm:table-cell">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {byCourse.map((c) => (
                <tr key={c.id} className="hover:bg-ink-50/50">
                  <td className="max-w-[22rem] px-5 py-3">
                    <Link href={`/admin/courses/${c.id}`} className="block truncate font-bold text-ink-900 hover:text-volt-700">
                      {c.title}
                    </Link>
                    <span className="text-[11.5px] text-slate-500">
                      {c.category} · {c.level} · {priceFmt(c.price)}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-bold tabular-nums text-ink-900">{c.studentCount}</td>
                  <td className="px-3 py-3 tabular-nums">{c.lessonCount}</td>
                  <td className="hidden px-3 py-3 sm:table-cell">
                    {c.published ? <Badge tone="green">Live</Badge> : <Badge tone="amber">Draft</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-5">
          <div className="card p-5">
            <h2 className="text-[15px] font-bold">Catalogue mix</h2>
            <ul className="mt-4 space-y-3">
              {byCategory.map((row) => (
                <li key={row.category}>
                  <div className="flex items-center justify-between text-[12.5px] font-bold text-ink-800">
                    <span>{row.category}</span>
                    <span className="text-slate-500">
                      {row.total} · {minutesToHuman(row.minutes)}
                    </span>
                  </div>
                  <ProgressBar value={(row.total / Math.max(1, totals.published)) * 100} className="mt-1.5" />
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-5">
            <h2 className="text-[15px] font-bold">Recent activity</h2>
            <ol className="mt-4 space-y-3.5">
              {activity.slice(0, 8).map((a) => (
                <li key={a.id} className="flex gap-3">
                  <span className="mt-1 h-2 w-2 flex-none rounded-full bg-volt-400" />
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold leading-5 text-ink-800">{a.message}</p>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                      {a.type} · {a.userName ?? "system"} · {formatDate(a.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </div>
  );
}
