# Phase B: Structured Credibility Report

## Status

Implemented. Reference only; do not execute.

## Implemented

- Reorganized `/founder/[slug]/credibility` into a formal 7-section credibility report.
- Promoted Credibility Summary to the first report section.
- Expanded Identity & Cohort Verification and moved the verifiable tag/hash into that section.
- Renamed/restructured Review History and added review freshness plus detailed-comment count.
- Renamed badge proof language to Contribution Signals.
- Added Helpfulness & Peer Validation with helpful vote count and distinct helpful voter count.
- Kept Backlink Authority and Export & Verification sections.

## Section Order

1. Credibility Summary
2. Identity & Cohort Verification
3. Review History
4. Contribution Signals
5. Helpfulness & Peer Validation
6. Backlink Authority
7. Export & Verification

## Guardrails

- Keep "credit" terminology out of UI copy.
- Keep individual founder review text private.
- Keep the signed report/JWT flow compatible with existing API behavior.
- Treat inquiry logging and deeper PDF/export polish as separate future slices.
