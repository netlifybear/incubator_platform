import { prisma } from "@/lib/prisma";
import { AdminReviewsList } from "./reviews-list";

export default async function AdminReviewsPage() {
  const [consumerReviews, founderReviews] = await Promise.all([
    prisma.consumerReview.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { vendor: { select: { name: true } }, cohort: { select: { name: true } } },
    }),
    prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        vendor: { select: { name: true } },
        cohort: { select: { name: true } },
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Reviews
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          Moderate reviews
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
          {consumerReviews.length + founderReviews.length} total reviews.
        </p>
      </section>

      <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Consumer reviews</h2>
        <AdminReviewsList type="consumer" reviews={consumerReviews} />
      </section>

      <section className="rounded-3xl border border-[var(--border)] bg-white/70 p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Founder reviews</h2>
        <AdminReviewsList type="founder" reviews={founderReviews} />
      </section>
    </div>
  );
}
