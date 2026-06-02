# Phase B: Structured Credibility Report

## Goal

Reorganize `/founder/[slug]/credibility` into formal report sections that read like a coherent credibility document — not a collection of disconnected metrics — while keeping all "credit" terminology out of the UI.

## Current State

The page already has 6 sections, but they were added incrementally (Phase A, backlink work, badge proof) without a unified document structure:

1. Header (name, cohort, last updated, verifiable badge)
2. Identity Verification (cohort, profile %, account age)
3. Credibility Summary (summary pill + public factor dots)
4. Review Credibility (total reviews, avg rating, used vendor %, helpful vote ratio, quality score trend)
5. Badge Proof (badge list + verification hash)
6. Backlink Authority (verified count, referring domains, GSC status)
7. Export & Verify (PDF download, JWT, verify link)

## Target: 7-Section Report

### Section 1: Summary (rename + promote)

**Heading:** "Credibility Summary" (keep as-is)

**Changes:**
- Move from position 2 to position 1 (after header)
- Add a short preamble sentence: "An overview of {displayName}'s contribution track record on {cohortName}."
- Keep overall summary pill (Strong / Developing / Needs activity / Establishing presence)
- Keep per-factor rows with status dots and public descriptions
- Add `n total reviews` footnote at the bottom (pull from `reviewStats._count`)

**Data:** Same as current Phase A — `publicFactors` and `credibility` from `computeCredibilityFactors()`

### Section 2: Identity & Cohort Verification (rename + expand)

**Heading:** "Identity & Cohort Verification"

**Changes:**
- Rename from "Identity Verification"
- Move the verifiable badge + hash display from the header into this section
- Add `Email verified` row (same source as cohort membership — implied by cohort membership)
- Keep existing rows: Cohort Membership, Profile Completeness, Account Age

**Data:** Already available in `getFounderCredibilityData()`

### Section 3: Review History (rename + restructure)

**Heading:** "Review History"

**Changes:**
- Rename from "Review Credibility" (avoids "credibility" overload — the whole page is about credibility)
- Keep: Total Reviews Written, Average Rating Given, Used Vendor %
- Remove: Helpful Vote Ratio (moves to Section 5), Quality Score Trend (moves to Section 5)
- Add: `Reviews with detailed comments` count — reviews where `reviewContributionPoints(comment) > 0`
- Add: Review freshness indicator — period label for when newest review was written (e.g., "Last review: 2 weeks ago")

**Data:** Already available; freshness computed from existing `reviews` query in `getFounderCredibilityData()`

### Section 4: Contribution Signals (rename)

**Heading:** "Contribution Signals"

**Changes:**
- Rename from "Badge Proof"
- Change section subtitle from "cryptographically verifiable badges" to "Badges and contribution markers earned on the platform"
- Keep badge list + verification hash

**Data:** Already available

### Section 5: Helpfulness & Peer Validation (new section)

**Heading:** "Helpfulness & Peer Validation"

**Content:**
- **Helpful Vote Ratio** — moved from Review History (existing `helpfulVoteRatio`)
- **Quality Score Trend** — moved from Review History (existing `qualityScorePercentage`)
- **Helpful votes received** — absolute count (from `impact.helpfulVoteCount` via `getFounderImpactSummary`)
- **Peers who found reviews helpful** — `n unique founders` (requires querying distinct users who cast helpful votes)

**New data needed:**
- `impact.helpfulVoteCount` — need to import and call `getFounderImpactSummary()`
- Distinct founder count for helpful votes — new query:
  ```ts
  const helpfulVoterCount = await prisma.helpfulVote.count({
    where: { reviewId: { in: founderReviews.map(r => r.id) }, value: true },
    distinct: ["userId"],
  });
  ```

### Section 6: Backlink Authority (keep)

**Heading:** "Backlink Authority" (no change)

**Content:** Verified Backlinks, Referring Domains, GSC Connection Status (no change)

**Data:** Already available

### Section 7: Export & Verification (rename)

**Heading:** "Export & Verification"

**Changes:**
- Rename from "Export & Verify" to "Export & Verification" for consistency with other section headings (noun phrases)
- Keep all existing content: PDF download, JWT display, verify link

## Section Order Rationale

1. **Summary** — quick overview first, like an executive summary
2. **Identity & Cohort** — establishes who the person is and their membership
3. **Review History** — the core contribution data
4. **Contribution Signals** — badges earned for their work
5. **Helpfulness & Peer Validation** — social proof from the community
6. **Backlink Authority** — external validation
7. **Export & Verification** — how to use/verify the report

This flows from identity → contributions → social proof → external authority → export, which is a natural reading order.

## Edge Cases

| Case | Behavior |
|------|----------|
| Zero reviews | Review History shows 0; Helpfulness shows no data; Summary shows "Establishing presence" |
| No helpful votes | Helpful Vote Ratio shows 0%; distinct voter count shows 0 |
| No badges | Contribution Signals shows "No badges earned yet" |
| No backlinks | Backlink Authority shows 0; GSC may still be connected or not |
| Cohort not set | Identity shows "N/A" for cohort; badge verification hash still renders |

## Not In Scope

- Inquiry logging (access history for report views) — deferred to a future Phase
- PDF/export polish
- Structured machine-readable API endpoint (Phase F)

## Test Strategy

The page is a server component with existing integration via `getFounderCredibilityData()`. No new business logic is introduced — only section reorganization and a new `impact.helpfulVoteCount` query. Existing credibility factor tests (`credibility-factors.test.ts`) should continue to pass.

Recommended verification:
- `node --test --test-concurrency=1 src/lib/credibility-factors.test.ts`
- `npx tsc --noEmit`
- Visual review of `/founder/[slug]/credibility` page for section order and copy

## Migration

This is a same-page rearrangement, safe to ship in one commit. No URL changes, no schema migrations, no API contract changes. The `reputationPacket` in `getFounderCredibilityData()` is unchanged — the JWT export, PDF download, and external verify flow are unaffected.

## Implementation Order

1. Rename and reorder sections per target layout
2. Add `getFounderImpactSummary()` call and distinct voter query for Section 5
3. Update section headings and subtitles
4. Move verifiable badge into Identity section
5. Add review freshness and detailed-comment count to Review History
6. Verify: tsc, tests, visual check
