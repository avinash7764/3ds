import Link from "next/link";
import { Badge, Icon, ProgressBar } from "@/components/ui";
import { discountPct, priceFmt } from "@/lib/utils";
import { minutesToHuman } from "@/lib/constants";
import { parseVideo, thumbFor } from "@/lib/video";
import type { CourseCard } from "@/server/types";

export function CourseThumb({ course, className }: { course: Pick<CourseCard, "thumbnail" | "heroVideoUrl" | "title">; className?: string }) {
  const thumb = thumbFor(course);
  if (thumb) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img src={thumb} alt={course.title} loading="lazy" className={className ?? "h-full w-full object-cover"} />
    );
  }
  return <FallbackThumb title={course.title} className={className} />;
}

export function FallbackThumb({ title, className }: { title: string; className?: string }) {
  return (
    <div className={className ?? "flex h-full w-full items-end bg-gradient-to-br from-ink-900 via-ink-800 to-volt-700 p-4"}>
      <svg viewBox="0 0 120 120" className="absolute right-3 top-3 h-16 w-16 text-white/25" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M60 12l40 22v44L60 108 20 78V34z" strokeLinejoin="round" />
        <path d="M60 60l40-24M60 60v48M60 60L20 36" strokeLinejoin="round" />
      </svg>
      <span className="relative line-clamp-2 text-sm font-bold leading-snug text-white">{title}</span>
    </div>
  );
}

export function CourseCardItem({
  course,
  progress,
  nextHref,
  compact = false,
}: {
  course: CourseCard;
  progress?: number;
  nextHref?: string | null;
  compact?: boolean;
}) {
  const off = discountPct(course.price, course.mrpPrice);
  const parsed = parseVideo(course.heroVideoUrl);
  const href = `/courses/${course.slug}`;

  return (
    <article className="card group flex h-full flex-col overflow-hidden transition-all hover:-translate-y-0.5 hover:border-ink-200 hover:shadow-[0_18px_50px_-24px_rgba(11,18,51,.35)]">
      <Link href={href} className="relative block aspect-[16/9] overflow-hidden bg-ink-950">
        <CourseThumb course={course} className="h-full w-full object-cover opacity-95 transition-transform duration-500 group-hover:scale-[1.04]" />
        <span className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink-950/85 to-transparent" />
        <span className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {course.featured ? <Badge tone="dark" className="border-volt-400/40 bg-volt-500/90 text-white">★ Featured</Badge> : null}
          {off > 0 ? <Badge tone="dark" className="border-flame/40 bg-flame/90 text-white">{off}% OFF</Badge> : null}
          {course.price === 0 ? <Badge tone="dark" className="border-emerald-300/40 bg-emerald-500/90 text-white">Free</Badge> : null}
        </span>
        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
          <Icon name={parsed.provider === "drive" ? "layers" : "play"} className="h-3.5 w-3.5" />
          {parsed.provider === "drive" ? "Drive trailer" : parsed.provider === "youtube" ? "Trailer" : "Preview"}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-ink-400">
          <span className="truncate">{course.category}</span>
          <span className="text-ink-200">•</span>
          <span>{course.level}</span>
        </div>
        <h3 className="mt-2 text-[15px] font-bold leading-snug text-ink-900">
          <Link href={href} className="hover:text-volt-700">
            {compact && course.title.length > 62 ? course.title.slice(0, 62) + "…" : course.title}
          </Link>
        </h3>
        {course.subtitle && !compact ? <p className="mt-1.5 line-clamp-2 text-[13px] leading-6 text-slate-500">{course.subtitle}</p> : null}

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] font-medium text-ink-500">
          <span className="inline-flex items-center gap-1">
            <Icon name="users" className="h-3.5 w-3.5" /> {course.instructorName ?? "3DS Academy"}
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon name="book" className="h-3.5 w-3.5" /> {course.lessonCount} lessons
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon name="clock" className="h-3.5 w-3.5" /> {minutesToHuman(course.durationMins)}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-2 text-[12px] text-ink-500">
          {course.ratingAvg ? (
            <>
              <span className="font-bold text-ink-900">{course.ratingAvg.toFixed(1)}</span>
              <span className="text-amber-400">★★★★★</span>
              <span>({course.ratingCount})</span>
              <span className="text-ink-200">•</span>
            </>
          ) : null}
          <span>{course.studentCount.toLocaleString("en-IN")} learners</span>
        </div>

        {progress !== undefined ? (
          <div className="mt-3">
            <ProgressBar value={progress} showLabel />
            {progress >= 100 ? <p className="mt-1.5 text-[12px] font-semibold text-emerald-600">Completed — certificate ready</p> : null}
          </div>
        ) : null}

        <div className="mt-4 flex items-end justify-between gap-3 border-t border-ink-100 pt-3">
          <div>
            <span className="text-lg font-extrabold text-ink-900">{priceFmt(course.price)}</span>
            {off > 0 ? <span className="ml-2 text-[13px] font-medium text-slate-400 line-through">{priceFmt(course.mrpPrice)}</span> : null}
          </div>
          <Link
            href={progress !== undefined && nextHref ? nextHref : href}
            className="inline-flex items-center gap-1.5 rounded-xl bg-ink-900 px-3.5 py-2 text-[13px] font-bold text-white transition-colors hover:bg-volt-600"
          >
            {progress !== undefined ? (progress >= 100 ? "Certificate" : "Continue") : "View course"}
            <Icon name="arrowRight" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
