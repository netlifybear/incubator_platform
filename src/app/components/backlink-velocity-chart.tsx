type Snapshot = {
  snapshotAt: Date;
  verifiedCount: number;
  lostCount: number;
  reachableCount: number;
  pendingCount: number;
};

const BAR_COLORS = {
  verified: { fill: "#16a34a", label: "Verified" },
  reachable: { fill: "#2563eb", label: "Reachable" },
  pending: { fill: "#9ca3af", label: "Pending" },
  lost: { fill: "#dc2626", label: "Lost" },
} as const;

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function BacklinkVelocityChart({ snapshots }: { snapshots: Snapshot[] }) {
  if (snapshots.length < 2) {
    return (
      <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Link velocity</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Run &quot;Verify all&quot; at least twice to see your backlink trend over time.
        </p>
      </section>
    );
  }

  const allValues = snapshots.flatMap((s) => [s.verifiedCount, s.lostCount, s.reachableCount, s.pendingCount]);
  const maxVal = Math.max(...allValues, 1);
  const chartHeight = 200;
  const barWidth = Math.max(20, Math.min(60, 600 / snapshots.length - 8));
  const chartWidth = Math.max(300, snapshots.length * (barWidth + 8));

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Link velocity</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        How your backlink profile has changed over time
      </p>

      <div className="mt-6 overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight + 60}`}
          className="w-full"
          style={{ maxWidth: chartWidth }}
          role="img"
          aria-label="Backlink velocity chart"
        >
          {snapshots.map((s, i) => {
            const x = i * (barWidth + 8) + 8;
            const groupHeight = chartHeight;
            const verifiedH = (s.verifiedCount / maxVal) * groupHeight;
            const reachableH = (s.reachableCount / maxVal) * groupHeight;
            const pendingH = (s.pendingCount / maxVal) * groupHeight;
            const lostH = (s.lostCount / maxVal) * groupHeight;
            let yOffset = 0;

            return (
              <g key={i}>
                {s.verifiedCount > 0 && (
                  <rect
                    x={x}
                    y={groupHeight - yOffset - verifiedH}
                    width={barWidth}
                    height={verifiedH}
                    fill={BAR_COLORS.verified.fill}
                    rx={2}
                  >
                    <title>{s.verifiedCount} verified</title>
                  </rect>
                )}
                {(yOffset += verifiedH)}
                {s.reachableCount > 0 && (
                  <rect
                    x={x}
                    y={groupHeight - yOffset - reachableH}
                    width={barWidth}
                    height={reachableH}
                    fill={BAR_COLORS.reachable.fill}
                    rx={2}
                  >
                    <title>{s.reachableCount} reachable</title>
                  </rect>
                )}
                {(yOffset += reachableH)}
                {s.pendingCount > 0 && (
                  <rect
                    x={x}
                    y={groupHeight - yOffset - pendingH}
                    width={barWidth}
                    height={pendingH}
                    fill={BAR_COLORS.pending.fill}
                    rx={2}
                  >
                    <title>{s.pendingCount} pending</title>
                  </rect>
                )}
                {(yOffset += pendingH)}
                {s.lostCount > 0 && (
                  <rect
                    x={x}
                    y={groupHeight - yOffset - lostH}
                    width={barWidth}
                    height={lostH}
                    fill={BAR_COLORS.lost.fill}
                    rx={2}
                  >
                    <title>{s.lostCount} lost</title>
                  </rect>
                )}
                <text
                  x={x + barWidth / 2}
                  y={groupHeight + 16}
                  textAnchor="middle"
                  className="fill-[var(--muted)]"
                  fontSize={11}
                >
                  {formatDate(s.snapshotAt)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-4 flex flex-wrap gap-4">
        {Object.entries(BAR_COLORS).map(([key, c]) => (
          <div key={key} className="flex items-center gap-2 text-sm">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: c.fill }}
            />
            <span className="text-[var(--muted)]">{c.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
