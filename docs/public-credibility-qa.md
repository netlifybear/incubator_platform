# Public Credibility Surfaces — Visual QA

**Date:** 2026-06-02
**Scope:** 8 public pages across the credibility projection surface
**Primary question:** Does the public experience clearly communicate private cohort trust graph → public-safe credibility projection, without exposing internal points/rank or confusing reputation/credit language?
**Secondary question:** Are pages visually understandable for founders, incubator admins, and AI/search crawlers?

## Pages Reviewed

| URL | Status | Content-Type |
|-----|--------|-------------|
| `/cohorts` | 200 | HTML + JSON-LD |
| `/cohorts/demo-incubator` | 200 | HTML + JSON-LD |
| `/founders` | 200 | HTML + JSON-LD |
| `/founder/jordan` | 200 | HTML + JSON-LD |
| `/founder/jordan/credibility` | 200 | HTML + JSON-LD + print CSS |
| `/leaderboard/public?cohort=demo-incubator` | 200 | HTML + JSON-LD |
| `/api/badge/jordan` | 200 | SVG |

## Primary Question: Points/Rank/Credit Exposure

| Page | Points Exposed? | "Credit"/"Reputation" Terms? | Privacy Boundary Clear? |
|------|----------------|------------------------------|-------------------------|
| `/cohorts` | None | "contribution signals" | Yes — "privacy-gated aggregate activity" |
| `/cohorts/demo-incubator` | None | "contribution signals" | Yes — inline boundary notice |
| `/founders` | None | "contribution signals" | Yes — "public-safe" in meta |
| `/founder/jordan` | None | "Contribution tags" | Yes — badge icons without points |
| `/founder/jordan/credibility` | None | "Credibility" (correct term) | Yes — "public-safe" in meta |
| `/leaderboard/public` | None | "Contribution summary" | Yes — 5-founder privacy threshold |
| `/api/badge/jordan` | None | "incubator-trust" watermark | N/A (embeddable image) |

**Verdict: PASS — no internal points, ranks, or disallowed terminology exposed.**

## Secondary Question: Visual Structure Audit

### /cohorts — Cohort Directory
- Title: "Cohorts — Incubator Trust"
- Description: "Browse public-safe incubator cohort summaries built from verified vendor reviews and contribution signals."
- JSON-LD: `CollectionPage` with `ItemList` (2 cohorts)
- Rendered: 2 cards (Demo Incubator, Harbor Accelerator) showing founder/vendor/review counts

### /cohorts/demo-incubator — Cohort Detail
- Title: "Demo Incubator — Incubator Trust"
- Description: "A seeded cohort for the private trust loop MVP."
- JSON-LD: `Organization` (4 employees, knowsAbout categories)
- Rendered: Back nav, name, description, privacy notice, founder count
- Privacy notice: "This public-safe page shows aggregate cohort activity only. Private founder reviews, requests, invites, and admin activity stay inside the cohort trust network."

### /founders — Founder Directory
- Title: "Founders — Incubator Trust"
- Description: "Browse public-safe founder profiles with verified contribution signals across incubator cohorts."
- JSON-LD: `CollectionPage` with `ItemList` (4 founders: Jordan, Lina, Maya, Omar)
- Rendered: 4 card entries with sorting (A–Z, Recent)

### /founder/jordan — Founder Profile
- Title: "Jordan Lee | Founder Profile"
- Description: "Founder building better finance tooling for independent operators."
- JSON-LD: `Person` with `affiliation`, `aggregateRating` (4.0, 1 review), `knowsAbout` (Accounting), `url`
- Rendered: Name, bio, cohort badge, 5 contribution tags (✅ Verified, 🌟 Profile Complete, 📝 Founding Reviewer, 🔒 Trusted Reviewer, 🤝 Community Contributor), 70% profile complete
- No points or rank visible

### /founder/jordan/credibility — Credibility Report (7 sections)
- Title: "Jordan Lee | Credibility Report"
- Description: "Jordan Lee's public-safe founder credibility report."
- JSON-LD: `Person` with same structured data + print CSS
- Rendered sections:
  1. **Credibility Summary** — "Developing" pill, 5 factor rows, "1 total review — based on 20% average review quality"
  2. **Identity & Cohort Verification** — Cohort membership, Email verified, 70% profile, 5-day account age, verifiable tag hash
  3. **Review History** — 1 total, 1 detailed, 4.0/5 avg, 100% firsthand, "Today" freshness
  4. **Contribution Signals** — 5 tags listed with descriptions and verification hash
  5. **Helpfulness & Peer Validation** — 0% vote ratio, 20% quality score, 0 votes, 0 peers
  6. **Backlink Authority** — 0 verified, 1 domain, GSC not connected
  7. **Export & Verification** — PDF download, JWT copy, verify link

### /leaderboard/public — Cohort Contribution Summary
- Title: "Demo Incubator Contribution Summary"
- Description: "Public contribution summary for Demo Incubator. See aggregate cohort activity without exposing founder identities."
- JSON-LD: `CollectionPage` with aggregate `PropertyValue` entries (3 founders, 2 active, 3 reviews, 1 helpful vote)
- Rendered: Privacy threshold notice — "This cohort has 3 founders. Public summaries appear only after at least 5 founders have joined, reducing the risk of identifying members by activity patterns."
- Data hidden for cohorts under 5 members (correct behavior)

### /api/badge/jordan — Reputation Image
- Content-Type: `image/svg+xml`
- SVG content: 240×80 dark gradient card showing name, cohort, profile completeness bar, watermark
- No points, rank, or scores

## Polish Opportunities

| # | Issue | Page | Severity |
|---|-------|------|----------|
| 1 | **Leaderboard empty for small cohorts**: Threshold message shows but no data. Correct behavior but confusing for cohorts with <5 members. | `/leaderboard/public` | Low |
| 2 | **Founder profile meta description** uses Jordan's bio rather than page purpose. Crawlers see "Founder building better finance tooling" vs "Public founder credibility profile." | `/founder/jordan` | Medium |
| 3 | **Export section JWT UX**: Truncated hash + "Copy JWT" button not obviously labeled for non-technical users. | `/founder/jordan/credibility` | Low |
| 4 | **Badge watermark** (`incubator-trust`, 9px font) near-invisible — fine for humans, crawlers may miss context. | `/api/badge/jordan` | Low |
| 5 | **Summary label "Developing"** for 1 review (4.0, 0 helpful votes, 20% quality) — correct per factor logic but a marginal single-review case. | `/founder/jordan/credibility` | Low |

## Structured Data Coverage

All pages pass with JSON-LD schema.org markup for AI/search crawlers.

## Verdict

**Primary question: PASS.** The private→public projection is clean — no points, rank, or disallowed terminology leaks. Privacy boundaries are explicit on all aggregate pages.

**Secondary question: PASS with notes.** Pages are structurally sound, well-described with meta tags and JSON-LD, and organized in a natural reading order. The 5 polish items above are minor and safe to defer.
