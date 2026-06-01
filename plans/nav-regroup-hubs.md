# Nav regroup: 3 story-based hubs

## Goal

Replace the feature-grouped sidebar (Core / Reputation / Growth) with three story-based entry points that answer "what do I want to do?", not "what feature category does this belong to?"

## Status

Implemented. The sidebar now uses Write, Connect, Grow, and an admin-only Admin link. `/connect` and `/grow` exist, and the prior feature routes still work at their existing URLs.

## Sidebar change

**Before (4 groups, 13 links):**

```
Core:        Dashboard | Vendors | Top vendors | Requests
Reputation:  Leaderboard | Badges | Rewards | Nominations | Profile
Growth:      Exchanges | Sprints | Analytics | SEO | Backlinks
Admin:       Admin requests
```

**After (3 main links + Admin):**

```
Write     →  /
Connect   →  /connect
Grow      →  /grow
Admin     →  /admin/requests   (admin only, unchanged)
```

Actual implementation points the admin link to `/admin`, with `/admin/requests` still available as a tab/page inside the admin area.

Every existing route still works at its current URL. Only the sidebar nav changed.

---

## Hub 1: Write (`/` — existing home page, enhanced)

**Purpose:** "Contribute to my cohort by reviewing vendors."

### Data to add to the existing home page

| What | Source | Where on page |
|------|--------|---------------|
| Active sprint progress | `getActiveSprint(cohortId)` | Hero section — "You're 2/3 reviews away from gold this sprint" |
| Review streak | `computeReviewStreak(user.lastReviewDate)` | Hero section, next to sprint progress |
| Your review count | Already loaded (`prisma.review.count`) | Metrics row (already there) |

### CTA change

Hero button changes from **"Browse vendors"** → **"Write a review"** linking to the full vendor directory at `/vendors`. Browse is implied by the vendor grid below.

### What stays unchanged

- Vendor directory grid with category filters
- VendorRequest form + cohort demand section
- Onboarding banner
- Right sidebar with profile card

---

## Hub 2: Connect (new page at `/connect`)

**Purpose:** "Ask my peers and answer their questions."

### Sections

| # | Section | Data source | Render logic |
|---|---------|-------------|--------------|
| 1 | **Incoming questions** | `listIncomingTargetedRequests(userId)` | Cards showing who asked, what vendor, message. "Answer" button opens the targeted request reply (links to vendor page). Shows count in metric card |
| 2 | **My open requests** | `listOpenVendorRequestsForCohort(user.cohortId)` | Same list as current `/requests` — category, description, status badge |
| 3 | **Exchanges** | `getMyExchanges(userId)` (guest post in/out) | Pending proposals, accept/decline actions |
| 4 | **Cohort members** | Link to `/founders` | Simple link card: "See all founders in your cohort" |

### Metric card (top)

```
unanswered count  |  open requests  |  pending exchanges
```

### CTA

Primary action in hero: **"Answer incoming questions"** (shown if count > 0) or **"Ask your cohort"** (if 0).

---

## Hub 3: Grow (new page at `/grow`)

**Purpose:** "Build my portable public reputation."

### Sections

| # | Section | Data source | Render logic |
|---|---------|-------------|--------------|
| 1 | **Profile card** | `getFounderPoints(userId)`, `computeTierProgress`, user settings | Name, tier badge, points, "Edit profile" link. Public profile toggle with view count |
| 2 | **Backlinks snapshot** | `getBacklinkSnapshots(userId)` | `BacklinkVelocityChart` (reused component) — small preview, "View all" → `/backlinks` |
| 3 | **Badges & streaks** | badge count + `computeReviewStreak` | Badge count, streak badge, `computeTierProgress` bar |
| 4 | **SEO checklist** | Same logic as digest banner — missing items | "Enable profile → Add backlinks → Export reputation" — inline action links |
| 5 | **Quick links** | Static list | Rewards detail, Leaderboard, Sprint history, Profile settings |

### Metric card (top)

```
total points  |  tier  |  profile views  |  verified backlinks
```

### CTA

Primary action in hero: **"Enable your public profile"** (if disabled) or **"View your public profile"** (if enabled, linking to `/founder/[slug]`).

---

## Files to create / modify

Status: completed.

### New files

| File | Purpose |
|------|---------|
| `src/app/connect/page.tsx` | Connect hub server component |
| `src/app/grow/page.tsx` | Grow hub server component |

### Modified files

| File | Change |
|------|--------|
| `src/app/components/app-shell.tsx` | Replace `coreLinks`, `reputationLinks`, `growthLinks` with 3 hub links + Admin |
| `src/app/page.tsx` | Add sprint progress + streak to hero, change CTA from "Browse vendors" to "Write a review" |

### No files deleted

All existing routes keep working at their current URLs. Only the sidebar nav changes.

---

## Implementation order

Status: completed.

1. `app-shell.tsx` — rewrite nav groups to 3 links
2. `page.tsx` — add sprint progress + streak to hero, change CTA
3. `app/connect/page.tsx` — new hub page
4. `app/grow/page.tsx` — new hub page

---

## Follow-up Questions

1. **Sprint progress on Write hub** — current implementation favors compact personal progress. Revisit only if the home hero needs cohort-level competition.

2. **Connect hub "Answer" action** — current implementation links into existing request/vendor workflows. Inline answers remain a future improvement.

3. **Grow hub SEO checklist** — current implementation uses live profile/backlink/GSC state. Next improvement should align this with any future impact-over-points redesign.
