# Founder Credit Report: Investor Signal Layer

## Concept

A public, verifiable credibility page for each founder that investors can use as a due diligence signal. Complements the existing JWT export with a human-readable + machine-readable report.

## Why This Completes the Loop

```
Write → Connect → Grow → Investor Signal
                             ↓
                    Portable reputation becomes
                    a real-world credential
```

Without this, the flywheel stops at "founder feels good about their profile." With this, the platform becomes part of a founder's fundraising toolkit — a direct incentive to contribute.

## What It Would Include

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
- Referring domains (list)
- GSC data summary if connected

**Section 5: Export & Verify**
- Download PDF
- Download JWT (existing)
- Verify badge on this page (paste hash to confirm)

### Machine-Readable Endpoint: `/api/credibility/[slug]`

Returns JSON with the same data, signed with `NEXTAUTH_SECRET` (same pattern as JWT export). Enables automated due diligence tools.

## What It Requires

| Component | Effort | Details |
|-----------|--------|---------|
| Credibility data function | ~1h | `getFounderCredibility(slug)` querying reviews, badges, backlinks, votes |
| Public report page | ~2h | Clean printable layout, sections 1-5, server-rendered |
| JSON API endpoint | ~1h | Signed JSON response, same auth pattern as JWT export |
| Badge verification hash | ~1h | HMAC over badge data so investors can verify independently |
| PDF export | ~2h | Server-side render-to-PDF or print stylesheet |
| Link from /grow | ~0.5h | "Your credibility report" CTA |
| **Total** | **~7.5h** | |

## Privacy & Access

| Data | Visibility | Rationale |
|------|-----------|-----------|
| Founder name + startup | Public | Already on `/founder/[slug]` |
| Review stats (count, avg rating) | Public | Aggregate only — no review text exposed |
| Helpful vote ratio | Public | Aggregate signal |
| Badges + issuance dates | Public | Already on profile |
| Backlink domains | Public | Trust signal |
| Individual review text | Private | Cohort-scoped, not in report |
| GSC data | Opt-in | Founder must connect GSC |

## Open Questions

- Should the report be opt-in or automatically public? (Suggested: opt-in, default off, same as public profile)
- Should investors need to authenticate to view? (Suggested: no — public by design, like a credit report)
- Should the badge verification hash be embeddable on the founder's own site? (Like the SVG badge but for the full report)
- PDF: server-rendered via Puppeteer or just a print stylesheet? (Print stylesheet is simpler, no dependency)
