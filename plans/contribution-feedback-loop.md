# Contribution Feedback Loop Plan

## Status

Slice A+B implemented. `getContributionFeedback()` exists, tests cover recent feedback summary behavior, and `/grow` now includes a "Recent contribution impact" recap.

Remaining work is limited to later UX slices:

- Slice C: notification copy and links
- Slice D: weekly digest language

Do not implement these later slices as a broad rewrite. Write a short implementation plan before code changes.

This follows the completed impact dashboard work. The dashboard now shows what a founder has contributed; this plan defines how the product should tell the founder when that contribution mattered.

## Goal

Create a coherent "your contribution mattered" loop across Grow, notifications, activity, and weekly digest.

The founder-facing question:

> What happened because I shared useful vendor knowledge?

## Why This Matters

The current product has the raw feedback signals:

- helpful votes on reviews
- activity events
- notifications
- weekly digest emails
- incoming targeted vendor questions
- badge awards
- impact metrics on `/grow`

The first feedback surface now exists on `/grow`, but notification and digest copy still need to be aligned with the same outcome-oriented language.

This matters because the core loop is:

1. Founder writes a useful review.
2. Another founder uses it, reacts to it, or asks for more detail.
3. The original founder sees that their contribution helped.
4. The founder is more likely to contribute again.

## Design Direction

Recommended approach: **lightweight feedback moments**, not a new dashboard.

Use existing surfaces:

- `/grow`: personal impact recap and next meaningful action (implemented)
- Notifications: immediate "your review helped" moments (deferred)
- Activity: cohort-visible contribution movement
- Weekly digest: slower summary of impact over the week (deferred)

Avoid adding a new top-level route for this pass.

## Product Principles

- Show outcomes, not game mechanics.
- Prefer "helped founders evaluate vendors" over "earned points."
- Keep feedback specific enough to feel real, but privacy-safe.
- Do not reveal private founder identities unless the existing cohort-scoped surface already allows it.
- Avoid nagging. Feedback should feel like evidence of usefulness, not a chore list.
- Keep badges secondary; they can support the loop, but should not become the loop.

## Feedback Signals

### Strong Signals

Use these first:

- A review receives a helpful vote.
- A founder asks a targeted follow-up about a vendor the user reviewed.
- A review answers or helps fulfill an open request.
- A founder earns a contribution signal from a meaningful action.

### Medium Signals

Use in summaries, not urgent notifications:

- Profile views increase.
- Verified backlinks increase.
- Cohort review count increases.
- Sprint participation changes.

### Weak Signals

Avoid treating these as celebration moments:

- Raw point changes.
- Rank/order changes.
- Badge count alone, unless the badge has clear context.

## Proposed UX Surfaces

### 1. Grow: Impact Recap

Implemented: `/grow` now includes a compact "Recent contribution impact" section.

Examples:

- "2 founders marked your vendor reviews helpful this week."
- "Your review of Northstar Startup Counsel helped answer an open Legal request."
- "Your cohort added 6 new reviews this sprint."

Empty state:

- "Write a detailed vendor review to start building visible impact."

Data source:

- `src/lib/contribution-feedback.ts`
- The first implementation tracks recent helpful votes, targeted requests, recent reviews, cohort activity count, and a suggested next action.

### 2. Notifications: Immediate Feedback

Current notification type `helpful_vote` already exists. Tighten the product intent:

- Trigger when a founder receives a helpful vote.
- Link to the vendor or review context when available.
- Use copy like "Your review helped another founder evaluate a vendor."

Do not notify on every low-value event if this becomes noisy. If needed later, batch helpful-vote notifications.

### 3. Activity: Cohort Movement

Current activity type `helpful_vote_received` already exists.

Use cohort activity for aggregate movement:

- "A review was marked helpful."
- "A founder answered a vendor request."
- "A founder completed a guest post exchange."

Keep activity less personal than notifications, because it is cohort-visible.

### 4. Weekly Digest: Slow Feedback

Update digest language from raw stats toward contribution outcomes.

Examples:

- "Your reviews received 3 helpful votes this week."
- "2 founders asked for details on vendors you know."
- "Your cohort added 12 reviews and 4 helpful votes."

Keep suggested next steps, but make them outcome-based:

- "Answer the open founder question to help someone choose a vendor."
- "Add a review where your cohort has low coverage."

### 5. Review Submit Celebration

Keep the existing review celebration toast, but ensure it does not over-emphasize points.

Preferred message direction:

- "Review shared. This gives your cohort one more data point."
- "Detailed review saved. Other founders can now use it when comparing vendors."

## Implementation Slices

### Slice A: Impact Event Summary Library

Implemented in `src/lib/contribution-feedback.ts`.

Inputs:

- `userId`
- optional date window, defaulting to seven days

Output:

- helpful votes received during window
- targeted vendor questions during window
- reviews written during window
- cohort activity count during window
- short suggested next action

Tests:

- helpful votes count only votes on the founder's reviews
- targeted questions count only requests assigned to the founder
- other cohorts are excluded
- private review text is not returned

### Slice B: Grow Feedback Recap

Implemented in `/grow`.

Implemented section:

- heading: "Recent contribution impact"
- one to three outcome rows
- a privacy-safe empty state

The whole page was not redesigned.

### Slice C: Notification Copy And Links

Audit helpful-vote and request notifications.

Update copy to match the feedback model.

Add tests only where notification creation logic changes.

### Slice D: Digest Language

Update `generateDigestForFounder()` and digest email copy.

Keep HTML simple and compatible with email clients.

Do not add a new email template system.

## Non-Goals

- No new gamification point rules.
- No public exposure of private review text.
- No new top-level route.
- No full notification preference center.
- No AI-generated summaries.
- No badge taxonomy rewrite.
- No credit-scoring or credibility-factor work.

## Acceptance Criteria

- Founder can see recent contribution outcomes on `/grow`.
- Helpful-vote feedback copy explains impact, not points.
- Weekly digest summarizes outcomes, not only raw activity.
- Cohort/private boundaries remain intact.
- Existing impact dashboard behavior remains unchanged.
- Lint, build, and tests pass.

## Handoff Guidance

Another agent should not re-run Slice A+B. They are already implemented.

Recommended next scope:

1. Write a short implementation plan for Slice C only: notification copy and links.
2. Keep helpful-vote and request feedback privacy-safe.
3. Add tests only where notification creation behavior changes.
4. Verify with `npm run lint`, `npm run build`, and focused tests.

Slice D, weekly digest language, should wait until Slice C is reviewed.
