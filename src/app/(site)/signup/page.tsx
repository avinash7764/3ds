import Link from "next/link";
import { redirect } from "next/navigation";
import { GoogleSignIn } from "@/components/google-sign-in";
import { Icon } from "@/components/ui";
import { Logo } from "@/components/logo";
import { env } from "@/lib/env";
import { currentUser } from "@/server/auth";

export const dynamic = "force-dynamic";

const DEMO_ACCOUNTS = [
  { email: "student@3dsacademy.dev", label: "Student", role: "STUDENT" as const },
  { email: "instructor@3dsacademy.dev", label: "Instructor", role: "INSTRUCTOR" as const },
  { email: "admin@3dsacademy.dev", label: "Admin", role: "ADMIN" as const },
];

export default async function SignUpPage({ searchParams }: { searchParams: { next?: string } }) {
  const user = await currentUser();
  const next = searchParams.next?.startsWith("/") ? searchParams.next : user?.role === "ADMIN" ? "/admin" : "/dashboard";
  if (user) redirect(next);

  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      <section className="panel-dark relative hidden lg:flex">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/media/hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-tr from-ink-950 via-ink-950/92 to-ink-800/70" />
        <div className="grid-overlay absolute inset-0 opacity-60" />
        <div className="relative flex w-full flex-col justify-between p-12">
          <Logo dark />
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-volt-500/30 bg-volt-500/10 px-3 py-1 text-xs font-bold text-volt-300">
              <Icon name="sparkle" className="h-3.5 w-3.5" /> 100% Free Student Account
            </div>
            <h2 className="mt-4 max-w-md text-3xl font-extrabold leading-tight tracking-tight text-white">
              Start mastering CATIA, SIMULIA, and 3DEXPERIENCE today.
            </h2>
            <ul className="mt-8 space-y-4">
              {[
                { icon: "check", title: "Instant Access", copy: "One-click Google signup gives you instant access to all self-paced CAD modules." },
                { icon: "video", title: "Interactive Player", copy: "HD video walkthroughs with step-by-step part files and keyboard navigation." },
                { icon: "award", title: "Verifiable Certificates", copy: "Earn personalized certificates of completion with unique verification IDs." },
                { icon: "shield", title: "No Passwords Needed", copy: "Securely authenticated by Google OAuth so your account is always safe." },
              ].map((f) => (
                <li key={f.title} className="flex gap-3.5">
                  <span className="mt-0.5 inline-flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-white/10 text-volt-300">
                    <Icon name={f.icon} className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-white">{f.title}</span>
                    <span className="mt-0.5 block max-w-md text-[13px] leading-6 text-ink-300">{f.copy}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-[12px] leading-5 text-ink-400">
            By signing up, you agree to the learning platform terms. No credit card required.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-14">
        <div className="w-full max-w-md">
          <div className="lg:hidden">
            <Logo />
          </div>

          {/* Mode Switcher Tabs */}
          <div className="mt-6 flex rounded-xl bg-ink-100 p-1 lg:mt-0">
            <Link
              href={`/login${searchParams.next ? `?next=${encodeURIComponent(searchParams.next)}` : ""}`}
              className="flex-1 rounded-lg py-2 text-center text-xs font-bold text-ink-500 transition-colors hover:text-ink-900"
            >
              Sign In
            </Link>
            <span className="flex-1 rounded-lg bg-white py-2 text-center text-xs font-bold text-ink-900 shadow-sm">
              Create Account
            </span>
          </div>

          <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-ink-900">Create your 3DS Academy account</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Sign up with your Google account to enroll in courses, track your lessons, and download exercise files.
          </p>

          <div className="card mt-6 p-6">
            <GoogleSignIn
              clientId={env.googleClientId}
              configured={env.googleConfigured}
              next={next}
              allowDemo={env.allowDemoLogin}
              demoAccounts={DEMO_ACCOUNTS}
              mode="signup"
            />
          </div>

          <p className="mt-6 text-center text-[13px] text-slate-500">
            Already have an account?{" "}
            <Link
              href={`/login${searchParams.next ? `?next=${encodeURIComponent(searchParams.next)}` : ""}`}
              className="font-bold text-volt-700 hover:underline"
            >
              Sign in with Google
            </Link>
          </p>

          <p className="mt-2 text-center text-[12.5px] text-slate-400">
            Or{" "}
            <Link href="/courses" className="font-medium text-slate-600 hover:underline">
              browse courses without signing up
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
