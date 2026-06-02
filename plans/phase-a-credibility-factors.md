# Phase A: Credibility Factor Explainability

**Status:** Ready to execute

## Goal

Surface the factors behind a founder's credibility signal with understandable labels, so founders know what to improve and peers know why recommendations carry weight.

## Naming Constraint

Zero "credit" terminology in file names, function names, types, UI copy, or code comments.

Implementation names:
- `src/lib/credibility-factors.ts`
- `computeCredibilityFactors(userId, opts?)`
- `CredibilityFactor`
- `CredibilityFactors`

## Key Correction

Do **not** use `Review.qualityScore`. That field does not exist.

Compute review quality from `reviewContributionPoints(review.comment)` at query time (imported from `src/lib/review-quality.ts`). The credibility page already uses this pattern — see `src/app/founder/[slug]/credibility/page.tsx:67-71`.

## File Map

| File | Action |
|------|--------|
| `src/lib/credibility-factors.ts` | Create — factor computation + thresholds |
| `src/lib/credibility-factors.test.ts` | Create — test factor computation |
| `src/app/grow/page.tsx` | Modify — add factor breakdown after Impact section |
| `src/app/founder/[slug]/credibility/page.tsx` | Modify — add public-safe factor summary after Review Credibility section |
| `plans/README.md` | Modify — add this plan to the execution table |

## Types

```ts
type FactorLabel = "strong" | "developing" | "needs activity";

type CredibilityFactor = {
  key: string;
  label: string;
  value: string | number;
  status: FactorLabel;
  description: string;
};

type CredibilityFactors = {
  factors: CredibilityFactor[];
  summary: FactorLabel;
  isThinFile: boolean;
};
```

## Overall Summary Logic

Map to numeric: `strong=3`, `developing=2`, `needs activity=1`.

- average >= 2.5 → `strong`
- average >= 1.5 → `developing`
- otherwise → `needs activity`

Thin-file override: if total review count is 0, summary is always `needs activity`.

## Factor Details

### Review quality
- label: `Review quality`
- data: `review.findMany({ userId }, { comment, createdAt })`
- value: avg `reviewContributionPoints(comment) / 20 * 100`
- private: `Your reviews average {score}% quality.`
- public: `Reviews show consistent quality.`
- status: >=80 strong, >=50 developing, else needs activity

### Helpful votes
- label: `Helpful votes`
- data: helpful votes on founder's reviews / review count
- private: `{ratio}x helpful votes per review from peers.`
- public: `Peers find the reviews helpful.`
- status: >=1.0 strong, >=0.5 developing, else needs activity
- edge: 0 reviews → 0 ratio → needs activity

### Contribution signals
- label: `Contribution signals`
- data: badge count via `getFounderImpactSummary()`
- private: `{count} contribution signals earned.`
- public: `Has contribution signals from badges.`
- status: >=3 strong, >=1 developing, else needs activity

### Review recency
- label: `Review recency`
- data: newest review `createdAt`
- private: `Last review was {time}.`
- public: **do not render** — reveals when founder was last active
- status: <=30d strong, <=90d developing, else needs activity
- edge: 0 reviews → needs activity

### Profile completeness
- label: `Profile completeness`
- data: `User.profileCompletePercentage`
- private: `Your profile is {score}% complete.`
- public: `Profile is substantially complete.`
- status: >=80 strong, >=50 developing, else needs activity

### Verified backlinks
- label: `Verified backlinks`
- data: verified `BacklinkLog` count via `getFounderImpactSummary()`
- private: `{count} verified backlinks pointing to your startup.`
- public: `Has verified external references.`
- status: >=3 strong, >=1 developing, else needs activity

## Private UI: `/grow`

Position after the Impact section, before the backlink velocity chart.

- heading: `Credibility factors`
- overall summary pill (colored) unless thin file
- one row per factor with status dot + description
- thin file → `Getting started. Write your first review to build your track record.`

## Public UI: `/founder/[slug]/credibility`

Position after the Review Credibility section, before Badge Proof.

Rules:
- no overall summary (avoids public single-score perception)
- no numeric factor values
- no review recency factor
- no private review text
- thin file → `This founder is building their track record. Check back after they share more reviews.`
- heading: `Why this founder's recommendations carry weight`

## Test Cases

| Test | Setup | Expectation |
|------|-------|-------------|
| All factors strong | 10 detailed reviews, 15 helpful votes, 5 badges, recent review, 90% profile, 4 backlinks | all strong, summary strong, isThinFile=false |
| Thin file | 0 reviews, no badges, no backlinks, 30% profile | summary needs activity, isThinFile=true |
| High badges, no reviews | 0 reviews, 5 badges, 50% profile | contributionSignals strong, summary needs activity |
| Mixed factors | 3 moderate reviews, 2 helpful votes, 1 badge, 45d recency, 70% profile, 2 backlinks | developing summary |
| Single review, zero helpful | 1 detailed review, 0 helpful votes, 80% profile, 0 backlinks | reviewQuality strong, helpfulVotes needs activity, summary developing |
| Very old last review | 5 detailed reviews, last review 200 days ago | reviewRecency needs activity |
| Boundary thin file | 1 review, no helpful votes, no badges, no backlinks | no thin-file override |

## Edge Cases

| Case | Behavior |
|------|----------|
| Zero reviews, zero badges, no backlinks | All review-derived factors needs activity; thin-file override |
| Single high-quality review | reviewQuality can be strong; summary cautious (sparse helpful votes/signals) |
| Many badges, zero reviews | contributionSignals strong; summary needs activity (thin-file override) |
| No reviews but backlinks exist | Summary needs activity; backlinks alone don't establish review credibility |
| Last review 180+ days ago | reviewRecency needs activity privately |
| One review, zero helpful votes | helpfulVotes needs activity; no thin-file override (reviewCount > 0) |

## Performance

`computeCredibilityFactors()` makes small Prisma queries (review comments + dates, user profile, badge count, backlink count, helpful vote count).

Acceptable on `/grow`. For public `/credibility`, use 60s in-memory TTL cache via `opts.useCache` (avoid repeated queries on page reloads).

## Verification

- `npm run lint` — clean
- `npm run build` — clean
- `node --test --test-concurrency=1 src/lib/credibility-factors.test.ts` — all pass
- `/grow` shows factor breakdown for signed-in founder
- `/founder/[slug]/credibility` shows public-safe factor summary
- Founder with 0 reviews sees getting-started / building-track-record copy
- Public page does not render review recency
- Public page does not render review text or numeric values
