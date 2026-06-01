# Reciprocity Pipeline: Platform ↔ Founder

From `docs/product.md`, the platform's asymmetric advantage is a bilateral exchange. The current implementation delivers the core cohort/private-review loop, public profiles, badges, backlinks/GSC, notifications, activity, reputation export/import, and the Write/Connect/Grow hubs. The remaining gaps are mostly public structured data, governed portability, network effects, and automatic badge computation.

## Platform → Founder

### ✅ Delivered

| Promise | Implementation |
|---------|---------------|
| Verified cohort status | `User.role = "founder"` + cohort membership, shown on reviews |
| Earned badges on public profiles | `/founder/[slug]` page + `/badges` page + SVG badge API |
| Backlink potential | Backlink tracker with status verification, GSC integration |
| Points + leaderboard rank | `getFounderPoints()`, `/grow` page, `/leaderboard` |
| Reputation portability baseline | `/api/reputation/export`, `/api/reputation/import`, `ReputationImport`, and profile settings import/export UI |
| Profile structured data | `Person` JSON-LD on `/founder/[slug]` |

### ❌ Not Delivered

**1. Public vendor structured data**
- Founder profile `Person` JSON-LD exists
- Public vendor pages still lack `Product`/`AggregateRating`/`Review` JSON-LD for public consumer reviews
- **Plan:** `plans/ai-seo-geo-reviews.md` — public review JSON-LD on vendor pages first; `llms.txt` is optional/experimental
- **Effort:** ~1h for vendor JSON-LD; ~30min optional for `llms.txt`

**2. Governed reputation portability**
- JWT export and import exist, and imported packets are stored
- Missing governance: imported reputation is accepted directly by the signed-in founder; there is no admin approval queue, trust policy, or cross-instance key rotation
- **Plan:** Needs a governance scope, not a first import implementation
- **What it would require:**
  - Admin approval queue for imported packets
  - Matching logic (email-based plus manual approval)
  - Configurable trust: import everything vs. import only badges/points vs. import only verified reviews
  - Cross-instance verification policy, ideally public-key based instead of shared-secret only
  - Optional import UI relocation from profile settings into the Grow hub
- **Effort:** ~4-6h for admin review queue and policy, more for public-key verification

### 🟡 Partial

| Promise | Status | Gap |
|---------|--------|-----|
| SEO benefit for founder's startup | Backlink tracker + `/seo` page exists; founder `Person` JSON-LD can include startup URL | Vendor review JSON-LD and richer founder/startup structured fields are still missing |

## Founder → Platform

### ✅ Delivered

| Promise | Implementation |
|---------|---------------|
| High-quality named reviews | Named, verified, cohort-scoped with quality scores |
| Trust signals | `usedVendor`, `workType`, `disclosedIncentive`, quality % badges |
| Engagement | Reviews, sprints, helpful votes, guest post exchanges, notifications, cohort activity |

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

### Phase 1: Close the Public Structured Data Gap (~1h)
The highest-leverage missing piece. Without Schema.org, the platform can't deliver on its core SEO promise to founders.

- [ ] Public review JSON-LD on `/vendors/[vendorId]` (Product + AggregateRating + Review from public consumer reviews)
- [x] Profile JSON-LD on `/founder/[slug]` (Person with affiliation/memberOf fields)
- [ ] Optional/experimental `llms.txt` after JSON-LD, only if it remains low-cost

### Phase 2: Govern the Portability Layer (~4-6h)
Founders can already export and import reputation packets. The next work is to make imported reputation trustworthy enough for admins and future investors.

- [x] Reputation export API
- [x] Reputation import API (accepts signed JWT, validates, records packet)
- [x] Import/export UI in profile settings
- [ ] Admin approval queue for imports
- [ ] Optional import UI on `/grow`
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
| 1. Public structured data | ~1h | High (unlocks structured public review data) | None |
| 2. Reputation portability governance | ~4-6h | High (defensibility) | Export/import baseline already built |
| 3. Network effects | ~6-10h | Medium-high (growth) | Alumni role needs schema change |
| 4. Auto-badges | ~3h | Medium (engagement) | Badge definitions exist |

Remaining total: ~14.5-20.5h to fully deliver the reciprocity promise in `docs/product.md`, depending on portability governance depth.
