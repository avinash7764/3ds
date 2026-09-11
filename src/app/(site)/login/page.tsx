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

export default async function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
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
            <h2 className="max-w-md text-3xl font-extrabold leading-tight tracking-tight text-white">
              One Google account. Student progress, faculty uploads, certificates.
            </h2>
            <ul className="mt-8 space-y-4">
              {[
                { icon: "shield", title: "Gmail-based sign in", copy: "Verified Google ID tokens, an httpOnly session cookie, no passwords in our database." },
                { icon: "video", title: "Watch anywhere", copy: "YouTube and Google Drive lessons resume exactly where you stopped." },
                { icon: "upload", title: "Faculty can publish in minutes", copy: "Paste a Drive or YouTube link, set the module order, hit publish." },
                { icon: "award", title: "Certificate on completion", copy: "Every lesson tracked; a verifiable credential ID at 100%." },
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
            By continuing you agree to the demo terms of use. This is an independent learning project, not affiliated with Dassault
            Systèmes.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-14">
        <div className="w-full max-w-md">
          <div className="lg:hidden">
            <Logo />
          </div>
          <h1 className="mt-8 text-2xl font-extrabold tracking-tight text-ink-900 lg:mt-0">Sign in to 3DS Academy</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Use the Google account your college issued — that email becomes your student or admin identity. New addresses get a student
            account automatically
            {env.adminEmails.length ? `, and addresses on the admin list (${env.adminEmails.join(", ")}) get the admin panel` : ""}.
          </p>

          <div className="card mt-7 p-6">
            <GoogleSignIn
              clientId={env.googleClientId}
              configured={env.googleConfigured}
              next={next}
              allowDemo={env.allowDemoLogin}
              demoAccounts={DEMO_ACCOUNTS}
            />
          </div>

          <p className="mt-6 text-center text-[13px] text-slate-500">
            Just browsing?{" "}
            <Link href="/courses" className="font-bold text-volt-700 hover:underline">
              See the public course catalogue
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
