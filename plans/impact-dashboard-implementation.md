# Impact Dashboard Implementation

## Status

Implemented. This file is now a compact implementation record, not an execution plan.

## Implemented

- Added `src/lib/impact.ts` with founder and cohort impact summary helpers.
- Added tests for impact aggregation and privacy-safe cohort summaries.
- Updated `/grow` to show personal impact metrics.
- Updated `/leaderboard` to act as a cohort contribution dashboard without visible point totals.
- Updated `/rewards` to show contribution ingredients instead of rank/progress mechanics.
- Kept point computation internal for ordering, reputation export/import, credibility APIs, and compatibility.

## Product Decisions Preserved

- Keep `/leaderboard` as the route for compatibility, but present it as a contribution view.
- Do not expose private founder review text, request text, admin data, or cross-cohort details.
- Use existing `Review`, `HelpfulVote`, `ContributionTag`, `BacklinkLog`, `User`, and invite/referral data.
- Avoid new database columns for this slice.

## Verification Record

The implementation should continue to be covered by:

- `node --test --test-concurrency=1 src/lib/impact.test.ts`
- `npm run lint`
- `npm run build`

## Follow-Ups

- Use `phase-a-credibility-factors.md` and `contribution-feedback-loop.md` as implemented references.
- Use `gamification-rethink.md` for future UX/product direction around streaks, Connect inline answering, Grow SEO alignment, and contribution language.
