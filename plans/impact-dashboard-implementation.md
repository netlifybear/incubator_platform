# Impact Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the remaining leaderboard-first experience with a cohort impact dashboard while keeping point computation internal for ordering, export, and compatibility.

**Architecture:** Add a focused impact summary library that gathers founder and cohort contribution metrics from existing tables. Update `/grow`, `/rewards`, and `/leaderboard` to consume those metrics, with `/leaderboard` becoming a private cohort contribution dashboard rather than a score table. Keep routes and existing data models stable.

**Tech Stack:** Next.js 16 App Router, React server components, Prisma, Node test runner, existing CSS variables and AppShell layout.

---

## Product Decisions

This is the approved direction for the next implementation agent:

- Keep `/leaderboard` as the URL for compatibility, but treat it as "Contribution view" in copy and layout.
- Do not expose point totals in normal UI. Points remain available to `getFounderPoints()`, reputation export/import, credibility APIs, and internal ordering.
- Show impact metrics that a founder can understand without learning game mechanics: reviews written, helpful votes received, cohort reviews, active contributors, profile views, verified backlinks, and contribution signals.
- Keep badges as "badges" on badge-specific pages and admin tools, but describe them as "contribution signals" on Grow, Rewards, and Contribution surfaces.
- Avoid new database columns in this pass. Use existing `Review`, `HelpfulVote`, `Badge`, `BacklinkLog`, `User`, and invite/referral helpers.
- Do not expose private founder review text, request text, admin data, or cross-cohort details on public pages.

## File Map

- Modify `src/lib/leaderboard.ts`: Keep the existing `getLeaderboard()` contract, but add a `signal` alias or successor shape only if needed by UI.
- Create `src/lib/impact.ts`: Centralize founder and cohort impact summary queries.
- Create `src/lib/impact.test.ts`: Test aggregation and privacy-safe behavior without rendering pages.
- Modify `src/app/grow/page.tsx`: Replace the current split Profile/Impact card copy with a stronger personal impact dashboard using `getFounderImpactSummary()`.
- Modify `src/app/rewards/page.tsx`: Remove rank emphasis and point-derived breakdown labels from the visible UI; show contribution ingredients and next actions.
- Modify `src/app/leaderboard/page.tsx`: Rework the page into a cohort contribution dashboard with aggregate metrics first and a lightweight contributor list second.
- Modify `plans/gamification-rethink.md`: Mark the executable implementation slice as defined.
- Modify `plans/README.md`: Add this plan to the plan index with execution guidance.

## Task 1: Add Impact Summary Library

**Files:**
- Create: `src/lib/impact.ts`
- Create: `src/lib/impact.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/impact.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "./prisma.ts";
import { getCohortImpactSummary, getFounderImpactSummary } from "./impact.ts";

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

test("getFounderImpactSummary returns personal contribution metrics", async () => {
  const cohort = await prisma.cohort.create({
    data: { name: `Impact Test ${suffix}`, slug: `impact-test-${suffix}` },
  });
  const founder = await prisma.user.create({
    data: {
      email: `impact-founder-${suffix}@example.com`,
      name: "Impact Founder",
      cohortId: cohort.id,
      publicProfileEnabled: true,
      profileViewCount: 7,
    },
  });
  const vendor = await prisma.vendor.create({
    data: { name: `Impact Vendor ${suffix}`, category: "Legal", cohortId: cohort.id },
  });
  const review = await prisma.review.create({
    data: {
      vendorId: vendor.id,
      userId: founder.id,
      rating: 5,
      comment: "Clear scope, fast incorporation support, and useful founder-specific guidance.",
      usedVendor: true,
    },
  });
  await prisma.helpfulVote.create({
    data: { reviewId: review.id, userId: founder.id, value: true },
  });
  await prisma.badge.create({
    data: { userId: founder.id, type: "reviewer", label: "Reviewer", icon: "R" },
  });
  await prisma.backlinkLog.create({
    data: {
      userId: founder.id,
      url: "https://example.com/mention",
      referringDomain: "example.com",
      targetUrl: "https://startup.example.com",
      status: "verified",
    },
  });

  const summary = await getFounderImpactSummary(founder.id);

  assert.equal(summary.reviewCount, 1);
  assert.equal(summary.helpfulVoteCount, 1);
  assert.equal(summary.contributionSignalCount, 1);
  assert.equal(summary.profileViewCount, 7);
  assert.equal(summary.verifiedBacklinkCount, 1);

  await prisma.helpfulVote.deleteMany({ where: { reviewId: review.id } });
  await prisma.badge.deleteMany({ where: { userId: founder.id } });
  await prisma.backlinkLog.deleteMany({ where: { userId: founder.id } });
  await prisma.review.deleteMany({ where: { vendorId: vendor.id } });
  await prisma.vendor.deleteMany({ where: { id: vendor.id } });
  await prisma.user.deleteMany({ where: { id: founder.id } });
  await prisma.cohort.deleteMany({ where: { id: cohort.id } });
});

test("getCohortImpactSummary aggregates cohort activity without review text", async () => {
  const cohort = await prisma.cohort.create({
    data: { name: `Cohort Impact ${suffix}`, slug: `cohort-impact-${suffix}` },
  });
  const founder = await prisma.user.create({
    data: {
      email: `cohort-impact-founder-${suffix}@example.com`,
      name: "Cohort Impact Founder",
      cohortId: cohort.id,
    },
  });
  const vendor = await prisma.vendor.create({
    data: { name: `Cohort Impact Vendor ${suffix}`, category: "Finance", cohortId: cohort.id },
  });
  const review = await prisma.review.create({
    data: {
      vendorId: vendor.id,
      userId: founder.id,
      rating: 4,
      comment: "Reliable close process and clear migration planning for finance workflows.",
      usedVendor: true,
    },
  });

  const summary = await getCohortImpactSummary(cohort.id);

  assert.equal(summary.founderCount, 1);
  assert.equal(summary.activeContributorCount, 1);
  assert.equal(summary.reviewCount, 1);
  assert.equal("comment" in summary.topContributors[0], false);

  await prisma.review.deleteMany({ where: { id: review.id } });
  await prisma.vendor.deleteMany({ where: { id: vendor.id } });
  await prisma.user.deleteMany({ where: { id: founder.id } });
  await prisma.cohort.deleteMany({ where: { id: cohort.id } });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
node --test --test-concurrency=1 src/lib/impact.test.ts
```

Expected: fail with `Cannot find module './impact.ts'`.

- [ ] **Step 3: Implement the impact summary library**

Create `src/lib/impact.ts`:

```ts
import { prisma } from "./prisma.ts";
import { getLeaderboard } from "./leaderboard.ts";

export type FounderImpactSummary = {
  reviewCount: number;
  helpfulVoteCount: number;
  contributionSignalCount: number;
  profileViewCount: number;
  verifiedBacklinkCount: number;
};

export type CohortImpactContributor = {
  userId: string;
  name: string | null;
  email: string;
  reviewCount: number;
  contributionSignalCount: number;
  helpfulVoteCount: number;
};

export type CohortImpactSummary = {
  founderCount: number;
  activeContributorCount: number;
  reviewCount: number;
  helpfulVoteCount: number;
  contributionSignalCount: number;
  topContributors: CohortImpactContributor[];
};

export async function getFounderImpactSummary(userId: string): Promise<FounderImpactSummary> {
  const [user, reviewIds, contributionSignalCount, verifiedBacklinkCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { profileViewCount: true },
    }),
    prisma.review.findMany({
      where: { userId },
      select: { id: true },
    }),
    prisma.badge.count({ where: { userId } }),
    prisma.backlinkLog.count({ where: { userId, status: "verified" } }),
  ]);

  const helpfulVoteCount = await prisma.helpfulVote.count({
    where: { reviewId: { in: reviewIds.map((review) => review.id) }, value: true },
  });

  return {
    reviewCount: reviewIds.length,
    helpfulVoteCount,
    contributionSignalCount,
    profileViewCount: user?.profileViewCount ?? 0,
    verifiedBacklinkCount,
  };
}

export async function getCohortImpactSummary(cohortId: string): Promise<CohortImpactSummary> {
  const entries = await getLeaderboard(cohortId);
  const reviewIds = await prisma.review.findMany({
    where: { vendor: { cohortId } },
    select: { id: true, userId: true },
  });

  const helpfulVoteCount = await prisma.helpfulVote.count({
    where: { reviewId: { in: reviewIds.map((review) => review.id) }, value: true },
  });
  const helpfulVotesByReview = await prisma.helpfulVote.groupBy({
    by: ["reviewId"],
    where: { reviewId: { in: reviewIds.map((review) => review.id) }, value: true },
    _count: { _all: true },
  });
  const reviewOwnerById = new Map(reviewIds.map((review) => [review.id, review.userId]));
  const helpfulVotesByUserId = new Map<string, number>();
  for (const voteGroup of helpfulVotesByReview) {
    const ownerId = reviewOwnerById.get(voteGroup.reviewId);
    if (!ownerId) continue;
    helpfulVotesByUserId.set(
      ownerId,
      (helpfulVotesByUserId.get(ownerId) ?? 0) + voteGroup._count._all,
    );
  }

  const contributionSignalCount = entries.reduce((sum, entry) => sum + entry.badgeCount, 0);
  const activeContributorCount = entries.filter(
    (entry) => entry.reviewCount > 0 || entry.badgeCount > 0,
  ).length;

  return {
    founderCount: entries.length,
    activeContributorCount,
    reviewCount: reviewIds.length,
    helpfulVoteCount,
    contributionSignalCount,
    topContributors: entries.slice(0, 8).map((entry) => ({
      userId: entry.userId,
      name: entry.name,
      email: entry.email,
      reviewCount: entry.reviewCount,
      contributionSignalCount: entry.badgeCount,
      helpfulVoteCount: helpfulVotesByUserId.get(entry.userId) ?? 0,
    })),
  };
}
```

- [ ] **Step 4: Run the impact tests**

Run:

```bash
node --test --test-concurrency=1 src/lib/impact.test.ts
```

Expected: both tests pass.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/lib/impact.ts src/lib/impact.test.ts
git commit -m "add impact summary metrics"
```

## Task 2: Upgrade Grow to Personal Impact

**Files:**
- Modify: `src/app/grow/page.tsx`

- [ ] **Step 1: Update Grow data loading**

Replace the direct `reviewCount`, `badgeCount`, `backlinkCount`, and `helpfulVoteCount` calls with `getFounderImpactSummary(founder.id)`. Keep `getBacklinkSnapshots()` and `getFounderReferralStats()` because they feed existing chart/referral UI.

Code shape:

```ts
import { getFounderImpactSummary } from "@/lib/impact";

const [impact, snapshots, referralStats] = await Promise.all([
  getFounderImpactSummary(founder.id),
  getBacklinkSnapshots(founder.id),
  getFounderReferralStats(founder.id),
]);
```

- [ ] **Step 2: Replace metric cards**

Show these labels in order:

```ts
<MetricCard label="Reviews shared" value={impact.reviewCount} />
<MetricCard label="Helpful votes received" value={impact.helpfulVoteCount} />
<MetricCard label="Profile views" value={impact.profileViewCount} />
<MetricCard label="Verified backlinks" value={impact.verifiedBacklinkCount} />
```

- [ ] **Step 3: Tighten the Impact section**

Use existing card styling. The visible rows should be:

```tsx
<ImpactRow label="Vendors evaluated" value={impact.reviewCount} />
<ImpactRow label="Founders helped" value={impact.helpfulVoteCount} />
<ImpactRow label="Contribution signals" value={impact.contributionSignalCount} />
<ImpactRow label="Verified backlinks" value={impact.verifiedBacklinkCount} />
```

Keep the streak row only when `streak > 0`.

- [ ] **Step 4: Run verification**

Run:

```bash
npm run lint
npm run build
```

Expected: both pass.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/app/grow/page.tsx
git commit -m "show personal impact on grow"
```

## Task 3: Turn Leaderboard Into Cohort Contribution Dashboard

**Files:**
- Modify: `src/app/leaderboard/page.tsx`

- [ ] **Step 1: Load cohort impact summary**

Import and call:

```ts
import { getCohortImpactSummary } from "@/lib/impact";

const impact = await getCohortImpactSummary(founder.cohortId);
```

Keep `getLeaderboard(founder.cohortId)` only if the contributor list still needs internal ordering from points.

- [ ] **Step 2: Replace score metrics**

Use aggregate impact metrics:

```ts
const metrics = [
  { label: "Founders in cohort", value: impact.founderCount },
  { label: "Active contributors", value: impact.activeContributorCount },
  { label: "Reviews shared", value: impact.reviewCount },
  { label: "Helpful votes", value: impact.helpfulVoteCount },
];
```

Do not render `totalPoints`, `points`, or `signal` as visible table values.

- [ ] **Step 3: Replace the ranking panel**

Rename the table section to `Contributor patterns`. Each row should show:

```tsx
<p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
  Contributor
</p>
<p className="font-semibold">{entry.name ?? entry.email}</p>
<p className="mt-1 text-sm text-[var(--muted)]">
  {entry.reviewCount} reviews | {entry.badgeCount} contribution signals
</p>
```

Do not show numeric position unless it is introduced as "ordered by contribution activity" in helper copy.

- [ ] **Step 4: Adjust helper cards**

Use these three cards:

- `How this view works`: "This private view summarizes cohort participation. Ordering uses contribution activity, but point totals stay internal."
- `What to do next`: keep the existing vendor review/request/nomination action language.
- `Privacy note`: keep the existing cohort-scoped privacy language.

- [ ] **Step 5: Run verification**

Run:

```bash
npm run lint
npm run build
```

Expected: both pass.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/app/leaderboard/page.tsx
git commit -m "demote leaderboard scores"
```

## Task 4: Make Rewards a Contribution Explanation Page

**Files:**
- Modify: `src/app/rewards/page.tsx`

- [ ] **Step 1: Remove visible rank emphasis**

Keep `getFounderPoints()` only if needed for existing breakdown values. Remove the visible line:

```tsx
Contribution position: #{rank.rank} of {rank.total}
```

Do not import `getFounderCohortRank()` after this page stops rendering position.

- [ ] **Step 2: Use contribution explanations**

The three rule cards should be:

```ts
const RULES = [
  { action: "Share a useful review", description: "Specific details, outcomes, numbers, and firsthand context make a review easier to trust." },
  { action: "Receive a contribution signal", description: "Badges and nominations add context about the kind of help you have provided." },
  { action: "Help peers decide", description: "Helpful votes show that other founders used your contribution to evaluate a vendor." },
];
```

- [ ] **Step 3: Rename the breakdown section**

Change `Contribution breakdown` to `What feeds your credibility`. Keep values for now, but label them:

```tsx
<BreakdownRow label="Review detail" value={points.breakdown.reviews} />
<BreakdownRow label="Contribution signals" value={points.breakdown.badges} />
<BreakdownRow label="Peer validation" value={points.breakdown.helpfulVotes} />
```

The values are still internal point components, but the UI should not call them points.

- [ ] **Step 4: Run verification**

Run:

```bash
npm run lint
npm run build
```

Expected: both pass.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/app/rewards/page.tsx
git commit -m "explain contribution credibility"
```

## Task 5: Browser Smoke Test and Documentation Update

**Files:**
- Modify: `plans/gamification-rethink.md`
- Modify: `plans/README.md`

- [ ] **Step 1: Run full verification**

Run:

```bash
npm run lint
npm run build
npm test
```

Expected: lint passes, build passes, and all tests pass.

- [ ] **Step 2: Start the local server**

Run:

```bash
npm run dev
```

Expected: Next.js reports `Local: http://localhost:3000`.

- [ ] **Step 3: Smoke test authenticated pages**

Sign in with:

```text
maya@example.com / password
```

Check these pages:

- `/grow`: shows "Reviews shared", "Helpful votes received", and "Verified backlinks".
- `/rewards`: shows "What feeds your credibility" and does not show "Contribution position".
- `/leaderboard`: shows cohort contribution metrics and does not show visible point totals.

- [ ] **Step 4: Update plan status**

In `plans/gamification-rethink.md`, add that the executable impact dashboard slice is implemented if Tasks 1-4 are complete. If any task is deferred, name the exact deferred task.

In `plans/README.md`, update `impact-dashboard-implementation.md` from "Ready to execute" to "Implemented" only when all code tasks are complete.

- [ ] **Step 5: Commit docs**

Run:

```bash
git add plans/gamification-rethink.md plans/README.md
git commit -m "document impact dashboard completion"
```

## Acceptance Criteria

- `/grow` leads with personal impact metrics rather than points, rank, or reputation.
- `/leaderboard` remains accessible but no longer displays point totals as a user-facing score.
- `/rewards` explains credibility ingredients without showing cohort rank.
- Existing reputation export/import and credibility API behavior keep point totals for compatibility.
- No private review text or request text is introduced into public or cross-cohort surfaces.
- `npm run lint`, `npm run build`, and `npm test` pass before final commit.
