import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile-form";
import { Avatar, Badge, Icon } from "@/components/ui";
import { formatDate } from "@/lib/constants";
import { findUserById, learningStats } from "@/server/queries";
import { currentUser } from "@/server/auth";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const publicUser = await currentUser();
  if (!publicUser) redirect("/login?next=/dashboard/profile");
  const full = findUserById(publicUser.id)!;
  const stats = learningStats(full.id);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)]">
      <section className="space-y-6">
        <div className="card p-6">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar name={full.name} image={full.image} size={64} />
            <div className="min-w-0">
              <h1 className="text-xl font-extrabold tracking-tight">{full.name ?? full.email}</h1>
              <p className="text-[13px] text-slate-500">{full.headline ?? "3DS Academy learner"}</p>
            </div>
            <Badge tone={full.role === "ADMIN" ? "dark" : full.role === "INSTRUCTOR" ? "violet" : "volt"} className="ml-auto">
              {full.role}
            </Badge>
          </div>
          <ProfileForm
            initial={{ name: full.name ?? "", headline: full.headline ?? "", bio: full.bio ?? "" }}
          />
        </div>

        <div className="card p-6">
          <h2 className="text-[15px] font-bold">Learning snapshot</h2>
          <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ["Courses", stats.courses],
              ["Completed", stats.completed],
              ["Lessons", stats.lessons],
              ["Avg progress", `${stats.avgProgress}%`],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl bg-ink-50 p-3.5">
                <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">{label}</dt>
                <dd className="mt-1 text-xl font-extrabold text-ink-900">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="card h-fit p-6">
        <h2 className="text-[15px] font-bold">Account & sign-in</h2>
        <p className="mt-1.5 text-[13px] leading-6 text-slate-600">
          Your identity comes from Google. We store only your name, email and profile picture — no password, no token.
        </p>
        <ul className="mt-5 space-y-3 text-[13px]">
          {[
            ["Email", full.email],
            ["Google subject", full.googleId ? `${full.googleId.slice(0, 12)}…` : "demo account"],
            ["Role", full.role],
            ["Member since", formatDate(full.createdAt)],
            ["Last sign-in", full.lastLoginAt ? formatDate(full.lastLoginAt) : "—"],
            ["Session", `httpOnly cookie · ${Math.round(env.sessionMaxAge / 86400)} days`],
          ].map(([k, v]) => (
            <li key={k} className="flex items-start justify-between gap-4 border-b border-ink-100 pb-2.5 last:border-0">
              <span className="font-semibold text-ink-500">{k}</span>
              <span className="max-w-[60%] break-words text-right font-mono text-[12px] text-ink-900">{v}</span>
            </li>
          ))}
        </ul>
        <p className="mt-5 inline-flex items-start gap-2 rounded-xl bg-ink-50 p-3 text-[12px] leading-5 text-slate-600">
          <Icon name="shield" className="mt-0.5 h-4 w-4 flex-none text-volt-500" />
          Admin rights are granted by the <code className="font-mono">ADMIN_EMAILS</code> list on the server, so a leaked account can't
          escalate itself.
        </p>
      </section>
    </div>
  );
}
