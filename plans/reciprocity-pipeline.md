# Reciprocity Pipeline: Platform To Founder

## Status

Mostly implemented. Remaining work is optional hardening or future product experimentation, not a direct implementation queue.

## Delivered Platform To Founder

- Verified cohort status and cohort-scoped founder identity.
- Public founder profiles with contribution tags and structured data.
- Backlink tracking, GSC integration, and SEO/backlink surfaces.
- Reputation export/import baseline and governed import approval flow.
- Public vendor structured data for consumer reviews.
- Founder credibility report and signed credibility endpoint.
- Write/Connect/Grow navigation and hubs.

## Delivered Founder To Platform

- Named cohort-scoped reviews with trust signals.
- Helpful votes, sprints, guest post exchanges, notifications, and cohort activity.
- Auto contribution tag computation on review submit, profile update, and cron.
- Cross-cohort vendor recommendation first pass using public-safe aggregate fields.
- Alumni helpful-voting policy with broader writes blocked.
- Referral/invite loop polish and public cohort aggregate privacy thresholds.

## Remaining Work

| Area | Status | Guidance |
|------|--------|----------|
| Public-key portability | Optional hardening | Shared-secret verification works. Full cross-instance public-key policy and key rotation remain future work. |
| Deeper network effects | Product-dependent | Scope a policy-backed slice before allowing broader cross-cohort or alumni write interactions. |
| Public structured data refinements | Optional | Add Q&A schema only if Q&A/request pages become public. |
| Impact/product UX | Product direction | Use `gamification-rethink.md` for future UX scope. Treat `contribution-feedback-loop.md` and `phase-a-credibility-factors.md` as implemented references. |

## Guardrails

- Do not expose private founder review text, request text, admin data, or private cohort activity.
- Keep alumni write expansion separate from helpful voting unless a policy-backed plan says otherwise.
- Keep public cohort aggregates behind privacy thresholds.
- Treat points as internal compatibility data, not a primary user-facing motivation.
