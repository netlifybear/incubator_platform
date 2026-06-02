# Reciprocity Pipeline: Platform ↔ Founder

From `docs/product.md`, the platform's asymmetric advantage is a bilateral exchange. The current implementation delivers the core cohort/private-review loop, public profiles, badges, auto-badge computation, backlinks/GSC, notifications, activity, reputation export/import governance, public vendor review JSON-LD, founder credibility reports, cross-cohort vendor recommendations, first-pass alumni/invite/cohort network surfaces, and the Write/Connect/Grow hubs. The remaining gaps are mostly deeper network-effect product design, optional portability hardening, and impact-over-points product refinement.

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
| Governed reputation imports | `/admin/imports`, approve/reject flow, trust policy selector, notifications |

### 🟡 Partial

**1. Governed reputation portability**
- JWT export and import exist, and imported packets are stored
- Admin approval queue with approve/reject actions
- Trust policy selector per import (all, badges_only, points_only)
- Admin notification on pending import; founder notification on approve/reject
- Public-key endpoint exists when configured
- **Remaining:** Full public-key verification policy/key rotation across instances. Shared-secret verification remains the default path.

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

### 🟡 Partial

**2. Network effects**
- Alumni role exists with read-only restrictions.
- Founder invite/referral flow exists.
- Public cohort aggregate pages exist.
- Cross-cohort vendor recommendations are live using public-safe aggregate fields.
- **Remaining work:**
  - Deeper cross-cohort interaction only if product policy calls for it
  - Alumni write expansion beyond helpful votes only as a separate policy-backed task
- **Effort:** TBD by future product scope.

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
Founders can already export and import reputation packets. Admin approval queue and trust policy are now implemented. A public-key endpoint exists for configured instances; full cross-instance public-key verification policy/key rotation remains deferred.

- [x] Reputation export API
- [x] Reputation import API (accepts signed JWT, validates, records packet)
- [x] Import/export UI in profile settings
- [x] Import UI on `/grow`
- [x] Admin approval queue for imports
- [x] Trust policy per import (all, badges_only, points_only)
- [x] Public-key endpoint for configured instances
- [ ] Cross-instance public-key verification policy/key rotation — deferred; shared-secret in place

### Phase 3: Close the Network Effects Gap ✅
The network-effects first pass is live: alumni role/read-only access plus helpful voting, founder invite/referral flow, public cohort aggregate pages, and cross-cohort vendor discovery.

- [x] Alumni role with read-only access
- [x] Public cohort aggregate pages
- [x] Invite/referral system
- [x] Cross-cohort vendor recommendations
- [x] Alumni helpful voting policy

#### Phase 3A: Cross-Cohort Vendor Recommendation Signal ✅

Goal: add a small, verifiable recommendation signal without opening cross-cohort write access.

Scope:

- Add a read-only helper that finds vendors in other cohorts with matching category/name similarity and enough public-safe activity.
- Surface a compact "Other cohorts also use" or "Similar vendors across cohorts" section on vendor detail pages or cohort pages.
- Keep private founder review text hidden. Use aggregate counts, average rating, category, and public vendor identity only.
- Add tests for tenant boundaries: no founder review text, request text, admin data, or private cohort activity leaks.

Suggested files:

- `src/lib/vendors.ts` or a new `src/lib/cross-cohort-recommendations.ts`
- `src/app/vendors/[vendorId]/page.tsx`
- `src/app/cohorts/[slug]/page.tsx`

Delivered:

- Recommendations exclude the current cohort.
- Recommendations are deterministic and rank by public-safe aggregate signal.
- Recommendations require at least two reviews so one-off activity does not pollute cross-cohort discovery.
- Anonymous users see only public-safe fields.
- Existing vendor page tests/build still pass.

#### Phase 3B: Alumni Participation Rules ✅

Decision: alumni can cast helpful votes on cohort reviews, but cannot create reviews, vendor requests, exchanges, nominations, or invites.

Current state:

- Alumni can retain read-only access.
- Helpful voting is governed by `canVoteOnReview`.
- All broader cohort writes remain blocked by `canWriteToCohort`.

Rationale:

- Helpful votes improve content ranking without exposing private text or creating new vendor/review/request records.
- Broader alumni contribution needs a separate policy-backed task.

#### Phase 3C: Public Cohort Aggregate Refinements ✅

Delivered:

- Public cohort detail page has privacy thresholds for small cohorts.
- Cohort index suppresses small-cohort aggregate counts.
- Public cohort JSON-LD is gated behind the same threshold on cohort detail pages.

#### Phase 3D: Referral Loop Polish ✅

Delivered:

- Add admin-visible referral source counts.
- Add duplicate invite handling and clearer invite status copy.
- Add notification/activity events when an invited founder accepts.

### Phase 4: Close the Auto-Badge Gap ✅
Computable badge types now auto-award without admin intervention. Run on review submit, profile update, and daily cron.

- [x] Badge compute engine (runs on review submit, profile update, and cron)
- [x] Triggers for: `reviewer`, `profile_complete`, `verified`, `quality_reviewer`, `detailed_reviewer`, `balanced_reviewer`, `trusted_reviewer`, `top_contributor`
- [x] Notification on auto-badge award

## Effort Summary

| Phase | Effort | Impact | Dependencies |
|-------|--------|--------|-------------|
| 1. Public structured data | Mostly done | High (unlocks structured public review data) | Optional refinements only |
| 2. Reputation portability governance | ✅ Mostly done | Optional public-key policy/key rotation remains |
| 3. Network effects | ✅ First pass done | Medium-high (growth) | Future work depends on product policy |
| 4. Auto-badges | ✅ Done | Badge definitions existed |

Now delivered: Phase 1 (structured data), Phase 2 core governance, Phase 3 first pass, Phase 4 (auto-badges).
Remaining: optional public-key hardening, deeper network-effect product experiments, and product/UX work from `gamification-rethink.md`.
