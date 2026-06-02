import { listFoundersWithTags } from "@/lib/nominations";

function issuerLabel(issuerType: string | null): string {
  switch (issuerType) {
    case "vendor": return "V";
    case "investor": return "I";
    case "admin": return "A";
    case "auto": return "";
    default: return "";
  }
}

function issuerColor(issuerType: string | null): string {
  switch (issuerType) {
    case "vendor": return "bg-purple-100 text-purple-700";
    case "investor": return "bg-green-100 text-green-700";
    case "admin": return "bg-amber-100 text-amber-700";
    default: return "";
  }
}

export async function AdminFoundersBadgesSection({
  cohortId,
}: {
  cohortId: string;
}) {
  const founders = await listFoundersWithTags(cohortId);

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
            Founder tags
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            {founders.length} founders
          </h2>
          <p className="mt-2 max-w-2xl leading-7 text-[var(--muted)]">
            See which contribution tags each founder holds.
          </p>
        </div>
      </div>

      {founders.length === 0 ? (
        <p className="mt-5 text-[var(--muted)]">No founders in this cohort.</p>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {founders.map((founder) => (
            <div
              key={founder.id}
              className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4"
            >
              <p className="font-medium">
                {founder.name ?? founder.email}
              </p>
              {founder.badges.length === 0 ? (
                <p className="mt-2 text-xs text-[var(--muted)]">No tags yet</p>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {founder.badges.map((tag) => {
                    const il = issuerLabel(tag.issuerType);
                    const ic = issuerColor(tag.issuerType);
                    return (
                      <span
                        key={tag.type}
                        title={(tag.description ?? tag.def?.description ?? tag.type) + (il ? ` [${il === "V" ? "Vendor" : il === "I" ? "Investor" : "Admin"}]` : "")}
                        className="inline-flex items-center gap-1 rounded-full bg-[var(--panel-strong)] px-2.5 py-1 text-xs font-medium"
                      >
                        {tag.def?.icon ?? "\uD83C\uDFC6"} {tag.def?.label ?? tag.type}
                        {il ? <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${ic}`}>{il}</span> : null}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function FoundersBadgesFallback() {
  return (
    <section className="animate-pulse rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
      <div className="h-4 w-24 rounded-full bg-[var(--panel-strong)]" />
      <div className="mt-3 h-7 w-32 rounded-full bg-[var(--panel-strong)]" />
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-[var(--panel-strong)]" />
        ))}
      </div>
    </section>
  );
}
