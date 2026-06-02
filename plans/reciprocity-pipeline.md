# Reciprocity Pipeline: Platform ↔ Founder

From `docs/product.md`, the platform's asymmetric advantage is a bilateral exchange. The current implementation delivers the core cohort/private-review loop, public profiles, badges, auto-badge computation, backlinks/GSC, notifications, activity, reputation export/import, public vendor review JSON-LD, founder credibility reports, and the Write/Connect/Grow hubs. The remaining gaps are mostly governed portability, network effects, and impact-over-points product refinement.

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
| Public vendor structured data | `Product`, `AggregateRating`, and public consumer `Review` JSON-LD on `/vendors/[vendorId]` |
| Founder credibility report | `/founder/[slug]/credibility`, `/api/credibility/[slug]`, and Grow hub CTA |

### ❌ Not Delivered

**1. Governed reputation portability — Done ✅**
- JWT export and import exist, and imported packets are stored
- Admin approval queue with approve/reject actions
- Trust policy selector per import (all, badges_only, points_only)
- Admin notification on pending import; founder notification on approve/reject
- **Remaining:** Public-key based cross-instance verification (currently shared-secret only)

### 🟡 Partial

| Promise | Status | Gap |
|---------|--------|-----|
| SEO benefit for founder's startup | Backlink tracker + `/seo` page exists; founder `Person` JSON-LD and public vendor review JSON-LD exist | Richer founder/startup structured fields and Q&A schema are optional refinements |

## Founder → Platform

### ✅ Delivered

| Promise | Implementation |
|---------|---------------|
| High-quality named reviews | Named, verified, cohort-scoped with quality scores |
| Trust signals | `usedVendor`, `workType`, `disclosedIncentive`, quality % badges |
| Engagement | Reviews, sprints, helpful votes, guest post exchanges, notifications, cohort activity |

### ❌ Not Delivered

**2. Network effects**
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
| Auto-badges for achievement | Compute engine running on review submit, profile update, and cron | Computable badges now auto-award with notifications |
| Rewards for contribution | Celebration toast + impact UX on grow/rewards pages | Points/tiers don't unlock anything (by design — impact over points) |

## Full Implementation Roadmap

### Phase 1: Close the Public Structured Data Gap - Mostly Complete
The highest-leverage missing piece has been completed for public vendor reviews. Remaining structured data work is optional or depends on new public surfaces.

- [x] Public review JSON-LD on `/vendors/[vendorId]` (Product + AggregateRating + Review from public consumer reviews)
- [x] Profile JSON-LD on `/founder/[slug]` (Person with affiliation/memberOf fields)
- [ ] Q&A schema only if public Q&A/request pages are created

### Phase 2: Govern the Portability Layer (~4-6h) ✅
Founders can already export and import reputation packets. Admin approval queue and trust policy are now implemented. Cross-instance verification via public keys remains deferred (still shared-secret only).

- [x] Reputation export API
- [x] Reputation import API (accepts signed JWT, validates, records packet)
- [x] Import/export UI in profile settings
- [x] Import UI on `/grow`
- [x] Admin approval queue for imports
- [x] Trust policy per import (all, badges_only, points_only)
- [ ] Cross-instance verification (public key) — deferred; shared-secret in place

### Phase 3: Close the Network Effects Gap (~6-10h)
The platform needs alumni participation to keep the directory current and expand coverage.

- [ ] Alumni role with read-only + limited write access
- [ ] Cross-cohort vendor recommendations
- [ ] Public cohort aggregate pages
- [ ] Invite/referral system

### Phase 4: Close the Auto-Badge Gap ✅
Computable badge types now auto-award without admin intervention. Run on review submit, profile update, and daily cron.

- [x] Badge compute engine (runs on review submit, profile update, and cron)
- [x] Triggers for: `reviewer`, `profile_complete`, `verified`, `quality_reviewer`, `detailed_reviewer`, `balanced_reviewer`, `trusted_reviewer`, `top_contributor`
- [x] Notification on auto-badge award

## Effort Summary

| Phase | Effort | Impact | Dependencies |
|-------|--------|--------|-------------|
| 1. Public structured data | Mostly done | High (unlocks structured public review data) | Optional refinements only |
| 2. Reputation portability governance | ✅ Done | Export/import baseline already built |
| 3. Network effects | ~6-10h | Medium-high (growth) | Alumni role needs schema change |
| 4. Auto-badges | ✅ Done | Badge definitions existed |

Now fully delivered: Phase 1 (structured data), Phase 2 (portability governance), Phase 4 (auto-badges).
Remaining: ~6-10h for Phase 3 (network effects).
