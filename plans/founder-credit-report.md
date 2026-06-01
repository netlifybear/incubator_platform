# Founder Credit Report: Investor Signal Layer

## Status

Implemented. The app now includes a public credibility report page at `/founder/[slug]/credibility`, a signed machine-readable endpoint at `/api/credibility/[slug]`, and a Grow hub CTA. The report uses a print-friendly browser flow rather than a server-side PDF dependency.

Remaining follow-ups are privacy and verification refinements:

- Add explicit founder disclosure controls before showing backlink domains or richer GSC aggregates.
- Improve signature verification UX beyond the current signed report/JWT surfaces.
- Polish print/PDF output if investor sharing becomes a primary workflow.

## Concept

A public, verifiable credibility page for each founder that investors can use as a due diligence signal. Complements the existing JWT export with a human-readable + machine-readable report.

Current adjacent implementation: signed reputation export/import already exists, and public founder profiles already expose aggregate reputation stats. This plan should build a governed, investor-readable report on top of that baseline rather than re-create portability.

## Why This Completes the Loop

```
Write → Connect → Grow → Investor Signal
                             ↓
                    Portable reputation becomes
                    a real-world credential
```

Without this, the flywheel stops at "founder feels good about their profile." With this, the platform becomes part of a founder's fundraising toolkit — a direct incentive to contribute.

## What It Includes

### Public Report Page: `/founder/[slug]/credibility`

A clean, printable page structured like a credit report:

**Header:**
- Founder name + startup name + cohort badge
- "Last updated" timestamp
- Verifiable badge (SVG + hash for tamper-proofing)

**Section 1: Identity Verification**
- Cohort membership (name, dates)
- Profile completeness %
- Account age

**Section 2: Review Credibility**
- Total reviews written
- Average rating given
- Used vendor % (firsthand vs. recommendation ratio)
- Helpful vote ratio (upvotes / total votes received)
- Quality score trend (average quality % over time)

**Section 3: Badge Proof**
- All badges with type, description, issuer, issuance date
- Badge verification hash (so investor can confirm it wasn't forged)

**Section 4: Backlink Authority**
- Verified backlinks count
- Referring domain count
- GSC connection status if connected
- Domain lists and richer GSC metrics should remain explicit opt-in disclosures

**Section 5: Export & Verify**
- Print/save as PDF
- Download JWT (existing)
- Signed reputation packet for verification

### Machine-Readable Endpoint: `/api/credibility/[slug]`

Returns JSON with the same data, signed with `NEXTAUTH_SECRET` (same pattern as JWT export). Enables automated due diligence tools.

## Implementation Status

| Component | Status | Details |
|-----------|--------|---------|
| Credibility data | Done | Report data assembled for public page and API |
| Public report page | Done | Server-rendered report at `/founder/[slug]/credibility` |
| JSON API endpoint | Done | Signed JSON response at `/api/credibility/[slug]` |
| Badge/reputation verification | Partial | Signed report/JWT exists; hash-paste UX remains optional refinement |
| PDF export | Done | Browser print/save flow; no server-side PDF dependency |
| Link from `/grow` | Done | "Your credibility report" CTA |

## Privacy & Access

| Data | Visibility | Rationale |
|------|-----------|-----------|
| Founder name + startup | Public | Already on `/founder/[slug]` |
| Review stats (count, avg rating) | Public | Aggregate only — no review text exposed |
| Helpful vote ratio | Public | Aggregate signal |
| Badges + issuance dates | Public | Already on profile |
| Backlink counts | Public | Trust signal |
| Backlink domains | Opt-in | Domains can reveal marketing strategy or partner relationships |
| Individual review text | Private | Cohort-scoped, not in report |
| GSC data | Private or explicit opt-in aggregate only | Founder must connect GSC; raw search data should not become public by default |

## Open Questions

- Should the report be opt-in or automatically public? (Suggested: opt-in, default off, same as public profile)
- Should investors need to authenticate to view? (Suggested: no — public by design, like a credit report)
- Should the badge verification hash be embeddable on the founder's own site? (Like the SVG badge but for the full report)
- PDF: server-rendered via Puppeteer or just a print stylesheet? (Print stylesheet is simpler, no dependency)
- Should backlink domains and GSC metrics be founder-selected disclosures rather than automatically included?
