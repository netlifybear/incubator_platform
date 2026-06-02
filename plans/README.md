# Plans

This folder contains implementation proposals and product direction notes. It is not a single execution queue.

## Recommended Execution Order

| Plan | Status | Next Agent Guidance |
|------|--------|---------------------|
| `ai-seo-geo-reviews.md` | Implemented | Public vendor review JSON-LD completed. |
| `reciprocity-pipeline.md` | Mostly implemented | Network effects first pass is live: cross-cohort recommendations, alumni helpful voting policy, cohort privacy refinements, and referral loop polish. |
| `gamification-rethink.md` | Product direction | Impact dashboard slice implemented. Remaining badge/contribution-signal taxonomy, contribution feedback loop, and deeper UX work deferred (see deferral notes below). |
| `impact-dashboard-implementation.md` | Implemented | `/grow` uses personal impact metrics; `/leaderboard` is a cohort contribution dashboard without visible points; `/rewards` shows credibility ingredients without rank. |
| `founder-credit-report.md` | Implemented | Founder credit report page and API endpoint completed; credit report verification UX polish remains optional and deferred until after impact dashboard. |
| `nav-regroup-hubs.md` | Implemented | Reference only. Do not execute. |

## Completed Work Summary

✅ **ai-seo-geo-reviews.md**: Public Vendor Review JSON-LD
- Added Product, AggregateRating, and Review schema markup to public vendor pages
- Only includes consumer reviews (founder reviews kept private)
- JSON-LD only shown in consumer mode or when not signed in
- Reused existing getConsumerReviewsForVendor function

✅ **reciprocity-pipeline.md Phase 2**: Import Reputation UI in Grow Hub
- Added import reputation functionality to Grow hub's "Recommended actions" section
- Added state management, import handler, and UI form for JWT import
- Links to existing /api/reputation/import endpoint

✅ **founder-credit-report.md**: Founder Credit Report
- Created public report page at `/founder/[slug]/credibility`
- Includes all 5 sections: Header, Identity Verification, Review Credibility, Badge Proof, Backlink Authority, Export & Verify
- Created machine-readable endpoint at `/api/credibility/[slug]` returning signed JSON
- Added "Your credibility report" CTA to Grow hub recommended actions
- Implemented print-friendly report (client-side print alternative to PDF)

✅ **nav-regroup-hubs.md**: Already implemented
- Sidebar changed to Write/Connect/Grow + Admin links
- `/connect` and `/grow` pages created

✅ **reciprocity-pipeline.md Phase 2**: Governed Reputation Imports
- Added pending import queue at `/admin/imports`
- Added approve/reject actions with founder/admin notifications
- Added cohort trust policy configuration for import scope
- Added optional public-key endpoint for future asymmetric verification

## Current Open Work

From reciprocity-pipeline.md:

1. **Network effects**
   - Cross-cohort vendor recommendation signal: done
   - Alumni participation rules: done for helpful votes; other writes remain blocked
   - Public cohort aggregate refinements: privacy threshold first pass done
   - Referral loop polish: duplicate invite guard, referral attribution, and invite-accepted notification/activity done
   - Remaining: observe usage and scope any deeper cross-cohort or alumni write feature as a separate policy-backed task

2. **Gamification rethink**: Impact-over-points refinements
   - Impact dashboard implementation is complete: `/grow` uses `getFounderImpactSummary()` for personal impact metrics; `/leaderboard` is a cohort contribution dashboard without visible point totals or rank positions; `/rewards` shows credibility ingredients without cohort rank
   - Points remain internal for ordering, reputation export, and credibility API compatibility
   - Remaining: deeper badge/contribution-signal taxonomy, contribution feedback loop design, and streak milestones — each requires UX/product design before implementation

3. **Optional portability hardening**
   - Shared-secret reputation verification works
   - Public-key endpoint exists when configured
   - Remaining: full cross-instance public-key verification policy/key rotation

4. **Optional AI/SEO refinements**
   - Q&A schema only if public Q&A exists
   - Citation optimization and richer founder/startup structured data

## Secondary UX Deferral Notes

The following items were identified during the impact dashboard implementation. **Do not execute until after the impact dashboard is stable and observed in production:**

1. **Badge/Contribution-signal taxonomy** — converting badges from "achievements" to descriptive "contribution tags" (e.g. `reviewer` → "Has written reviews"). Requires UX design for naming, display treatment on profiles, and impact on badge computation engine. Deferred because the current badge system works and this is purely a presentation change.

2. **Contribution feedback loop** — broader "your contribution mattered" surface beyond current notifications/activity events. Needs product design to define what feedback signals matter (helpfulness ratio trends, cohort impact summaries, personal growth charts). Deferred because it depends on the impact dashboard data model settling first.

3. **Credit report verification UX** — optional polish to the `/founder/[slug]/credibility` page: export-as-PDF, richer verification badges, inquiry history display. Deferred because the current page is functional and this is a nice-to-have.

4. **Connect inline answering** — allowing founders to answer open vendor requests directly from the Connect hub without navigating to a separate page. Deferred because it's a UX optimization, not a missing feature.

5. **Grow SEO alignment** — optimizing the Grow page for search engines (JSON-LD, meta descriptions, semantic HTML). Deferred until Grow's data model settles after the impact dashboard changes land.

These items should be revisited after the impact dashboard has been live for at least one sprint cycle (2 weeks) and usage patterns have been observed.

## Notes For Agents

- Check the current code before following any plan. Some plans intentionally document completed or deferred work.
- Prefer `docs/product.md`, `docs/traceability.md`, `README.md`, and `OPERATING.md` for durable project truth; this folder is for execution history and future slices.
- Do not implement roadmap-scale items from a plan without first extracting a small, verifiable task.
- For deeper network effects, write a policy-backed slice first and keep private founder content out of public surfaces.
