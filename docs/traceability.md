# Traceability

This maps the product thesis to implemented features and patent/spec coverage. Use it to prioritize future work and avoid drifting away from the core business logic.

## 1. Private Trust Loop

Thesis: private trust comes first; public authority comes second.

Implemented features:

- Cohort-scoped vendor directory.
- Named founder reviews with cohort membership.
- Vendor requests, targeted questions, admin fulfillment, and invite flow.
- Tenant-scoped data access helpers and admin-only surfaces.

Patent/spec coverage:

- Platform claim coverage: tenant management, cohort scoping, verification engine.
- Open product gap: richer alumni/cross-cohort participation without breaking tenant trust.

## 2. Reciprocal Authority

Thesis: founders accept higher review-quality friction because contribution builds their credibility.

Implemented features:

- Founder and consumer review modes.
- Quality analysis, structured prompts, pre-submission checklist, and disclosure handling.
- Quality-adjusted review points.
- Public profile, badge, backlink, and reputation-portability surfaces.

Patent/spec coverage:

- Review quality feedback, specificity checks, disclosure checks, mode selector, and quality scoring.
- Platform quality-adjusted points and profile authority surfaces.

## 3. Utility

Thesis: founders should find good vendors faster than asking in chat.

Implemented features:

- Vendor search, category filter, and sort modes.
- Vendor detail pages with founder and consumer reviews.
- Helpful votes and ask-for-details actions.
- Top vendors by authority score.

Patent/spec coverage:

- Ranked vendor discovery and tenant-scoped vendor queries.

## 4. Contribution Incentives

Thesis: useful incentives turn passive consumers into contributors.

Implemented features:

- Points, tiers, leaderboard, public leaderboard threshold, rewards page.
- Badges, nominations, multi-issuer badge APIs, admin award flow.
- Auto-badge compute engine (runs on review submit, profile update, and cron).
- Sprints, notifications, weekly digest, and cohort activity.

Patent/spec coverage:

- Quality-adjusted points, multi-issuer badges, issuer hardening, and privacy thresholds.

Current gap:

- Points/tier UI has basic impact-over-points changes applied; deeper refinement awaits product/UX design.
- Milestone tiers are purely decorative (titles only, no unlocks).

## 5. Portable Credibility

Thesis: useful private contribution should produce portable founder credibility.

Implemented features:

- Public founder profiles with stable slugs.
- `Person` JSON-LD on founder pages.
- Public vendor review JSON-LD from public consumer reviews.
- Embeddable SVG badge API.
- Signed reputation export/import and stored import packets.
- Founder credibility report page and signed machine-readable API.
- Backlink tracking and GSC integration.

Patent/spec coverage:

- Structured profile data, badge embed, cross-instance reputation packets, privacy-preserving public rankings.

Current gap:

- Imported reputation governance is live (admin approval queue + trust policy per import). Cross-instance public-key verification remains deferred.
- Structured data refinements remain optional: Q&A schema if public Q&A exists, and richer founder/startup fields.

## 6. SEO Ethics

Thesis: teach legitimate authority-building; avoid manipulative link schemes.

Implemented features:

- SEO guidance page.
- Backlink tracker and backlink analysis.
- Spam policy comparison.
- GSC OAuth import.
- Guest-post exchange workflow with cohort scoping.

Patent/spec coverage:

- Backlink validation, anchor text classification, velocity scoring, natural link scoring, and policy comparison.

Current gap:

- Backlink verification is still educational/domain-level unless page-level link parsing is added.
- Exchange workflow should stay collaboration-oriented, not automated link swapping.

## 7. Review Quality Module

Thesis: guide users toward specific, firsthand, balanced reviews without rewriting their voice.

Implemented features:

- `src/config/review-rules-consumer.json`
- `src/config/review-rules-founder.json`
- `src/lib/review-quality.ts`
- `src/hooks/useReviewQuality.ts`
- Quality feedback panel and pre-submission modal.

Patent/spec coverage:

- Real-time feedback, keyword stuffing detection, specificity detection, sentiment balance, disclosure, text mode toggle, and quality scoring.

## Unclaimed Or Lower-Novelty Features

- Guest-post exchange lifecycle.
- Sprint mechanics.
- SEO education content.
- GSC OAuth import.
- Milestone tiers.

These are useful product features, but lower priority for patent expansion than the trust, portability, structured data, issuer hardening, and review-quality systems.
