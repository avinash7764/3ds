/**
 * All SQL lives here. Server Components, Route Handlers and the seed script share these
 * functions so the read/write semantics (progress maths, certificate issuing, activity
 * logging) stay in one place.
 */
import { env } from "@/lib/env";
import { slugify } from "@/lib/constants";
import { credentialId, get, all, run, insert, update, newId, nowIso, type SqlParam } from "./db";
import type {
  Activity,
  Certificate,
  Course,
  CourseCard,
  CourseDetail,
  Enrollment,
  Faq,
  FlatLesson,
  Lesson,
  Module,
  Resource,
  Review,
  Role,
  User,
} from "./types";

/* ------------------------------------------------------------------ *
 * Users                                                              *
 * ------------------------------------------------------------------ */

const USER_BY = {
  email: "SELECT * FROM users WHERE lower(email) = lower(?)",
  id: "SELECT * FROM users WHERE id = ?",
  googleId: "SELECT * FROM users WHERE google_id = ?",
} as const;

export const findUserByEmail = (email: string) => get<User>(USER_BY.email, [email]);
export const findUserById = (id: string) => get<User>(USER_BY.id, [id]);

/** Create-or-update on Google sign-in, auto-promoting addresses listed in ADMIN_EMAILS. */
export function upsertUserFromGoogle(input: {
  email: string;
  name?: string | null;
  image?: string | null;
  googleId?: string | null;
}) {
  const email = input.email.trim().toLowerCase();
  const shouldAdmin = env.adminEmails.includes(email);
  const existing = findUserByEmail(email);
  const now = nowIso();

  if (existing) {
    update("users", existing.id, {
      name: input.name ?? existing.name,
      image: input.image ?? existing.image,
      google_id: input.googleId ?? existing.googleId,
      last_login_at: now,
      updated_at: now,
      role: shouldAdmin && existing.role !== "ADMIN" ? "ADMIN" : undefined,
    });
    return findUserById(existing.id)!;
  }

  const id = newId();
  insert("users", {
    id,
    email,
    name: input.name ?? email.split("@")[0],
    image: input.image ?? null,
    google_id: input.googleId ?? null,
    role: shouldAdmin ? "ADMIN" : "STUDENT",
    created_at: now,
    updated_at: now,
    last_login_at: now,
  });
  logActivity("LOGIN", `${input.name ?? email} signed in with Google`, id);
  return findUserById(id)!;
}

export function ensureDemoUser(email: string) {
  const user = findUserByEmail(email);
  if (user) {
    update("users", user.id, { last_login_at: nowIso() });
    return findUserById(user.id)!;
  }
  const id = newId();
  insert("users", {
    id,
    email,
    name: email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()),
    image: null,
    google_id: `demo-${email}`,
    role: env.adminEmails.includes(email) ? "ADMIN" : "STUDENT",
    created_at: nowIso(),
    updated_at: nowIso(),
    last_login_at: nowIso(),
  });
  return findUserById(id)!;
}

export function listUsers(search = "") {
  const like = `%${search.trim()}%`;
  return all<User & { courseCount: number; totalMinutes: number }>(
    `SELECT u.*,
            (SELECT COUNT(*) FROM enrollments e WHERE e.user_id = u.id) AS course_count,
            COALESCE((SELECT SUM(c.duration_mins) FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.user_id = u.id), 0) AS total_minutes
       FROM users u
      WHERE (? = '' OR u.name LIKE ? OR u.email LIKE ? OR u.role LIKE ?)
      ORDER BY u.created_at DESC`,
    [search, like, like, like],
  );
}

export function setUserRole(id: string, role: Role) {
  return update("users", id, { role, updated_at: nowIso() });
}

export function deleteUser(id: string) {
  return run("DELETE FROM users WHERE id = ?", [id]).changes;
}

export const countUsers = (role?: Role) =>
  get<{ v: number }>(role ? "SELECT COUNT(*) AS v FROM users WHERE role = ?" : "SELECT COUNT(*) AS v FROM users", role ? [role] : [])?.v ?? 0;

/* ------------------------------------------------------------------ *
 * Courses — public catalogue                                          *
 * ------------------------------------------------------------------ */

const CARD_SELECT = /* sql */ `
SELECT c.*,
       u.name  AS instructor_name,
       u.image AS instructor_image,
       u.headline AS instructor_headline,
       (SELECT COUNT(*) FROM lessons l JOIN modules m ON m.id = l.module_id WHERE m.course_id = c.id) AS lesson_count,
       (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) AS student_count,
       (SELECT ROUND(AVG(r.rating), 1) FROM reviews r WHERE r.course_id = c.id) AS rating_avg,
       (SELECT COUNT(*) FROM reviews r WHERE r.course_id = c.id) AS rating_count
  FROM courses c
  LEFT JOIN users u ON u.id = c.instructor_id`;

export type CatalogueFilter = {
  q?: string;
  level?: string;
  category?: string;
  sort?: "newest" | "popular" | "priceLow" | "priceHigh" | "a-z";
  featured?: boolean;
  free?: boolean;
};

export function listCourses(filter: CatalogueFilter = {}, opts: { includeDrafts?: boolean } = {}) {
  const where: string[] = [];
  const params: SqlParam[] = [];
  if (!opts.includeDrafts) where.push("c.published = 1");
  if (filter.level) {
    where.push("c.level = ?");
    params.push(filter.level);
  }
  if (filter.category) {
    where.push("c.category = ?");
    params.push(filter.category);
  }
  if (filter.featured) where.push("c.featured = 1");
  if (filter.free) where.push("c.price = 0");
  if (filter.q) {
    where.push("(c.title LIKE ? OR c.subtitle LIKE ? OR c.tags LIKE ? OR c.category LIKE ?)");
    const like = `%${filter.q.trim()}%`;
    params.push(like, like, like, like);
  }
  const sortMap: Record<NonNullable<CatalogueFilter["sort"]>, string> = {
    newest: "c.created_at DESC",
    popular: "student_count DESC, c.created_at DESC",
    priceLow: "c.price ASC, c.title ASC",
    priceHigh: "c.price DESC, c.title ASC",
    "a-z": "c.title ASC",
  };
  const order = sortMap[filter.sort ?? "newest"];
  const sql = `${CARD_SELECT} ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY c.featured DESC, ${order}`;
  return all<CourseCard>(sql, params);
}

export function listFeaturedCourses(limit = 4) {
  return all<CourseCard>(`${CARD_SELECT} WHERE c.published = 1 AND c.featured = 1 ORDER BY c.created_at DESC LIMIT ?`, [limit]);
}

export function listTopCourses(limit = 6) {
  return all<CourseCard>(`${CARD_SELECT} WHERE c.published = 1 ORDER BY student_count DESC, c.created_at DESC LIMIT ?`, [limit]);
}

export function getCourseDetailBySlug(slug: string): (CourseDetail & { instructor: User | null }) | null {
  const base = get<CourseCard>(`${CARD_SELECT} WHERE c.slug = ?`, [slug]);
  if (!base) return null;
  const detail = hydrateCourseDetail(base.id)!;
  const instructor = base.instructorId ? findUserById(base.instructorId) : null;
  return { ...base, ...detail, instructor };
}

function hydrateCourseDetail(courseId: string) {
  const modules = all<Module>("SELECT * FROM modules WHERE course_id = ? ORDER BY position, rowid", [courseId]);
  const lessons = all<Lesson>(
    `SELECT l.* FROM lessons l JOIN modules m ON m.id = l.module_id
      WHERE m.course_id = ? ORDER BY m.position, l.position, l.rowid`,
    [courseId],
  );
  return {
    modules: modules.map((m) => ({ ...m, lessons: lessons.filter((l) => l.moduleId === m.id) })),
    resources: all<Resource>("SELECT * FROM resources WHERE course_id = ? ORDER BY rowid", [courseId]),
    faqs: all<Faq>("SELECT * FROM faqs WHERE course_id = ? ORDER BY position, rowid", [courseId]),
    reviews: all<Review & { user_name: string; user_email: string }>(
      `SELECT r.*, u.name AS user_name, u.email AS user_email FROM reviews r
        JOIN users u ON u.id = r.user_id WHERE r.course_id = ? ORDER BY r.created_at DESC`,
      [courseId],
    ).map((r) => ({ ...r, userName: r.user_name, userEmail: r.user_email })),
    allLessons: lessons,
  };
}

export function courseFacets() {
  const rows = all<{ category: string; level: string; total: number }>(
    "SELECT category, level, COUNT(*) AS total FROM courses WHERE published = 1 GROUP BY category, level",
  );
  const categories = new Map<string, number>();
  const levels = new Map<string, number>();
  for (const r of rows) {
    categories.set(r.category, (categories.get(r.category) ?? 0) + r.total);
    levels.set(r.level, (levels.get(r.level) ?? 0) + r.total);
  }
  return {
    categories: [...categories.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    levels: [...levels.entries()].map(([name, count]) => ({ name, count })),
  };
}

/* ------------------------------------------------------------------ *
 * Lessons / curriculum                                               *
 * ------------------------------------------------------------------ */

const FLAT_LESSON_SELECT = /* sql */ `
SELECT l.*, m.title AS module_title, m.position AS module_position,
       c.id AS course_id, c.slug AS course_slug, c.title AS course_title, c.price AS course_price,
       (SELECT COUNT(*) FROM lessons lx JOIN modules mx ON mx.id = lx.module_id WHERE mx.course_id = c.id) AS lesson_count
  FROM lessons l
  JOIN modules m ON m.id = l.module_id
  JOIN courses c ON c.id = m.course_id`;

export function lessonsForCourse(courseId: string) {
  return all<FlatLesson>(`${FLAT_LESSON_SELECT} WHERE c.id = ? ORDER BY m.position, l.position, l.rowid`, [courseId]);
}

export const findLesson = (id: string) => get<Lesson>("SELECT * FROM lessons WHERE id = ?", [id]);

export function findFlatLesson(id: string) {
  return get<FlatLesson>(`${FLAT_LESSON_SELECT} WHERE l.id = ?`, [id]);
}

export function lessonNeighbors(id: string) {
  const lesson = findFlatLesson(id);
  if (!lesson) return { prev: null, next: null, index: 0, total: 0 };
  const list = lessonsForCourse(lesson.courseId);
  const index = list.findIndex((l) => l.id === id);
  return {
    index: Math.max(index, 0),
    total: list.length,
    prev: index > 0 ? list[index - 1] : null,
    next: index >= 0 && index < list.length - 1 ? list[index + 1] : null,
  };
}

export function resourcesForLesson(lessonId: string) {
  return all<Resource>("SELECT * FROM resources WHERE lesson_id = ? ORDER BY rowid", [lessonId]);
}

/* ------------------------------------------------------------------ *
 * Enrollments + progress                                             *
 * ------------------------------------------------------------------ */

export const isEnrolled = (userId: string, courseId: string) =>
  Boolean(get<Enrollment>("SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?", [userId, courseId]));

export function enroll(userId: string, courseId: string) {
  const existing = get<Enrollment>("SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?", [userId, courseId]);
  if (existing) return { enrollment: existing, created: false };
  const id = newId();
  const course = get<Course>("SELECT * FROM courses WHERE id = ?", [courseId]);
  const first = lessonsForCourse(courseId)[0];
  insert("enrollments", {
    id,
    user_id: userId,
    course_id: courseId,
    progress_pct: 0,
    last_lesson_id: first?.id ?? null,
    status: "ACTIVE",
    enrolled_at: nowIso(),
  });
  logActivity("ENROLL", `${course?.title ?? "A course"} enrolment added`, userId, JSON.stringify({ courseId }));
  return { enrollment: get<Enrollment>("SELECT * FROM enrollments WHERE id = ?", [id])!, created: true };
}

export function unenroll(userId: string, courseId: string) {
  run("DELETE FROM lesson_progress WHERE user_id = ? AND lesson_id IN (SELECT l.id FROM lessons l JOIN modules m ON m.id = l.module_id WHERE m.course_id = ?)", [userId, courseId]);
  run("DELETE FROM certificates WHERE user_id = ? AND course_id = ?", [userId, courseId]);
  return run("DELETE FROM enrollments WHERE user_id = ? AND course_id = ?", [userId, courseId]).changes;
}

export function completedLessonIds(userId: string, courseId: string) {
  return new Set(
    all<{ lesson_id: string }>(
      `SELECT lp.lesson_id FROM lesson_progress lp
        JOIN lessons l ON l.id = lp.lesson_id
        JOIN modules m ON m.id = l.module_id
       WHERE lp.user_id = ? AND m.course_id = ? AND lp.completed = 1`,
      [userId, courseId],
    ).map((r) => r.lesson_id),
  );
}

export function setLessonProgress(userId: string, lessonId: string, completed: boolean, watchedSecs = 0) {
  const lesson = findLesson(lessonId);
  if (!lesson) return null;
  const mod = get<Module>("SELECT * FROM modules WHERE id = ?", [lesson.moduleId]);
  if (!mod) return null;
  const courseId = mod.courseId;
  if (!isEnrolled(userId, courseId)) return null;

  const existing = get<{ id: string }>("SELECT id FROM lesson_progress WHERE user_id = ? AND lesson_id = ?", [userId, lessonId]);
  const now = nowIso();
  if (existing) {
    update("lesson_progress", existing.id, {
      completed,
      completed_at: completed ? now : null,
      watched_secs: Math.max(0, watchedSecs),
      updated_at: now,
    });
  } else {
    insert("lesson_progress", {
      id: newId(),
      user_id: userId,
      lesson_id: lessonId,
      completed,
      completed_at: completed ? now : null,
      watched_secs: Math.max(0, watchedSecs),
      updated_at: now,
    });
  }
  return recomputeEnrollment(userId, courseId, lessonId);
}

/** Recompute % + status, issue a certificate when the course is finished. */
export function recomputeEnrollment(userId: string, courseId: string, lastLessonId?: string) {
  const total = get<{ v: number }>(
    "SELECT COUNT(*) AS v FROM lessons l JOIN modules m ON m.id = l.module_id WHERE m.course_id = ?",
    [courseId],
  )?.v ?? 0;
  const done = get<{ v: number }>(
    `SELECT COUNT(*) AS v FROM lesson_progress lp JOIN lessons l ON l.id = lp.lesson_id
      JOIN modules m ON m.id = l.module_id
     WHERE lp.user_id = ? AND m.course_id = ? AND lp.completed = 1`,
    [userId, courseId],
  )?.v ?? 0;
  const pct = total ? Number(((done / total) * 100).toFixed(2)) : 0;
  const enrollment = get<Enrollment>("SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?", [userId, courseId]);
  if (!enrollment) return null;

  const finished = total > 0 && done >= total;
  update("enrollments", enrollment.id, {
    progress_pct: pct,
    status: finished ? "COMPLETED" : "ACTIVE",
    completed_at: finished ? enrollment.completedAt ?? nowIso() : null,
    last_lesson_id: lastLessonId ?? enrollment.lastLessonId,
  });

  if (finished && !get<Certificate>("SELECT id FROM certificates WHERE user_id = ? AND course_id = ?", [userId, courseId])) {
    const certId = newId();
    insert("certificates", {
      id: certId,
      credential_id: credentialId(),
      user_id: userId,
      course_id: courseId,
      issued_at: nowIso(),
    });
    const course = get<Course>("SELECT * FROM courses WHERE id = ?", [courseId]);
    logActivity("CERTIFICATE", `Certificate issued for ${course?.title ?? "course"}`, userId, JSON.stringify({ courseId }));
  }
  return get<Enrollment>("SELECT * FROM enrollments WHERE id = ?", [enrollment.id]);
}

export function enrollmentCards(userId: string) {
  return all<
    Enrollment & {
      course: CourseCard;
      next_lesson_title: string | null;
      next_lesson_id: string | null;
      completed_count: number;
    }
  >(
    `SELECT e.* FROM enrollments e WHERE e.user_id = ? ORDER BY e.enrolled_at DESC`,
    [userId],
  ).map((row) => {
    const course = get<CourseCard>(`${CARD_SELECT} WHERE c.id = ?`, [row.courseId])!;
    const list = lessonsForCourse(row.courseId);
    const completed = completedLessonIds(row.userId, row.courseId);
    const next = list.find((l) => !completed.has(l.id)) ?? list[0] ?? null;
    const certificate = get<Certificate>("SELECT * FROM certificates WHERE user_id = ? AND course_id = ?", [row.userId, row.courseId]);
    return {
      ...row,
      course,
      next,
      nextLessonTitle: next?.title ?? null,
      nextLessonId: next?.id ?? null,
      completedCount: completed.size,
      certificate: certificate ?? null,
    };
  });
}

export function learningStats(userId: string) {
  const totals = get<{
    courses: number;
    completed: number;
    minutes: number;
    lessons: number;
    avg_progress: number;
  }>(
    `SELECT COUNT(*) AS courses,
            COALESCE(SUM(CASE WHEN e.status = 'COMPLETED' THEN 1 ELSE 0 END), 0) AS completed,
            COALESCE(SUM(c.duration_mins), 0) AS minutes,
            COALESCE(AVG(e.progress_pct), 0) AS avg_progress,
            (SELECT COUNT(*) FROM lesson_progress lp WHERE lp.user_id = ? AND lp.completed = 1) AS lessons
       FROM enrollments e JOIN courses c ON c.id = e.course_id
      WHERE e.user_id = ?`,
    [userId, userId],
  );
  return {
    courses: totals?.courses ?? 0,
    completed: totals?.completed ?? 0,
    minutes: totals?.minutes ?? 0,
    lessons: totals?.lessons ?? 0,
    avgProgress: Math.round(totals?.avg_progress ?? 0),
  };
}

export const certificatesForUser = (userId: string) =>
  all<Certificate & { courseTitle: string; courseSlug: string; level: string; hours: number; instructorName: string | null }>(
    `SELECT cert.*, c.title AS course_title, c.slug AS course_slug, c.level,
            ROUND(c.duration_mins / 60.0, 1) AS hours, u.name AS instructor_name
       FROM certificates cert
       JOIN courses c ON c.id = cert.course_id
       LEFT JOIN users u ON u.id = c.instructor_id
      WHERE cert.user_id = ? ORDER BY cert.issued_at DESC`,
    [userId],
  );

export type CertificateView = {
  id: string;
  credentialId: string;
  issuedAt: string;
  userId: string;
  courseId: string;
  title: string;
  courseTitle: string;
  certificateOn: string | null;
  courseSlug: string;
  level: string;
  category: string;
  durationMins: number;
  hours: number;
  userName: string | null;
  userEmail: string;
  instructorName: string | null;
};

export function certificateView(credentialIdValue: string) {
  return get<CertificateView>(
    `SELECT cert.*, c.title AS course_title, c.certificate_on, c.level, c.category, c.slug AS course_slug,
            ROUND(c.duration_mins / 60.0, 1) AS hours,
            u.name AS user_name, u.email AS user_email, s.name AS instructor_name
       FROM certificates cert
       JOIN courses c ON c.id = cert.course_id
       JOIN users u ON u.id = cert.user_id
       LEFT JOIN users s ON s.id = c.instructor_id
      WHERE cert.credential_id = ?`,
    [credentialIdValue],
  );
}

export function recentCompletions(userId: string, limit = 8) {
  return all<{ lessonTitle: string; courseTitle: string; courseSlug: string; lessonId: string; completedAt: string | null }>(
    `SELECT lp.completed_at, l.title AS lesson_title, l.id AS lesson_id, c.title AS course_title, c.slug AS course_slug
       FROM lesson_progress lp
       JOIN lessons l ON l.id = lp.lesson_id
       JOIN modules m ON m.id = l.module_id
       JOIN courses c ON c.id = m.course_id
      WHERE lp.user_id = ? AND lp.completed = 1
      ORDER BY lp.completed_at DESC LIMIT ?`,
    [userId, limit],
  );
}

/** Published courses the learner is not enrolled in yet, highest enrolment first. */
export function recommendedFor(userId: string, limit = 3) {
  return all<CourseCard>(
    `${CARD_SELECT}
      WHERE c.published = 1
        AND c.id NOT IN (SELECT course_id FROM enrollments WHERE user_id = ?)
      ORDER BY student_count DESC, c.created_at DESC
      LIMIT ?`,
    [userId, limit],
  );
}

/* ------------------------------------------------------------------ *
 * Reviews                                                            *
 * ------------------------------------------------------------------ */

export function upsertReview(userId: string, courseId: string, rating: number, comment: string) {
  const existing = get<Review>("SELECT * FROM reviews WHERE user_id = ? AND course_id = ?", [userId, courseId]);
  if (existing) {
    update("reviews", existing.id, { rating, comment });
    return existing.id;
  }
  const id = newId();
  insert("reviews", { id, user_id: userId, course_id: courseId, rating, comment, created_at: nowIso() });
  return id;
}

/* ------------------------------------------------------------------ *
 * Admin: dashboard numbers                                           *
 * ------------------------------------------------------------------ */

export function adminStats() {
  const scalar = <T,>(sql: string, params: SqlParam[] = []) => get<{ v: T }>(sql, params)?.v;
  const totals = {
    students: scalar<number>("SELECT COUNT(*) AS v FROM users WHERE role = 'STUDENT'") ?? 0,
    instructors: scalar<number>("SELECT COUNT(*) AS v FROM users WHERE role IN ('INSTRUCTOR','ADMIN')") ?? 0,
    courses: scalar<number>("SELECT COUNT(*) AS v FROM courses") ?? 0,
    published: scalar<number>("SELECT COUNT(*) AS v FROM courses WHERE published = 1") ?? 0,
    drafts: scalar<number>("SELECT COUNT(*) AS v FROM courses WHERE published = 0") ?? 0,
    modules: scalar<number>("SELECT COUNT(*) AS v FROM modules") ?? 0,
    lessons: scalar<number>("SELECT COUNT(*) AS v FROM lessons") ?? 0,
    videos: scalar<number>("SELECT COUNT(*) AS v FROM lessons WHERE video_url IS NOT NULL AND video_url <> ''") ?? 0,
    minutes: scalar<number>("SELECT COALESCE(SUM(duration_mins), 0) AS v FROM courses WHERE published = 1") ?? 0,
    enrollments: scalar<number>("SELECT COUNT(*) AS v FROM enrollments") ?? 0,
    completions: scalar<number>("SELECT COUNT(*) AS v FROM enrollments WHERE status = 'COMPLETED'") ?? 0,
    certificates: scalar<number>("SELECT COUNT(*) AS v FROM certificates") ?? 0,
    resources: scalar<number>("SELECT COUNT(*) AS v FROM resources") ?? 0,
    revenue: scalar<number>(
      "SELECT COALESCE(SUM(c.price), 0) AS v FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE c.price > 0",
    ) ?? 0,
    avgProgress: Math.round(scalar<number>("SELECT COALESCE(AVG(progress_pct), 0) AS v FROM enrollments") ?? 0),
    newThisWeek: scalar<number>("SELECT COUNT(*) AS v FROM users WHERE created_at > datetime('now','-7 days')") ?? 0,
  };
  const byCourse = all<CourseCard>(
    `${CARD_SELECT} ORDER BY student_count DESC LIMIT 6`,
  );
  const byCategory = all<{ category: string; total: number; minutes: number }>(
    `SELECT category, COUNT(*) AS total, COALESCE(SUM(duration_mins),0) AS minutes
       FROM courses WHERE published = 1 GROUP BY category ORDER BY total DESC`,
  );
  const activity = recentActivity(14);
  return { totals, byCourse, byCategory, activity };
}

export function recentActivity(limit = 20) {
  return all<Activity & { userName: string | null; userEmail: string | null }>(
    `SELECT a.*, u.name AS user_name, u.email AS user_email FROM activity_log a
      LEFT JOIN users u ON u.id = a.user_id ORDER BY a.created_at DESC LIMIT ?`,
    [limit],
  );
}

export function logActivity(type: string, message: string, userId?: string | null, meta?: string | null) {
  insert("activity_log", {
    id: newId(),
    user_id: userId ?? null,
    type,
    message,
    meta: meta ?? null,
    created_at: nowIso(),
  });
}

export function weeklyEnrollments(days = 12) {
  return all<{ week: string; total: number }>(
    `SELECT strftime('%Y-%W', enrolled_at) AS week, COUNT(*) AS total
       FROM enrollments GROUP BY week ORDER BY week DESC LIMIT ?`,
    [days],
  ).reverse();
}

/* ------------------------------------------------------------------ *
 * Admin: course CRUD                                                 *
 * ------------------------------------------------------------------ */

export function adminGetCourse(id: string) {
  const course = get<CourseCard>("SELECT * FROM courses WHERE id = ?", [id]);
  if (!course) return null;
  const detail = hydrateCourseDetail(id)!;
  const instructor = course.instructorId ? findUserById(course.instructorId) : null;
  return { ...course, ...detail, instructor, students: studentsOfCourse(id) };
}

export const adminListCourses = () => all<CourseCard>(`${CARD_SELECT} ORDER BY c.updated_at DESC`);

export type AdminCourseRow = {
  id: string; title: string; slug: string; category: string; level: string; language: string;
  price: number; mrpPrice: number; published: boolean; featured: boolean; updatedAt: string;
  lessonCount: number; videoCount: number; missingVideos: number; studentCount: number;
  avgProgress: number; resourceCount: number; completedCount: number; durationMins: number;
  instructorName: string | null;
};

/** Everything the admin table needs in one pass, including "lessons still missing a video". */
export function adminCourseTable(search = "") {
  const like = `%${search.trim()}%`;
  return all<AdminCourseRow>(
    `SELECT c.id, c.title, c.slug, c.category, c.level, c.language, c.price, c.mrp_price,
            c.published, c.featured, c.updated_at, c.duration_mins,
            (SELECT COUNT(*) FROM lessons l JOIN modules m ON m.id = l.module_id WHERE m.course_id = c.id) AS lesson_count,
            (SELECT COUNT(*) FROM lessons l JOIN modules m ON m.id = l.module_id WHERE m.course_id = c.id
              AND l.video_url IS NOT NULL AND l.video_url <> '') AS video_count,
            (SELECT COUNT(*) FROM lessons l JOIN modules m ON m.id = l.module_id WHERE m.course_id = c.id
              AND (l.video_url IS NULL OR l.video_url = '')) AS missing_videos,
            (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) AS student_count,
            (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status = 'COMPLETED') AS completed_count,
            COALESCE((SELECT AVG(e.progress_pct) FROM enrollments e WHERE e.course_id = c.id), 0) AS avg_progress,
            (SELECT COUNT(*) FROM resources r WHERE r.course_id = c.id) AS resource_count,
            u.name AS instructor_name
       FROM courses c LEFT JOIN users u ON u.id = c.instructor_id
      WHERE (? = '' OR c.title LIKE ? OR c.slug LIKE ? OR c.category LIKE ? OR c.level LIKE ?)
      ORDER BY c.published ASC, c.updated_at DESC`,
    [search, like, like, like, like],
  );
}

/** Empty strings from <select>/<input> must become NULL or the FK check fails. */
function normaliseFk(value?: string | null) {
  const v = (value ?? "").trim();
  return v === "" ? null : v;
}

function uniqueSlug(title: string, exceptId?: string) {
  let base = slugify(title) || "course";
  let candidate = base;
  let i = 2;
  while (get<{ id: string }>(`SELECT id FROM courses WHERE slug = ?${exceptId ? " AND id <> ?" : ""}`, exceptId ? [candidate, exceptId] : [candidate])) {
    candidate = `${base}-${i++}`;
  }
  return candidate;
}

export type CourseInput = {
  title: string;
  slug?: string | null;
  subtitle?: string | null;
  description?: string | null;
  whatYouLearn?: string | null;
  requirements?: string | null;
  level?: string;
  category?: string;
  language?: string | null;
  thumbnail?: string | null;
  heroVideoUrl?: string | null;
  price?: number;
  mrpPrice?: number;
  published?: boolean;
  featured?: boolean;
  certificateOn?: string | null;
  tags?: string | null;
  instructorId?: string | null;
};

export function createCourse(data: CourseInput) {
  const id = newId();
  const now = nowIso();
  insert("courses", {
    id,
    slug: data.slug?.trim() ? slugify(data.slug) : uniqueSlug(data.title),
    title: data.title,
    subtitle: data.subtitle ?? null,
    description: data.description ?? "",
    what_you_learn: data.whatYouLearn ?? null,
    requirements: data.requirements ?? null,
    level: data.level ?? "Beginner",
    category: data.category ?? "Design",
    language: data.language ?? "English",
    thumbnail: normaliseFk(data.thumbnail),
    hero_video_url: normaliseFk(data.heroVideoUrl),
    price: data.price ?? 0,
    mrp_price: data.mrpPrice ?? 0,
    published: data.published ?? false,
    featured: data.featured ?? false,
    certificate_on: data.certificateOn ?? data.title,
    tags: data.tags ?? null,
    instructor_id: normaliseFk(data.instructorId),
    created_at: now,
    updated_at: now,
  });
  logActivity("COURSE_CREATED", `Course “${data.title}” created`, undefined, JSON.stringify({ courseId: id }));
  return get<Course>("SELECT * FROM courses WHERE id = ?", [id])!;
}

export function updateCourse(id: string, data: Partial<CourseInput>) {
  const payload: Record<string, SqlParam> = {
    title: data.title,
    subtitle: data.subtitle,
    description: data.description,
    what_you_learn: data.whatYouLearn,
    requirements: data.requirements,
    level: data.level,
    category: data.category,
    language: data.language,
    thumbnail: data.thumbnail === "" ? null : data.thumbnail,
    hero_video_url: data.heroVideoUrl === "" ? null : data.heroVideoUrl,
    price: data.price,
    mrp_price: data.mrpPrice,
    published: data.published,
    featured: data.featured,
    certificate_on: data.certificateOn,
    tags: data.tags,
    instructor_id: normaliseFk(data.instructorId),
    updated_at: nowIso(),
  };
  if (data.slug !== undefined) payload.slug = slugify(data.slug ?? "") || uniqueSlug(data.title || "course", id);
  update("courses", id, payload);
  recomputeCourseDuration(id);
  return get<Course>("SELECT * FROM courses WHERE id = ?", [id]);
}

export function deleteCourse(id: string) {
  const course = get<Course>("SELECT title FROM courses WHERE id = ?", [id]);
  const changes = run("DELETE FROM courses WHERE id = ?", [id]).changes;
  if (changes) logActivity("COURSE_DELETED", `Course “${course?.title}” deleted`);
  return changes;
}

export function recomputeCourseDuration(courseId: string) {
  const mins = get<{ v: number }>(
    `SELECT COALESCE(SUM(l.duration_mins), 0) AS v FROM lessons l JOIN modules m ON m.id = l.module_id WHERE m.course_id = ?`,
    [courseId],
  )?.v ?? 0;
  update("courses", courseId, { duration_mins: mins, updated_at: nowIso() });
  return mins;
}

/* -------------------------- modules ------------------------------ */

export function createModule(courseId: string, title: string, summary?: string | null) {
  const position =
    (get<{ v: number }>("SELECT COALESCE(MAX(position) + 1, 0) AS v FROM modules WHERE course_id = ?", [courseId])?.v ?? 0) + 0;
  const id = newId();
  insert("modules", { id, course_id: courseId, title, summary: summary ?? null, position });
  logActivity("MODULE_CREATED", `Module “${title}” added`, undefined, JSON.stringify({ courseId }));
  return get<Module>("SELECT * FROM modules WHERE id = ?", [id])!;
}

export const updateModule = (id: string, data: Partial<Module>) => {
  update("modules", id, { title: data.title, summary: data.summary, position: data.position });
  return get<Module>("SELECT * FROM modules WHERE id = ?", [id]);
};

export const deleteModule = (id: string) => run("DELETE FROM modules WHERE id = ?", [id]).changes;

/** Swap a module with its neighbour in the course ordering. */
export function moveModule(id: string, dir: -1 | 1) {
  const current = get<Module>("SELECT * FROM modules WHERE id = ?", [id]);
  if (!current) return;
  const list = all<Module>("SELECT * FROM modules WHERE course_id = ? ORDER BY position, rowid", [current.courseId]);
  const index = list.findIndex((m) => m.id === id);
  const neighbour = list[index + dir];
  if (!neighbour) return;
  const ordered = [...list];
  ordered[index] = neighbour;
  ordered[index + dir] = current;
  ordered.forEach((m, i) => update("modules", m.id, { position: i }));
}

/* -------------------------- lessons ------------------------------ */

export function createLesson(moduleId: string, data: Partial<Lesson> & { title: string }) {
  const courseId = get<Module>("SELECT * FROM modules WHERE id = ?", [moduleId])?.courseId ?? "";
  const position =
    get<{ v: number }>("SELECT COALESCE(MAX(position) + 1, 0) AS v FROM lessons WHERE module_id = ?", [moduleId])?.v ?? 0;
  const id = newId();
  insert("lessons", {
    id,
    module_id: moduleId,
    title: data.title,
    description: data.description ?? null,
    video_url: data.videoUrl ?? null,
    duration_mins: data.durationMins ?? 0,
    position,
    is_preview: data.isPreview ?? false,
    notes: data.notes ?? null,
  });
  recomputeCourseDuration(courseId);
  logActivity("LESSON_CREATED", `Lesson “${data.title}” uploaded`, undefined, JSON.stringify({ courseId, moduleId }));
  return get<Lesson>("SELECT * FROM lessons WHERE id = ?", [id])!;
}

export function updateLesson(id: string, data: Partial<Lesson>) {
  const before = get<Lesson>("SELECT * FROM lessons WHERE id = ?", [id]);
  update("lessons", id, {
    title: data.title,
    description: data.description,
    video_url: data.videoUrl === undefined ? undefined : data.videoUrl || null,
    duration_mins: data.durationMins,
    position: data.position,
    is_preview: data.isPreview,
    notes: data.notes,
    module_id: data.moduleId,
  });
  const after = get<Lesson>("SELECT * FROM lessons WHERE id = ?", [id]);
  for (const courseId of [before?.moduleId, after?.moduleId]) {
    const mod = courseId ? get<Module>("SELECT * FROM modules WHERE id = ?", [courseId]) : null;
    if (mod) recomputeCourseDuration(mod.courseId);
  }
  return after;
}

/** Move a lesson within its module, or into the previous/next module at the edges. */
export function deleteLesson(id: string) {
  const lesson = get<Lesson>("SELECT * FROM lessons WHERE id = ?", [id]);
  const changes = run("DELETE FROM lessons WHERE id = ?", [id]).changes;
  const mod = lesson ? get<Module>("SELECT * FROM modules WHERE id = ?", [lesson.moduleId]) : null;
  if (mod) recomputeCourseDuration(mod.courseId);
  return changes;
}

export function moveLesson(id: string, dir: -1 | 1, toModuleId?: string) {
  const current = get<Lesson>("SELECT * FROM lessons WHERE id = ?", [id]);
  if (!current) return;
  const targetModule = toModuleId ?? current.moduleId;

  if (targetModule !== current.moduleId) {
    const nextPos = all<Lesson>("SELECT * FROM lessons WHERE module_id = ? ORDER BY position, rowid", [targetModule]).length;
    update("lessons", id, { module_id: targetModule, position: nextPos });
    tidyPositions(current.moduleId);
    return;
  }

  const list = all<Lesson>("SELECT * FROM lessons WHERE module_id = ? ORDER BY position, rowid", [current.moduleId]);
  const index = list.findIndex((l) => l.id === id);
  if (list[index + dir]) {
    const ordered = [...list];
    ordered[index] = list[index + dir];
    ordered[index + dir] = current;
    ordered.forEach((l, i) => update("lessons", l.id, { position: i }));
    return;
  }

  // pushing past the end of a module moves the lesson into the next module
  const modules = all<Module>("SELECT * FROM modules WHERE course_id = ? ORDER BY position, rowid", [
    get<Module>("SELECT * FROM modules WHERE id = ?", [current.moduleId])!.courseId,
  ]);
  const mIndex = modules.findIndex((m) => m.id === current.moduleId);
  const neighbourModule = modules[mIndex + dir];
  if (!neighbourModule) return;
  update("lessons", id, { module_id: neighbourModule.id, position: dir === 1 ? 0 : 9999 });
  tidyPositions(current.moduleId);
  if (dir === -1) {
    const moved = all<Lesson>("SELECT * FROM lessons WHERE module_id = ? ORDER BY position, rowid", [neighbourModule.id]);
    moved.forEach((l, i) => update("lessons", l.id, { position: i === moved.length - 1 ? -1 : i }));
    update("lessons", id, { position: 0 });
    all<Lesson>("SELECT * FROM lessons WHERE module_id = ? AND id <> ? ORDER BY position, rowid", [neighbourModule.id, id])
      .forEach((l, i) => update("lessons", l.id, { position: i + 1 }));
  }
}

function tidyPositions(moduleId: string) {
  all<Lesson>("SELECT * FROM lessons WHERE module_id = ? ORDER BY position, rowid", [moduleId]).forEach((l, i) =>
    update("lessons", l.id, { position: i }),
  );
}

/* -------------------------- resources & faqs --------------------- */

export function addResource(input: { courseId?: string | null; lessonId?: string | null; title: string; url: string; kind?: string; sizeText?: string | null }) {
  const id = newId();
  insert("resources", {
    id,
    course_id: input.courseId ?? null,
    lesson_id: input.lessonId ?? null,
    title: input.title,
    url: input.url,
    kind: input.kind ?? "DRIVE",
    size_text: input.sizeText ?? null,
  });
  return get<Resource>("SELECT * FROM resources WHERE id = ?", [id])!;
}

export const updateResource = (id: string, data: Partial<Resource>) => {
  update("resources", id, { title: data.title, url: data.url, kind: data.kind, size_text: data.sizeText });
  return get<Resource>("SELECT * FROM resources WHERE id = ?", [id]);
};

export const deleteResource = (id: string) => run("DELETE FROM resources WHERE id = ?", [id]).changes;

export function addFaq(courseId: string, question: string, answer: string) {
  const position = get<{ v: number }>("SELECT COALESCE(MAX(position) + 1, 0) AS v FROM faqs WHERE course_id = ?", [courseId])?.v ?? 0;
  const id = newId();
  insert("faqs", { id, course_id: courseId, question, answer, position });
  return get<Faq>("SELECT * FROM faqs WHERE id = ?", [id])!;
}

export const updateFaq = (id: string, data: Partial<Faq>) => {
  update("faqs", id, { question: data.question, answer: data.answer });
  return get<Faq>("SELECT * FROM faqs WHERE id = ?", [id]);
};

export const deleteFaq = (id: string) => run("DELETE FROM faqs WHERE id = ?", [id]).changes;

/* -------------------------- students of a course ---------------- */

export function studentsOfCourse(courseId: string) {
  return all<
    Enrollment & { email: string; name: string | null; image: string | null; role: Role; lessonsDone: number; total: number }
  >(
    `SELECT e.*, u.email, u.name, u.image, u.role,
            (SELECT COUNT(*) FROM lesson_progress lp WHERE lp.user_id = e.user_id AND lp.completed = 1
              AND lp.lesson_id IN (SELECT l.id FROM lessons l JOIN modules m ON m.id = l.module_id WHERE m.course_id = e.course_id)) AS lessons_done,
            (SELECT COUNT(*) FROM lessons l JOIN modules m ON m.id = l.module_id WHERE m.course_id = e.course_id) AS total
       FROM enrollments e JOIN users u ON u.id = e.user_id
      WHERE e.course_id = ? ORDER BY e.enrolled_at DESC`,
    [courseId],
  );
}

export function enrollStudentByemail(courseId: string, email: string) {
  const clean = email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(clean)) return { error: "Enter a valid email address" as const };
  let user = findUserByEmail(clean);
  if (!user) {
    const id = newId();
    insert("users", {
      id,
      email: clean,
      name: clean.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()),
      role: "STUDENT",
      created_at: nowIso(),
      updated_at: nowIso(),
    });
    user = findUserById(id)!;
    logActivity("USER_INVITED", `${clean} added by admin`, id);
  }
  const { created } = enroll(user.id, courseId);
  return { error: created ? (null as string | null) : ("Already enrolled" as string | null), user };
}
