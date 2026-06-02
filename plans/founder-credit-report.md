# Founder Credibility Report

## Status

Implemented. The old "credit report" framing remains only in this historical filename and plan context; current product language should prefer credibility/report wording.

## Implemented

- Public credibility report page at `/founder/[slug]/credibility`.
- Signed machine-readable endpoint at `/api/credibility/[slug]`.
- Grow hub CTA linking to the founder's credibility report.
- Browser print/save flow for PDF-style sharing.
- Aggregate review, badge, backlink, and verification data assembled for the report.

## Privacy Model

| Data | Visibility |
|------|------------|
| Founder name, startup, public cohort context | Public when public profile is enabled |
| Review counts and aggregate review stats | Public aggregate only |
| Badges and contribution signals | Public aggregate/profile signal |
| Backlink counts | Public aggregate |
| Backlink domains and richer GSC metrics | Explicit opt-in only |
| Individual founder review text | Private |
| Raw GSC data | Private or explicit opt-in aggregate only |

## Remaining Refinements

- Add clearer founder disclosure controls before showing backlink domains or richer GSC aggregates.
- Improve signature verification UX beyond the current signed report/JWT surfaces.
- Polish print/PDF output only if investor sharing becomes a primary workflow.

## Guardrails

- Keep individual review text out of public report surfaces.
- Keep report access aligned with public profile opt-in.
- Do not introduce server-side PDF dependencies unless the sharing workflow requires it.
