import { prisma } from "@/lib/prisma";
import { AdminCreateSprintForm } from "./sprint-form";

export async function AdminSprintsSection({ cohortId }: { cohortId: string }) {
  const activeSprint = await prisma.sprint.findFirst({
    where: {
      cohortId,
      endsAt: { gte: new Date() },
    },
    orderBy: { endsAt: "asc" },
  });

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Directory Sprint</h2>
      <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
        Create a time-limited push to fill gaps in the directory.
      </p>

      {activeSprint ? (
        <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
          <p className="font-semibold text-[var(--accent)]">Active sprint: {activeSprint.name}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {activeSprint.startsAt.toLocaleDateString()} — {activeSprint.endsAt.toLocaleDateString()}
          </p>
        </div>
      ) : (
        <p className="mt-2 text-sm text-[var(--muted)]">No active sprint.</p>
      )}

      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-semibold text-[var(--accent)]">
          Create new sprint
        </summary>
        <div className="mt-3">
          <AdminCreateSprintForm />
        </div>
      </details>
    </section>
  );
}
