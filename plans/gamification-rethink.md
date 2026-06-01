# Gamification Rethink: Impact Over Points

## Current State

The platform has gamification scaffolding but no real game loop:

- **Points**: Computed per review + helpful votes + badges, displayed on /grow, feeds leaderboard rank. Not consumed by anything.
- **Tiers**: `computeTierProgress()` converts points into Bronze/Silver/Gold/Platinum with a progress bar. Visual only — no unlocks, no rewards, no perks. The tier descriptions promise features (custom slug, featured highlight, share buttons, early-access badge) that don't exist.
- **Badges**: Awarded manually by admins, vendors, or via nominations. The `computable` flag on 6 badge types has no runtime engine to auto-award them. No badge is earned by actually doing anything.
- **Leaderboard**: Rank-only. No reward for top positions.
- **Streak**: `computeReviewStreak()` exists but just returns 0 or 1 — no streak milestones, no rewards.

The result: a points system that feels hollow because points don't unlock anything, and badges that feel absent because they require an admin to notice you.

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
