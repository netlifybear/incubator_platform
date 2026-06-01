# Gamification Rethink: Impact Over Points

## Status

Basic impact-over-points changes have been applied to `/grow`, `/rewards`, and `/leaderboard`. Computable badges now auto-award through the badge computation engine on review submit, profile update, and the badge cron route.

Remaining work is product/UX design rather than a direct implementation queue:

- Decide how far to demote or replace the leaderboard.
- Shape a fuller impact dashboard with meaningful cohort and personal feedback.
- Convert badges from achievement framing toward contribution context where appropriate.
- Decide whether points remain visible anywhere or only power internal ordering/export signals.

## Current State

The platform has gamification scaffolding and an initial impact-oriented pass, but still no fully designed game loop:

- **Points**: Computed per review + helpful votes + badges, still feeds leaderboard rank and reputation export, but is no longer the primary /grow or /rewards narrative.
- **Tiers**: `computeTierProgress()` still exists for legacy logic/tests, but tier progress is no longer the main /grow or /rewards surface. Tier titles remain cosmetic and do not unlock features.
- **Badges**: Awarded by admins, vendors, investors, nominations, and the auto-badge compute engine for computable badge types.
- **Leaderboard**: Still rank-oriented, but copy now frames it as cohort contribution and participation patterns.
- **Streak**: `computeReviewStreak()` exists but just returns 0 or 1 — no streak milestones, no rewards.
- **Activity/notifications**: Auto-badge awards create notifications and activity events. Broader "your contribution mattered" feedback still needs design.

The result: the most confusing points/tier surfaces have been softened, but the product still needs a coherent impact model so the remaining leaderboard, points, badges, and streak concepts feel intentional.

## Reframe: Review Credibility, Not Reputation

The core question the platform answers: **"Can I trust this founder's review?"**

The three hubs already map to a credibility pipeline:

| Hub | Signal | What it measures |
|-----|--------|-----------------|
| **Write** | Experience + Detail | Did they use the vendor? Is the review substantive? (quality score %, `usedVendor` flag, work type) |
| **Connect** | Social Proof | Did peers find it helpful? (helpful vote ratio, exchange activity, community engagement) |
| **Grow** | Track Record | Aggregate credibility summary (review count, streak, badge types, helpfulness %) |

### Naming

"Reputation" is vague — it implies general social standing. More precise options:

| Term | Vibe | Fit |
|------|------|-----|
| **Credibility** | Professional, B2B | "How credible is this review?" — matches the use case |
| **Cred** | Short, informal | Colloquial shorthand for credibility |
| **Trust signal** | Clinical, data-y | Describes what it is — a signal, not a score |
| **Weight** | Simple, intuitive | "This review carries more weight because..." |
| **Standing** | Formal, community | "Good standing in the cohort" |

### Gap

The current messaging frames this as "earning points" rather than "building credibility." The `/grow` page shows "Your reputation" but doesn't explicitly connect back to "here's why you should trust this founder's reviews" on vendor pages. The credibility signal exists in the data but isn't surfaced as the primary narrative.

## Inspiration: Slack's Anti-Gamification

Slack deliberately avoids points, badges, and leaderboards. Instead:

1. **Progressive discovery** — features surface as you use the product, not when you hit point thresholds
2. **Reputation is implicit** — your contributions speak for themselves (reactions, messages, presence)
3. **Impact transparency** — users see their feedback move through "Submitted → Planned → Shipped"

## Proposed Direction: Impact Over Points

Shift from "earn points to level up" to "your contribution had this effect":

### 1. Replace tier progress bar with impact dashboard

Instead of a points bar filling toward the next cosmetic tier, show:

- "Your review helped 3 founders evaluate vendors"
- "5 founders found your feedback helpful"
- "2 vendors were added based on requests you upvoted"
- "Your cohort wrote 12 reviews this sprint"

This makes the Write → Connect → Grow loop meaningfully visible.

### 2. Convert badges into contribution capsules

Badges become **metadata about contribution type**, not achievements:

- `reviewer` → "Has written reviews" (fact, not award)
- `early_adopter` → "Joined in the first cohort" (history)
- `connector` → "Has initiated exchanges" (behavior summary)

Drop the concept of "earning" badges. They're descriptive tags that help other founders evaluate context and credibility.

### 3. Kill the leaderboard (or demote it)

Public ranking incentivizes gaming and discourages new joiners. Replace with:

- Cohort-wide metrics ("Your cohort has 48 reviews this month")
- Personal trend ("You've written 2 more reviews than last month")
- Helpfulness ratio ("100% of your reviews were marked helpful")

### 4. Points become internal signal, not user-facing goal

Keep point computation for sorting/rank internally but remove the displayed score + progress bar on /grow. Surface impact metrics instead.

### 5. Retain what works

- **Celebration toast** on review submit (immediate feedback)
- **Quality score %** per review (improvement signal)
- **Sprint progress** (team accountability, deadline motivation)
- **Review streak** (but with milestones: 3-week streak → "consistent reviewer" badge upgrade)

## Open Questions

- How much of the existing leaderboard / points UI do we hide vs remove?
- Should the tier descriptions on /grow become impact metrics, or should the whole section be replaced?
- Does removing the points score hurt the reputation export JWT's value (it currently ships the point total as a signal)?
- Is there a middle ground: keep points for sorting but present impact as the primary narrative?
- Should notifications/activity become the primary "your contribution mattered" surface, instead of adding more reward mechanics?
