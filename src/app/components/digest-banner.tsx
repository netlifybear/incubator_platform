import { generateDigestForFounder } from "@/lib/weekly-digest";

type Props = {
  userId: string;
};

export async function DigestBanner({ userId }: Props) {
  const digest = await generateDigestForFounder(userId);
  if (!digest) return null;

  const actions: string[] = [];
  if (!digest.publicProfileEnabled) actions.push("Enable your public profile");
  if (digest.reviewCount === 0) actions.push("Write your first review");
  if (digest.backlinkVerifiedCount === 0) actions.push("Add a backlink");

  if (actions.length === 0 && digest.incomingTargetedRequests === 0) return null;

  return (
    <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-700">
            Your digest
          </p>
          <p className="mt-2 text-xl font-semibold">
            {digest.profileViewCount} profile views · {digest.reviewCount} reviews ·{" "}
            {digest.backlinkVerifiedCount} backlinks
          </p>
          {actions.length > 0 ? (
            <p className="mt-2 leading-7 text-[var(--muted)]">
              Suggested next step{actions.length > 1 ? "s" : ""}:{" "}
              <span className="font-semibold text-[var(--foreground)]">
                {actions.join(", ")}
              </span>
            </p>
          ) : null}
        </div>
        {digest.incomingTargetedRequests > 0 ? (
          <a
            href="/requests"
            className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white"
          >
            {digest.incomingTargetedRequests} question{digest.incomingTargetedRequests > 1 ? "s" : ""}
          </a>
        ) : null}
      </div>
    </div>
  );
}
