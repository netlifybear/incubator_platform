# AI SEO / GEO Through Reviews

## Status

Implemented for the high-impact public vendor review slice. Do not re-execute the JSON-LD implementation.

## Implemented

- Public vendor pages include `Product`, `AggregateRating`, and public consumer `Review` JSON-LD.
- Founder reviews remain private and are not exposed as public SEO inventory.
- Public founder profiles already include `Person` JSON-LD.
- GSC and backlink tracking exist for founders through existing SEO/backlink surfaces.

## Remaining Refinements

- Add `QAPage` or FAQ schema only if request/Q&A pages become public.
- Add richer founder/startup structured data only when the profile fields are explicit and reliable.
- Improve citation-oriented review card structure only where public content is already visible.

## Guardrails

- Keep JSON-LD aligned with visible public content.
- Use `JSON.stringify` for structured data payloads.
- Omit `aggregateRating` when there are no public reviews.
- Do not include private founder review text or cohort-scoped request content in public structured data.
