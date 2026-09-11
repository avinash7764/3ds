import Link from "next/link";
import { CourseCardItem } from "@/components/course-card";
import { EmptyState, Icon, LinkButton } from "@/components/ui";
import { CATEGORIES, LEVELS } from "@/lib/constants";
import { listCourses, courseFacets, enrollmentCards } from "@/server/queries";
import { currentUser } from "@/server/auth";
import { cn } from "@/lib/utils";
import type { CatalogueFilter } from "@/server/queries";

export const dynamic = "force-dynamic";

type Search = {
  q?: string;
  level?: string;
  category?: string;
  sort?: CatalogueFilter["sort"];
  free?: string;
};

const SORTS: { value: NonNullable<CatalogueFilter["sort"]>; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most enrolled" },
  { value: "priceLow", label: "Price: low to high" },
  { value: "priceHigh", label: "Price: high to low" },
  { value: "a-z", label: "A → Z" },
];

export default async function CoursesPage({ searchParams }: { searchParams: Search }) {
  const user = await currentUser();
  const facets = courseFacets();
  const filter: CatalogueFilter = {
    q: searchParams.q,
    level: searchParams.level,
    category: searchParams.category,
    sort: searchParams.sort ?? "newest",
    free: searchParams.free === "1",
  };
  const courses = listCourses(filter);
  const enrolments = user ? enrollmentCards(user.id) : [];
  const progressByCourse = new Map(enrolments.map((e) => [e.courseId, e]));
  const active = Boolean(filter.q || filter.level || filter.category || filter.free);

  return (
    <>
      <section className="border-b border-ink-100 bg-gradient-to-b from-ink-50 to-white">
        <div className="container-x py-14">
          <span className="eyebrow">Courses</span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {courses.length} course{courses.length === 1 ? "" : "s"} on the 3DEXPERIENCE® platform
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-slate-600">
            Every course plays YouTube and Google Drive lessons inside the platform, tracks your progress lesson by lesson, and issues a
            certificate when you finish. Enrolment is one click after Google sign-in.
          </p>

          <form method="GET" action="/courses" className="mt-8 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto]">
            <label className="relative block">
              <span className="sr-only">Search courses</span>
              <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                name="q"
                defaultValue={searchParams.q ?? ""}
                placeholder="Search CATIA, Abaqus, ENOVIA, drafting…"
                className="input h-12 pl-10 text-[15px]"
              />
            </label>
            <select name="category" defaultValue={searchParams.category ?? ""} className="input h-12 min-w-[11rem]" aria-label="Category">
              <option value="">All tracks</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select name="level" defaultValue={searchParams.level ?? ""} className="input h-12 min-w-[9rem]" aria-label="Level">
              <option value="">Any level</option>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <select name="sort" defaultValue={searchParams.sort ?? "newest"} className="input h-12 min-w-[11rem]" aria-label="Sort by">
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <button type="submit" className="btn-inline inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-ink-900 px-5 text-sm font-bold text-white transition-colors hover:bg-volt-600">
              Filter <Icon name="arrowRight" className="h-4 w-4" />
            </button>
            {filter.free ? <input type="hidden" name="free" value="1" /> : null}
          </form>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <FilterChip href="/courses" active={!active} label="All" count={undefined} />
            {facets.categories.map((c) => (
              <FilterChip
                key={c.name}
                href={`/courses?category=${encodeURIComponent(c.name)}`}
                active={filter.category === c.name}
                label={c.name}
                count={c.count}
              />
            ))}
            <Link
              href="/courses?free=1"
              className={cn(
                "rounded-full border px-3 py-1.5 text-[12px] font-bold transition-colors",
                filter.free ? "border-volt-500 bg-volt-500 text-white" : "border-ink-200 bg-white text-ink-600 hover:border-volt-400",
              )}
            >
              Free only
            </Link>
            {active ? (
              <Link href="/courses" className="ml-auto text-[12px] font-bold text-rose-600 hover:underline">
                Clear filters
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="container-x py-12">
        {user && enrolments.length ? (
          <div className="card mb-10 flex flex-wrap items-center justify-between gap-4 border-volt-200 bg-volt-50/60 p-5">
            <div>
              <p className="text-sm font-bold text-ink-900">You're already enrolled in {enrolments.length} course{enrolments.length > 1 ? "s" : ""}</p>
              <p className="mt-1 text-[13px] text-slate-600">Pick up where you left off — progress is saved automatically.</p>
            </div>
            <LinkButton href="/dashboard" variant="primary" size="md">
              Go to my dashboard <Icon name="arrowRight" className="h-4 w-4" />
            </LinkButton>
          </div>
        ) : null}

        {courses.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => {
              const mine = progressByCourse.get(course.id);
              return (
                <CourseCardItem
                  key={course.id}
                  course={course}
                  progress={mine ? mine.progressPct : undefined}
                  nextHref={mine?.next ? `/learn/${course.slug}/${mine.next.id}` : null}
                />
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No courses match those filters"
            lead="Try clearing the filters, or check back next week — faculty publish new tracks every term."
            action={
              <LinkButton href="/courses" variant="outline">
                Reset filters
              </LinkButton>
            }
          />
        )}
      </section>
    </>
  );
}

function FilterChip({ href, label, count, active }: { href: string; label: string; count?: number; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-bold transition-colors",
        active ? "border-ink-900 bg-ink-900 text-white" : "border-ink-200 bg-white text-ink-600 hover:border-ink-400",
      )}
    >
      {label}
      {count !== undefined ? <span className={cn("text-[11px] font-semibold", active ? "text-volt-200" : "text-ink-400")}>{count}</span> : null}
    </Link>
  );
}
