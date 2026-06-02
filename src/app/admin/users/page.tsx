import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRoleForm } from "./user-role-form";

export default async function AdminUsersPage() {
  const admin = await getCurrentAdmin();
  if (!admin?.cohortId) throw new Error("Unauthorized");

  const users = await prisma.user.findMany({
    where: { cohortId: admin.cohortId },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      _count: {
        select: {
          reviews: true,
          badges: true,
        },
      },
    },
  });

  const alumni = users.filter((u) => u.role === "alumni");
  const founders = users.filter((u) => u.role === "founder");

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Users
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          Manage cohort members
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
          Graduate founders to alumni status when they complete the program. Alumni
          retain read-only access to their cohort&apos;s content.
        </p>
      </section>

      {alumni.length > 0 ? (
        <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Alumni ({alumni.length})</h2>
          <div className="mt-4 space-y-3">
            {alumni.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{user.name ?? "Unnamed"}</p>
                    <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                      Alumni
                    </span>
                  </div>
                  <p className="text-sm text-[var(--muted)]">{user.email}</p>
                  <div className="mt-1 flex gap-3 text-xs text-[var(--muted)]">
                    <span>{user._count.reviews} reviews</span>
                    <span>{user._count.badges} badges</span>
                  </div>
                </div>
                <UserRoleForm userId={user.id} action="restore" />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Founders ({founders.length})</h2>
        <div className="mt-4 space-y-3">
          {founders.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4"
            >
              <div>
                <p className="font-semibold">{user.name ?? "Unnamed"}</p>
                <p className="text-sm text-[var(--muted)]">{user.email}</p>
                <div className="mt-1 flex gap-3 text-xs text-[var(--muted)]">
                  <span>{user._count.reviews} reviews</span>
                  <span>{user._count.badges} badges</span>
                </div>
              </div>
              <UserRoleForm userId={user.id} action="graduate" />
            </div>
          ))}
          {founders.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No founders in this cohort.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
