# Plans

This folder contains implementation proposals and product direction notes. It is not a single execution queue.

## Recommended Execution Order

| Plan | Status | Next Agent Guidance |
|------|--------|---------------------|
| `ai-seo-geo-reviews.md` | Implemented | Public vendor review JSON-LD completed. |
| `reciprocity-pipeline.md` | Mostly implemented | Governance, auto-badges, alumni first pass, public cohort pages, and invites/referrals are live. Remaining: cross-cohort recommendations and deeper network effects. |
| `gamification-rethink.md` | Product direction | Basic impact-over-points changes applied. Needs UX/product design before deeper work. |
| `founder-credit-report.md` | Implemented | Founder credit report page and API endpoint completed; privacy/verification polish remains optional. |
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

## Remaining Work

From reciprocity-pipeline.md:

1. **Phase 3 (cont.)**: Network Effects
   - Alumni role with read-only access: first pass done
   - Public cohort aggregate pages: first pass done
   - Invite/referral system: first pass done
   - Next executable slice: cross-cohort vendor recommendation signal
   - Later slices: richer alumni participation, cohort aggregate refinements, referral loop polish

2. **Gamification rethink**: Impact-over-points refinements
   - Basic UX changes applied (grow/rewards/leaderboard pages)
   - Deeper work needs UX/product design first: impact dashboard, contribution capsules, full board demotion
   - Product/UX design first; do not start as a broad code task

3. **Optional portability hardening**
   - Shared-secret reputation verification works
   - Public-key endpoint exists when configured
   - Remaining: full cross-instance public-key verification policy/key rotation

4. **Optional AI/SEO refinements**
   - Q&A schema only if public Q&A exists
   - Citation optimization and richer founder/startup structured data

## Notes For Agents

- Check the current code before following any plan. Some plans intentionally document completed or deferred work.
- Prefer `docs/product.md`, `docs/traceability.md`, `README.md`, and `OPERATING.md` for durable project truth.
- Do not implement roadmap-scale items from a plan without first extracting a small, verifiable task.
- For network effects, execute one slice at a time in the order shown in `reciprocity-pipeline.md`.
