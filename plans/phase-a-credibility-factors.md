# Phase A: Credibility Factor Explainability

## Status

Implemented. Reference only; do not execute.

## Implemented

- Added `src/lib/credibility-factors.ts` with 6-factor computation and summary logic.
- Added public-safe presenter behavior through `toPublicCredibilityFactors()`.
- Added tests for factor scoring, thin-file behavior, and public data stripping.
- Added private credibility factors to `/grow`.
- Added public-safe factor summary to `/founder/[slug]/credibility`.
- Fixed review quality math to use the current 10-point `reviewContributionPoints()` maximum.

## Preserved Product Rules

- No "credit" terminology in new function names, file names, types, UI copy, or comments.
- Public UI omits the overall private summary, numeric values, review recency, private descriptions, and review text.
- Thin-file founders see getting-started/building-track-record copy instead of overconfident scoring.
- `/grow` reuses existing impact summary data where available to avoid duplicated reads.

## Verification Reference

- `node --test --test-concurrency=1 src/lib/credibility-factors.test.ts`
- `npm run lint`
- `npm run build`
