import Link from "next/link";
import { all, get } from "@/server/db";
import { Badge, EmptyState, Icon, LinkButton, ProgressBar } from "@/components/ui";
import { formatDate, minutesToHuman } from "@/lib/constants";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  enrolled: number;
  completed: number;
  avgProgress: number;
  lessonsDone: number;
  minutes: number;
  lastActivity: string | null;
  certificateCount: number;
};

export default function LearnersPage({ searchParams }: { searchParams: { q?: string; email?: string } }) {
  const q = searchParams.q ?? searchParams.email ?? "";
  const like = `%${q.trim()}%`;
  const rows = all<Row>(
    `SELECT u.id, u.name, u.email, u.role,
            (SELECT COUNT(*) FROM enrollments e WHERE e.user_id = u.id) AS enrolled,
            (SELECT COUNT(*) FROM enrollments e WHERE e.user_id = u.id AND e.status = 'COMPLETED') AS completed,
            COALESCE((SELECT AVG(e.progress_pct) FROM enrollments e WHERE e.user_id = u.id), 0) AS avg_progress,
            (SELECT COUNT(*) FROM lesson_progress lp WHERE lp.user_id = u.id AND lp.completed = 1) AS lessons_done,
            COALESCE((SELECT SUM(c.duration_mins) FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.user_id = u.id), 0) AS minutes,
            (SELECT COUNT(*) FROM certificates cert WHERE cert.user_id = u.id) AS certificate_count,
            (SELECT MAX(lp.updated_at) FROM lesson_progress lp WHERE lp.user_id = u.id) AS last_activity
       FROM users u
      WHERE (? = '' OR u.name LIKE ? OR u.email LIKE ?)
      ORDER BY enrolled DESC, u.created_at DESC
      LIMIT 200`,
    [q, like, like],
  );
  const totals = get<{ learners: number; active: number }>(
    `SELECT (SELECT COUNT(*) FROM users) AS learners,
            (SELECT COUNT(DISTINCT user_id) FROM enrollments) AS active`,
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Learners</h1>
          <p className="mt-1.5 text-[14px] text-slate-600">
            {totals?.active ?? 0} of {totals?.learners ?? 0} accounts have started a course. Progress is the average across their enrolments.
          </p>
        </div>
        <form method="get" action="/admin/learners" className="flex gap-2">
          <input name="q" defaultValue={q} placeholder="Filter by name or email" className="input w-56" />
          <button className="inline-flex h-10 items-center gap-2 rounded-xl bg-ink-900 px-4 text-[13px] font-bold text-white hover:bg-volt-600">
            <Icon name="search" className="h-4 w-4" /> Search
          </button>
        </form>
      </header>

      {rows.length ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[54rem] text-left text-[13px]">
              <thead className="bg-ink-50/70 text-[11px] uppercase tracking-wide text-ink-400">
                <tr>
                  <th className="px-5 py-3 font-bold">Learner</th>
                  <th className="px-3 py-3 font-bold">Enrolments</th>
                  <th className="px-3 py-3 font-bold">Average progress</th>
                  <th className="px-3 py-3 font-bold">Lessons</th>
                  <th className="px-3 py-3 font-bold">Last activity</th>
                  <th className="px-5 py-3 text-right font-bold">Certificates</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-ink-50/40">
                    <td className="px-5 py-3">
                      <p className="font-bold text-ink-900">{r.name ?? "—"}</p>
                      <p className="text-[11.5px] text-slate-500">{r.email}</p>
                      {r.role !== "STUDENT" ? <Badge tone="violet" className="mt-1">{r.role}</Badge> : null}
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-bold tabular-nums text-ink-900">{r.enrolled}</p>
                      <p className="text-[11px] text-slate-500">{r.completed} finished</p>
                    </td>
                    <td className="w-44 px-3 py-3">
                      <ProgressBar value={r.avgProgress} showLabel />
                      <p className="mt-1 text-[11px] text-slate-500">{minutesToHuman(r.minutes)} owned</p>
                    </td>
                    <td className="px-3 py-3 font-bold tabular-nums text-ink-900">{r.lessonsDone}</td>
                    <td className="px-3 py-3 text-[12px] text-slate-500">{r.lastActivity ? formatDate(r.lastActivity) : <span className="text-ink-300">not started</span>}</td>
                    <td className="px-5 py-3 text-right">
                      {r.certificateCount ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-1 text-[11.5px] font-bold text-emerald-700">
                          <Icon name="award" className="h-3.5 w-3.5" /> {r.certificateCount}
                        </span>
                      ) : (
                        <span className="text-[12px] text-ink-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 bg-ink-50/40 px-5 py-3 text-[12px] text-slate-500">
            <span>Showing {rows.length} accounts (newest enrolments first).</span>
            <Link href="/admin/users" className="font-bold text-volt-700 hover:underline">
              Manage roles instead →
            </Link>
          </div>
        </div>
      ) : (
        <EmptyState
          title={q ? "No learner matches that search" : "No learners yet"}
          lead={q ? "Try a shorter fragment of the email address." : "As soon as someone signs in with Google — or you enrol them from a course page — they show up here."}
          action={
            <LinkButton href="/admin/courses" variant="outline">
              Manage courses
            </LinkButton>
          }
        />
      )}
    </div>
  );
}
