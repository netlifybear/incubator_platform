# Plans

This folder contains execution plans, product direction notes, and historical implementation records. It is not a single backlog. Before executing any plan, check the current code and keep durable project truth in `../README.md`, `../OPERATING.md`, and `../docs/`.

## Active Handoff

| Plan | Status | Next Agent Guidance |
|------|--------|---------------------|
| `phase-b-structured-report.md` | Plan ready | Reorganize `/founder/[slug]/credibility` into 7 formal report sections (Summary → Identity → Review History → Contribution Signals → Helpfulness → Backlink Authority → Export). New Section 5 requires `getFounderImpactSummary()` call and distinct helpful-voter query. |

## Deferred Work

| Area | Source Plan | Status | Next Agent Guidance |
|------|-------------|--------|---------------------|
| Badge/contribution-signal taxonomy | `gamification-rethink.md` | Product direction | Consider renaming badge presentation from achievement-style labels to contribution tags. Requires UX/product design before code changes. |
| Streak milestones | `gamification-rethink.md` | Product direction | Scope separately after the impact dashboard has been observed in local or production usage. |
| Credit report verification polish | `founder-credit-report.md` | Optional polish | Existing `/founder/[slug]/credibility` page and API work. Optional follow-up: PDF/export polish, richer verification badges, and inquiry-history display. |
| Connect inline answering | `gamification-rethink.md` | Optional UX optimization | Let founders answer open vendor requests from `/connect` without navigating away. Design the workflow before implementation. |
| Grow SEO alignment | `gamification-rethink.md` | Deferred | Revisit after Grow's data model settles. Consider metadata, semantic structure, and JSON-LD only where the public surface supports it. |
| Portability hardening | `reciprocity-pipeline.md` | Optional hardening | Shared-secret verification works and public-key endpoint exists when configured. Full cross-instance public-key policy and key rotation remain future work. |
| AI/SEO refinements | `ai-seo-geo-reviews.md` | Optional | Q&A schema only if public Q&A exists; richer founder/startup structured data can be scoped separately. |

## Implemented References

| Plan | Implementation Summary |
|------|------------------------|
| `ai-seo-geo-reviews.md` | Public vendor review JSON-LD is implemented for consumer-visible reviews. Founder reviews remain private. |
| `reciprocity-pipeline.md` | Network-effects first pass is implemented: cross-cohort recommendations, alumni helpful-voting policy, cohort privacy refinements, referral loop polish, governed reputation imports, and optional public-key endpoint. |
| `impact-dashboard-implementation.md` | `/grow` uses personal impact metrics; `/leaderboard` is a cohort contribution dashboard without visible points; `/rewards` shows credibility ingredients without cohort rank. |
| `contribution-feedback-loop.md` | Full loop implemented: Slice A+B (feedback helper + `/grow` recap) + Slice C (outcome-language notifications for helpful votes and targeted requests) + Slice D (digest shows founders helped with impact section). |
| `founder-credit-report.md` | Founder credibility report page and machine-readable endpoint are implemented. |
| `phase-a-credibility-factors.md` | 6-factor computation with `computeCredibilityFactors()`, public presenter `toPublicCredibilityFactors()`, 9 tests, `/grow` card, `/credibility` summary section. |
| `nav-regroup-hubs.md` | Sidebar regrouped into Write, Connect, Grow, and Admin links; `/connect` and `/grow` exist. Reference only. |

## Agent Guardrails

- Check the current code before following any plan. Several files here document completed or deferred work.
- Prefer `../docs/product.md`, `../docs/traceability.md`, `../README.md`, and `../OPERATING.md` for durable project truth.
- Extract a small, verifiable task before implementing roadmap-scale items.
- Keep private founder content out of public surfaces.
- For deeper network effects, write a policy-backed slice first.
- For implementation handoff, prefer `superpowers:subagent-driven-development` or `superpowers:executing-plans` when a plan calls for it.
