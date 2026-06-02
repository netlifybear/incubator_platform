# Product Brief

Incubator Trust turns cohort knowledge into portable founder credibility.

The first useful product is a private, cohort-scoped vendor trust layer. Founders use it because it helps them find credible vendors faster than searching Slack threads. Public profiles, contribution tags, backlinks, structured data, and portability only matter after the private trust loop is useful.

## Thesis

Private trust comes first. Public authority comes second.

The platform wins if it becomes the persistent memory layer for an incubator's operating knowledge: who founders used, what worked, what failed, and which recommendations are credible because they came from verified cohort members.

## Flywheel

```text
Private Trust -> Utility -> Contribution Incentives -> Portable Credibility
      ^                                                       |
      +-------------------------------------------------------+
```

| Stage | Product Meaning |
|-------|-----------------|
| Private Trust | Cohort-scoped access, named reviews, verified membership, and tenant boundaries. |
| Utility | Founders find vendors, request missing recommendations, and ask peers for context. |
| Contribution Incentives | Helpful votes, contribution tags, sprints, notifications, activity, and impact feedback make contribution worthwhile. |
| Portable Credibility | Public profiles, embeddable contribution tags, backlinks, structured data, credibility reports, and signed reputation packets let useful contribution travel. |

## Reciprocal Authority

Unlike consumer review platforms, this product has a bilateral authority exchange.

What the platform grants founders:

- Verified cohort status.
- Public profile and contribution-tag surfaces.
- Backlink and search-visibility tooling.
- Signed reputation export/import.
- Founder credibility signals that can outlive one cohort.

What founders grant the platform:

- Named, specific, cohort-scoped reviews.
- Firsthand-use, disclosure, work-type, and quality signals.
- Helpful votes, requests, exchanges, and activity that improve cohort memory.

That reciprocity justifies stricter quality standards than a general consumer review site can sustain.

## Current Product Shape

The app currently includes:

- Write/Connect/Grow hub navigation.
- Cohort-scoped vendor discovery, vendor requests, targeted questions, and admin fulfillment.
- Founder and consumer review modes with quality feedback and disclosure handling.
- Cross-cohort recommendations, alumni helpful voting, invite/referral flow, and public cohort aggregates with privacy thresholds.
- Public founder profiles, embeddable contribution tags, public vendor JSON-LD, and founder credibility reports.
- Backlink tracking, GSC OAuth, SEO guidance, digest emails, notifications, and activity.
- Signed reputation export/import with governed admin approval.
- Impact-over-points copy on Grow, Rewards, and the private contribution view.

See `../OPERATING.md` for route-level detail.

## Guardrails

- Public profiles are opt-in.
- Private cohort reviews, requests, invites, and admin activity must not leak into public profiles or public structured data.
- Startup links are editorial attribution links, not required reciprocal links.
- Contribution tags must represent real criteria or explicit issuers; no paid tags.
- Do not promise ranking improvements from contribution tags, links, or structured data.
- Do not automate reciprocal link exchange mechanics.
- Public cohort aggregates and public leaderboard-like surfaces need privacy thresholds.
- Points can remain internal, but user-facing language should emphasize contribution, impact, and credibility.

## Strategic Risks

- Empty directory risk: without seed data and requests, founders will not return.
- Trust risk: anonymous or unverifiable founder reviews weaken the core promise.
- Privacy risk: leaking private cohort content into public surfaces would damage trust.
- SEO risk: backlink tooling can drift into spam incentives.
- Gamification risk: points and leaderboards can reward optimization over useful contributions.
- Scope risk: crawler integrations and broad network effects can distract from the private trust wedge.

## Near-Term Direction

- Credibility factor explainability and the structured credibility report are implemented; monitor the UX before adding more report sections.
- Contribution feedback notifications and digest language are implemented; monitor for notification noise before expanding the loop.
- Keep streak milestones, Connect inline answering, and Grow SEO alignment as product/UX work before implementation.
- Treat public Q&A schema and citation refinements as optional structured-data experiments, not required AI visibility levers.
- Keep deeper alumni/cross-cohort interaction policy-backed and scoped.
