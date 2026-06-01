# Reciprocity Pipeline: Platform ↔ Founder

From `doc/platform.md`, the platform's asymmetric advantage is a bilateral exchange. Currently only ~60% of the promise is delivered.

## Platform → Founder

### ✅ Delivered

| Promise | Implementation |
|---------|---------------|
| Verified cohort status | `User.role = "founder"` + cohort membership, shown on reviews |
| Earned badges on public profiles | `/founder/[slug]` page + `/badges` page + SVG badge API |
| Backlink potential | Backlink tracker with status verification, GSC integration |
| Points + leaderboard rank | `getFounderPoints()`, `/grow` page, `/leaderboard` |

### ❌ Not Delivered

**1. Schema.org structured data (Person, Organization, Review)**
- No JSON-LD on any page
- AI crawlers can't reliably identify review content as structured data
- **Plan:** `plans/ai-seo-geo-reviews.md` — Review JSON-LD on vendor pages + Profile JSON-LD on founder pages + llms.txt
- **Effort:** ~1.5h for 80% value (vendor + profile JSON-LD)

**2. Portable reputation across incubator instances**
- JWT export exists (`/api/reputation/export`) but no import mechanism on other instances
- A founder moving from Incubator A to Incubator B has no way to carry their reviews, badges, or points
- **Plan:** Not scoped yet
- **What it would require:**
  - Reputation import API endpoint that accepts a signed JWT from another instance
  - Matching logic (email-based or manual approval)
  - Configurable trust: import everything vs. import only badges/points vs. import only verified reviews
  - Admin approval queue for reputation imports
  - Import UI on the Grow hub ("Import reputation from another cohort")
- **Effort:** ~4h for basic import flow, ~8h with admin review queue

### 🟡 Partial

| Promise | Status | Gap |
|---------|--------|-----|
| SEO benefit for founder's startup | Backlink tracker + `/seo` page exists | No structured data that directly links founder → startup in AI-crawlable format |

## Founder → Platform

### ✅ Delivered

| Promise | Implementation |
|---------|---------------|
| High-quality named reviews | Named, verified, cohort-scoped with quality scores |
| Trust signals | `usedVendor`, `workType`, `disclosedIncentive`, quality % badges |
| Engagement | Reviews, sprints, helpful votes, guest post exchanges |

### ❌ Not Delivered

**3. Network effects**
- Currently siloed per cohort — no cross-cohort discovery or interaction
- An alumni founder can't participate or endorse vendors
- No mechanism for network growth (no referral loops, no cohort-to-cohort recommendations)
- **Plan:** Not scoped yet
- **What it would require:**
  - Alumni role (separate from "founder") with read-only access or limited write access
  - Cross-cohort vendor recommendations ("Founders in Summer 2025 also liked...")
  - Invite/referral system for founders to bring other cohorts in
  - Public cohort pages with aggregate stats
- **Effort:** ~6-10h for basic alumni participation, more for full cross-cohort features

### 🟡 Partial

| Promise | Status | Gap |
|---------|--------|-----|
| Auto-badges for achievement | Manual/admin-only | No compute engine for `computable: true` badges |
| Rewards for contribution | Celebration toast only | Points/tiers don't unlock anything |

## Full Implementation Roadmap

### Phase 1: Close the Schema Gap (~1.5h)
The highest-leverage missing piece. Without Schema.org, the platform can't deliver on its core SEO promise to founders.

- [ ] Review JSON-LD on `/vendors/[vendorId]` (Product + AggregateRating + Review)
- [ ] Profile JSON-LD on `/founder/[slug]` (Person + memberOf + knowsAbout)
- [ ] llms.txt for AI crawl efficiency

### Phase 2: Close the Portability Gap (~4-8h)
Founders need to carry reputation between cohorts/instances. This is the platform's defensibility — once reputation is portable, switching costs increase.

- [ ] Reputation import API (accepts signed JWT, validates)
- [ ] Admin approval queue for imports
- [ ] Import UI on `/grow`
- [ ] Cross-instance verification (shared secret or public key)

### Phase 3: Close the Network Effects Gap (~6-10h)
The platform needs alumni participation to keep the directory current and expand coverage.

- [ ] Alumni role with read-only + limited write access
- [ ] Cross-cohort vendor recommendations
- [ ] Public cohort aggregate pages
- [ ] Invite/referral system

### Phase 4: Close the Auto-Badge Gap (~3h)
Computable badge types should auto-award without admin intervention.

- [ ] Badge compute engine (runs on review submit, profile update, and cron)
- [ ] Triggers for: `reviewer`, `profile_complete`, `verified`, `quality_reviewer`, `detailed_reviewer`, `balanced_reviewer`, `trusted_reviewer`, `top_contributor`
- [ ] Notification on auto-badge award

## Effort Summary

| Phase | Effort | Impact | Dependencies |
|-------|--------|--------|-------------|
| 1. Schema.org | ~1.5h | High (unlocks SEO promise) | None |
| 2. Reputation portability | ~4-8h | High (defensibility) | JWT export already built |
| 3. Network effects | ~6-10h | Medium-high (growth) | Alumni role needs schema change |
| 4. Auto-badges | ~3h | Medium (engagement) | Badge definitions exist |

Total: ~14.5-22.5h to fully deliver the reciprocity promise in `doc/platform.md`.
