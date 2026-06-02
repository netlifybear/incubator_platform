# Plans

This folder contains implementation proposals and product direction notes. It is not a single execution queue.

## Recommended Execution Order

| Plan | Status | Next Agent Guidance |
|------|--------|---------------------|
| `ai-seo-geo-reviews.md` | Implemented | Public vendor review JSON-LD completed. |


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

## Remaining Work

From reciprocity-pipeline.md:

1. **Phase 2 (cont.)**: Govern the Portability Layer (~4-6h) ✅
   - Admin approval queue for imported packets: done
   - Trust policy configuration: done
   - Cross-instance verification: still shared-secret only (public-key deferred)

2. **Gamification rethink**: Impact-over-points refinements
   - Basic UX changes applied (grow/rewards/leaderboard pages)
   - Deeper work needs UX/product design first: impact dashboard, contribution capsules, full board demotion
   - Product/UX design first; do not start as a broad code task

3. **Phase 3**: Close the Network Effects Gap (~6-10h)
   - Alumni role with read-only + limited write access
   - Cross-cohort vendor recommendations
   - Public cohort aggregate pages
   - Invite/referral system
   - Split before execution; this is roadmap-scale

4. **Optional AI/SEO refinements**
   - Q&A schema only if public Q&A exists
   - Citation optimization and richer founder/startup structured data

## Notes For Agents

- Check the current code before following any plan. Some plans intentionally document completed or deferred work.
- Prefer `docs/product.md`, `docs/traceability.md`, `README.md`, and `OPERATING.md` for durable project truth.
- Do not implement roadmap-scale items from a plan without first extracting a small, verifiable task.
