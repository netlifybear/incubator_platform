# Product Brief

Incubator Trust turns cohort knowledge into portable founder credibility.

The product starts as a private, cohort-scoped vendor trust layer. Founders use it because it helps them find credible vendors faster than searching Slack threads. Public reputation, badges, backlinks, structured data, and portability only matter after the private trust loop is useful.

## Product Thesis

Private trust comes first. Public authority comes second.

The platform wins if it becomes the persistent memory layer for an incubator's operating knowledge: who founders used, what worked, what failed, and which recommendations are credible because they came from verified cohort members.

## Reciprocal Authority

Unlike consumer review platforms, this product has a bilateral authority exchange.

What the platform grants founders:

- Verified cohort status.
- Public profile and badge surfaces.
- Backlink and search-visibility tooling.
- Signed reputation export/import.
- Founder credibility signals that can outlive one cohort.

What founders grant the platform:

- Named, specific, cohort-scoped reviews.
- Firsthand-use signals, disclosure signals, and work context.
- Helpful votes, requests, exchanges, and activity that improve cohort memory.

That reciprocity justifies stricter quality standards than a general consumer review site can sustain.

## Flywheel

```text
Private Trust -> Utility -> Contribution Incentives -> Portable Credibility
      ^                                                       |
      +-------------------------------------------------------+
```

1. Private Trust: cohort-scoped access, named reviews, and tenant boundaries.
2. Utility: founders find vendors and request missing recommendations.
3. Contribution Incentives: quality-adjusted points, sprints, badges, helpful votes, notifications, and activity.
4. Portable Credibility: public profiles, badge embeds, backlinks, structured data, and signed reputation packets.

## Current Implementation

The current app includes:

- Write/Connect/Grow hub navigation.
- Cohort-scoped vendor directory, vendor search, public vendor pages, and review modes.
- Founder and consumer reviews, image upload support, quality feedback, and disclosure handling.
- Vendor requests, targeted questions, admin fulfillment, invite flow, and cohort admin pages.
- Public founder profiles with `Person` JSON-LD, badge embeds, and profile view tracking.
- Public vendor pages with `Product`, `AggregateRating`, and public consumer `Review` JSON-LD.
- Points, badges, nominations, helpful votes, leaderboards, sprints, activity, and notifications.
- SEO guidance, backlink tracking, GSC OAuth, backlink snapshots, and digest emails.
- Signed reputation export/import and stored imported reputation packets.
- Founder credibility reports with signed machine-readable API output.

See `../OPERATING.md` for the detailed route map and verification commands.

## Public Authority Guardrails

- Public profiles are opt-in.
- Private cohort reviews, requests, invites, and admin activity must not leak into public profiles or public structured data.
- Startup links are editorial attribution links, not required reciprocal links.
- Badges must represent real criteria or explicit issuers; no paid badges.
- Do not promise ranking improvements from badges, links, or structured data.
- Do not automate reciprocal link exchange mechanics.
- Public leaderboards need privacy thresholds to reduce deanonymization risk.

## Strategic Risks

- Empty directory risk: without seed data and requests, founders will not return.
- Trust risk: anonymous or unverifiable founder reviews weaken the core promise.
- Privacy risk: private cohort content leaking into public pages would damage trust.
- SEO risk: backlink tooling can drift into spam incentives.
- Gamification risk: points and leaderboards can reward optimization over useful contributions.
- Scope risk: crawler integrations and broad network effects can distract from the private trust wedge.

## Near-Term Product Direction

The strongest next steps are:

- Add governance to imported reputation packets.
- Build automatic computable badge awards.
- Reframe points and tiers toward impact/credibility.
- Scope alumni/cross-cohort network effects into a small first milestone.
- Treat public-only `llms.txt`, public Q&A schema, and citation refinements as optional structured-data experiments, not required AI visibility levers.
