import { UsersTable } from "@/components/admin/users-table";
import { Badge } from "@/components/ui";
import { listUsers } from "@/server/queries";
import { currentUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({ searchParams }: { searchParams: { q?: string } }) {
  const me = (await currentUser())!;
  const users = listUsers(searchParams.q ?? "");

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Accounts & roles</h1>
          <p className="mt-1.5 text-[14px] text-slate-600">
            Anyone who signs in with Google gets an account here automatically. Roles decide what a person can do — admins are also promoted by the{" "}
            <code className="font-mono text-[12px]">ADMIN_EMAILS</code> list.
          </p>
        </div>
        <div className="flex gap-2">
          <Badge tone="dark">STUDENT</Badge>
          <Badge tone="violet">INSTRUCTOR</Badge>
          <Badge tone="green">ADMIN</Badge>
        </div>
      </header>

      <UsersTable
        me={{ id: me.id, email: me.email }}
        query={searchParams.q ?? ""}
        users={users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          image: u.image,
          role: u.role,
          courseCount: u.courseCount,
          totalMinutes: u.totalMinutes,
          createdAt: u.createdAt,
          lastLoginAt: u.lastLoginAt,
          headline: u.headline,
        }))}
      />
    </div>
  );
}
