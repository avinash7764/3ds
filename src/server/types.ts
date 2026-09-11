import type { Role } from "@/lib/session";

export type { Role };

export type User = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  googleId: string | null;
  role: Role;
  headline: string | null;
  bio: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
};

export type Course = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string;
  whatYouLearn: string | null;
  requirements: string | null;
  level: string;
  category: string;
  language: string;
  thumbnail: string | null;
  heroVideoUrl: string | null;
  price: number;
  mrpPrice: number;
  durationMins: number;
  published: boolean;
  featured: boolean;
  certificateOn: string | null;
  tags: string | null;
  instructorId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Module = {
  id: string;
  courseId: string;
  title: string;
  summary: string | null;
  position: number;
};

export type Lesson = {
  id: string;
  moduleId: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  durationMins: number;
  position: number;
  isPreview: boolean;
  notes: string | null;
};

export type Resource = {
  id: string;
  courseId: string | null;
  lessonId: string | null;
  title: string;
  url: string;
  kind: string;
  sizeText: string | null;
};

export type Faq = { id: string; courseId: string; question: string; answer: string; position: number };

export type Enrollment = {
  id: string;
  userId: string;
  courseId: string;
  progressPct: number;
  lastLessonId: string | null;
  status: "ACTIVE" | "COMPLETED";
  enrolledAt: string;
  completedAt: string | null;
};

export type LessonProgress = {
  id: string;
  userId: string;
  lessonId: string;
  completed: boolean;
  watchedSecs: number;
  updatedAt: string;
  completedAt: string | null;
};

export type Certificate = { id: string; credentialId: string; userId: string; courseId: string; issuedAt: string };
export type Review = { id: string; userId: string; courseId: string; rating: number; comment: string; createdAt: string };
export type Activity = { id: string; userId: string | null; type: string; message: string; meta: string | null; createdAt: string };

export type CourseCard = Course & {
  instructorName: string | null;
  instructorImage: string | null;
  lessonCount: number;
  studentCount: number;
  ratingAvg: number | null;
  ratingCount: number;
};

export type CourseDetail = CourseCard & {
  modules: (Module & { lessons: Lesson[] })[];
  resources: Resource[];
  faqs: Faq[];
  reviews: (Review & { userName: string | null; userEmail: string })[];
};

/** Flat lesson row joined with its course/module for the player + progress writes. */
export type FlatLesson = Lesson & {
  moduleTitle: string;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  lessonCount: number;
  modulePosition: number;
};
