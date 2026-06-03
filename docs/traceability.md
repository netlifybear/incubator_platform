# Traceability

This maps the product thesis to implemented features and patent/spec coverage. Use it to prioritize future work and avoid drifting away from the core business logic.

Product language should follow `product.md`: private cohort trust graph first, public-safe structured-data projection second, portable founder credibility third. AI/search discoverability is an outcome of crawlable public-safe surfaces, not a promised ranking boost.

## Feature Coverage

| Product Thesis | Implemented Features | Patent/Spec Coverage |
|----------------|----------------------|----------------------|
| Private trust comes first | Cohort-scoped vendor directory, named founder reviews, tenant-scoped access helpers, admin-only surfaces, vendor requests, targeted questions, invite flow | Tenant management, cohort scoping, verification engine, privacy boundaries |
| Founders trade higher review-quality friction for credibility | Founder and consumer review modes, quality analysis, structured prompts, pre-submission checklist, disclosure handling, quality-adjusted review points | Review quality feedback, specificity checks, disclosure checks, mode selector, quality scoring |
| Founders should find vendors faster than asking in chat | Vendor search, category filters, sort modes, vendor detail pages, helpful votes, ask-for-details actions, top vendor rankings, cross-cohort recommendations | Ranked vendor discovery, tenant-scoped vendor queries, public-safe aggregate recommendations |
| Useful incentives turn passive consumers into contributors | Points, contribution tags, nominations, auto-tag engine, sprints, notifications, weekly digest, cohort activity, impact dashboard, contribution feedback loop | Quality-adjusted points, multi-issuer contribution tags, issuer hardening, privacy thresholds |
| Private contribution should produce portable credibility | Public founder profiles, `Person` JSON-LD, public consumer review JSON-LD, embeddable contribution tag, signed reputation export/import, credibility factor explainability, structured credibility report, signed credibility API, backlink tracking, GSC integration | Structured profile data, embeddable contribution signal, cross-instance reputation packets, credibility factor scoring, public-safe credibility projection, privacy-preserving public rankings |
| Authority-building must stay ethical | SEO guidance, backlink tracker, backlink analysis, spam policy comparison, cohort-scoped guest-post exchanges | Backlink validation, anchor classification, velocity scoring, natural link scoring, policy comparison |
| Review guidance should improve specificity without rewriting voice | Founder/consumer review rule config, review-quality engine, debounced quality hook, feedback panel, pre-submission modal | Real-time feedback, keyword stuffing detection, specificity detection, sentiment balance, disclosure, quality scoring |

## Current Gaps

| Area | Status | Guidance |
|------|--------|----------|
| Streak milestones | Product direction | Scope separately after observing actual usage. |
| Cross-instance public-key verification | Optional hardening | Shared-secret verification works; policy/key rotation remains future work. |
| Public Q&A schema and richer structured data | Optional | Add only when public surfaces and reliable fields exist. |
| Backlink page-level verification | Optional | Current verification is educational/domain-level unless deeper parsing is added. |
| Small-cohort public contribution summary | Implemented | Under-threshold public summaries now explain that private activity may exist, why public aggregates stay hidden, what threshold unlocks them, and where visitors can go next. |
| Single-review credibility label | Implemented | Sparse non-thin credibility reports now use "Early signal" instead of "Developing" while preserving stronger labels once the track record has more evidence. |

## Lower-Novelty Product Features

These are useful but lower priority for patent expansion than trust, portability, structured data, issuer hardening, and review-quality systems:

- Guest-post exchange lifecycle.
- Sprint mechanics.
- SEO education content.
- GSC OAuth import.
- Cosmetic milestone tiers.

## Recent QA Records

| Record | Result | Remaining Follow-Up |
|--------|--------|---------------------|
| `public-credibility-qa.md` | Public credibility surfaces pass the private-to-public projection check: no visible internal points/rank leakage, no credit-language drift, and JSON-LD is present across reviewed HTML pages. | Follow-up UX polish implemented for small-cohort summary messaging and single-review credibility label calibration. |
