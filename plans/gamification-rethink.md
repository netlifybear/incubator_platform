# Gamification Rethink: Impact Over Points

## Current State

The platform has gamification scaffolding but no real game loop:

- **Points**: Computed per review + helpful votes + badges, displayed on /grow, feeds leaderboard rank. Not consumed by anything.
- **Tiers**: `computeTierProgress()` converts points into Bronze/Silver/Gold/Platinum with a progress bar. Visual only — no unlocks, no rewards, no perks. The tier descriptions promise features (custom slug, featured highlight, share buttons, early-access badge) that don't exist.
- **Badges**: Awarded manually by admins, vendors, investors, or via nominations. The `computable` flag exists on several badge types, but there is no runtime engine to auto-award them from behavior.
- **Leaderboard**: Rank-only. No reward for top positions.
- **Streak**: `computeReviewStreak()` exists but just returns 0 or 1 — no streak milestones, no rewards.
- **Activity/notifications**: Newer activity and notification primitives make impact feedback easier to show, but the main points/tier UI still presents contribution as a score chase.

The result: a points system that feels hollow because points don't unlock anything, and badges that feel mostly manual because computable badges are defined but not yet awarded by an engine.

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
