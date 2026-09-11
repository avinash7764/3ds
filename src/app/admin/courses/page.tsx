import Link from "next/link";
import { AdminCourseRowActions } from "@/components/admin/course-row-actions";
import { Badge, EmptyState, Icon, LinkButton, ProgressBar } from "@/components/ui";
import { adminCourseTable } from "@/server/queries";
import { formatDate, minutesToHuman } from "@/lib/constants";
import { priceFmt } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function AdminCoursesPage({ searchParams }: { searchParams: { q?: string } }) {
  const rows = adminCourseTable(searchParams.q ?? "");
  const totals = rows.reduce(
    (acc, r) => ({
      lessons: acc.lessons + r.lessonCount,
      missing: acc.missing + r.missingVideos,
      students: acc.students + r.studentCount,
      minutes: acc.minutes + r.durationMins,
    }),
    { lessons: 0, missing: 0, students: 0, minutes: 0 },
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Courses & videos</h1>
          <p className="mt-1.5 text-[14px] text-slate-600">
            {rows.length} courses · {totals.lessons} lessons · {minutesToHuman(totals.minutes)} of video
            {totals.missing > 0 ? (
              <>
                {" · "}
                <span className="font-bold text-amber-600">{totals.missing} lessons still need a link</span>
              </>
            ) : (
              <>
                {" · "}
                <span className="font-bold text-emerald-600">every lesson has a playable link</span>
              </>
            )}
          </p>
        </div>
        <LinkButton href="/admin/courses/new" size="md">
          <Icon name="plus" className="h-4 w-4" /> New course
        </LinkButton>
      </header>

      <form method="get" action="/admin/courses" className="flex flex-wrap gap-2">
        <input name="q" defaultValue={searchParams.q ?? ""} placeholder="Search title, slug, category…" className="input max-w-sm" />
        <button className="inline-flex h-10 items-center gap-2 rounded-xl bg-ink-900 px-4 text-[13px] font-bold text-white hover:bg-volt-600">
          <Icon name="search" className="h-4 w-4" /> Search
        </button>
        {searchParams.q ? (
          <Link href="/admin/courses" className="inline-flex h-10 items-center rounded-xl border border-ink-200 px-4 text-[13px] font-bold text-ink-600 hover:border-rose-300 hover:text-rose-600">
            Reset
          </Link>
        ) : null}
      </form>

      {rows.length ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[62rem] text-left text-[13px]">
              <thead className="bg-ink-50/80 text-[11px] uppercase tracking-wide text-ink-400">
                <tr>
                  <th className="px-4 py-3 font-bold">Course</th>
                  <th className="px-3 py-3 font-bold">Videos</th>
                  <th className="px-3 py-3 font-bold">Learners</th>
                  <th className="px-3 py-3 font-bold">Price</th>
                  <th className="px-3 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 align-top">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-ink-50/40">
                    <td className="max-w-md px-4 py-3">
                      <div className="flex gap-3">
                        <div className="min-w-0">
                          <Link href={`/admin/courses/${r.id}`} className="block truncate font-bold text-ink-900 hover:text-volt-700">
                            {r.title}
                          </Link>
                          <p className="mt-0.5 truncate font-mono text-[11px] text-slate-400">/courses/{r.slug}</p>
                          <p className="mt-1 text-[11.5px] font-semibold text-ink-500">
                            {r.category} · {r.level} · {r.instructorName ?? "no mentor"} · updated {formatDate(r.updatedAt)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink-50 px-2 py-1 text-[12px] font-bold text-ink-800">
                        <Icon name="video" className="h-3.5 w-3.5 text-volt-600" />
                        {r.videoCount}/{r.lessonCount}
                      </span>
                      {r.missingVideos > 0 ? (
                        <p className="mt-1 text-[11px] font-bold text-amber-600">{r.missingVideos} missing link</p>
                      ) : (
                        <p className="mt-1 text-[11px] font-bold text-emerald-600">complete</p>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-bold tabular-nums text-ink-900">{r.studentCount}</p>
                      <ProgressBar value={r.avgProgress} className="mt-1 w-24" />
                      <p className="mt-1 text-[11px] text-slate-500">{r.completedCount} finished</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-bold text-ink-900">{priceFmt(r.price)}</p>
                      {r.mrpPrice > r.price ? <p className="text-[11px] text-slate-400 line-through">{priceFmt(r.mrpPrice)}</p> : null}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col items-start gap-1">
                        {r.published ? <Badge tone="green">Published</Badge> : <Badge tone="amber">Draft</Badge>}
                        {r.featured ? <Badge tone="volt">Featured</Badge> : null}
                        {r.resourceCount ? <span className="text-[11px] text-slate-400">{r.resourceCount} attachments</span> : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <AdminCourseRowActions
                        course={{ id: r.id, slug: r.slug, title: r.title, published: r.published, featured: r.featured, lessonCount: r.lessonCount }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          title={searchParams.q ? "No course matches that search" : "No courses yet"}
          lead={
            searchParams.q
              ? "Try a shorter query, or reset to see the whole catalogue."
              : "Create your first course, then paste YouTube or Google Drive links into its lessons."
          }
          action={
            searchParams.q ? (
              <LinkButton href="/admin/courses" variant="outline">
                Reset search
              </LinkButton>
            ) : (
              <LinkButton href="/admin/courses/new">
                <Icon name="plus" className="h-4 w-4" /> New course
              </LinkButton>
            )
          }
        />
      )}
    </div>
  );
}
