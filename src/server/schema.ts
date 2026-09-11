/**
 * Database schema (SQLite). Applied automatically on first connection, so a fresh clone
 * only needs `npm run db:seed`. Every table is plain SQL — easy to port to Postgres/MySQL.
 */
export const SCHEMA_SQL = /* sql */ `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT,
  image         TEXT,
  google_id     TEXT UNIQUE,
  role          TEXT NOT NULL DEFAULT 'STUDENT',
  headline      TEXT,
  bio           TEXT,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  last_login_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE TABLE IF NOT EXISTS courses (
  id             TEXT PRIMARY KEY,
  slug           TEXT NOT NULL UNIQUE,
  title          TEXT NOT NULL,
  subtitle       TEXT,
  description    TEXT NOT NULL DEFAULT '',
  what_you_learn TEXT,
  requirements   TEXT,
  level          TEXT NOT NULL DEFAULT 'Beginner',
  category       TEXT NOT NULL DEFAULT 'Design',
  language       TEXT NOT NULL DEFAULT 'English',
  thumbnail      TEXT,
  hero_video_url TEXT,
  price          INTEGER NOT NULL DEFAULT 0,
  mrp_price      INTEGER NOT NULL DEFAULT 0,
  duration_mins  INTEGER NOT NULL DEFAULT 0,
  published      INTEGER NOT NULL DEFAULT 0,
  featured       INTEGER NOT NULL DEFAULT 0,
  certificate_on TEXT,
  tags           TEXT,
  instructor_id  TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_courses_pub ON courses(published, featured);
CREATE INDEX IF NOT EXISTS idx_courses_cat ON courses(category, level);

CREATE TABLE IF NOT EXISTS modules (
  id       TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title    TEXT NOT NULL,
  summary  TEXT,
  position INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_modules_course ON modules(course_id, position);

CREATE TABLE IF NOT EXISTS lessons (
  id            TEXT PRIMARY KEY,
  module_id     TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  video_url     TEXT,
  duration_mins INTEGER NOT NULL DEFAULT 0,
  position      INTEGER NOT NULL DEFAULT 0,
  is_preview    INTEGER NOT NULL DEFAULT 0,
  notes         TEXT
);
CREATE INDEX IF NOT EXISTS idx_lessons_module ON lessons(module_id, position);

CREATE TABLE IF NOT EXISTS resources (
  id        TEXT PRIMARY KEY,
  course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id TEXT REFERENCES lessons(id) ON DELETE CASCADE,
  title     TEXT NOT NULL,
  url       TEXT NOT NULL,
  kind      TEXT NOT NULL DEFAULT 'DRIVE',
  size_text TEXT
);
CREATE INDEX IF NOT EXISTS idx_resources_course ON resources(course_id);

CREATE TABLE IF NOT EXISTS faqs (
  id       TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer   TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS enrollments (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id     TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  progress_pct  REAL NOT NULL DEFAULT 0,
  last_lesson_id TEXT,
  status        TEXT NOT NULL DEFAULT 'ACTIVE',
  enrolled_at   TEXT NOT NULL,
  completed_at  TEXT,
  UNIQUE (user_id, course_id)
);
CREATE INDEX IF NOT EXISTS idx_enroll_course ON enrollments(course_id);

CREATE TABLE IF NOT EXISTS lesson_progress (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id   TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed   INTEGER NOT NULL DEFAULT 0,
  watched_secs INTEGER NOT NULL DEFAULT 0,
  updated_at  TEXT NOT NULL,
  completed_at TEXT,
  UNIQUE (user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS certificates (
  id            TEXT PRIMARY KEY,
  credential_id TEXT NOT NULL UNIQUE,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id     TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  issued_at     TEXT NOT NULL,
  UNIQUE (user_id, course_id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id  TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  rating     INTEGER NOT NULL DEFAULT 5,
  comment    TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (user_id, course_id)
);

CREATE TABLE IF NOT EXISTS activity_log (
  id         TEXT PRIMARY KEY,
  user_id    TEXT REFERENCES users(id) ON DELETE SET NULL,
  type       TEXT NOT NULL,
  message    TEXT NOT NULL,
  meta       TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at DESC);
`;

/** Columns that live as 0/1 integers in SQLite but must be real booleans in JS. */
export const BOOLEAN_FIELDS = new Set([
  "published",
  "featured",
  "is_preview",
  "isPreview",
]);
