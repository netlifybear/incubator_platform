# AI SEO / GEO Through Reviews

## Status

Public vendor review JSON-LD has been implemented on `/vendors/[vendorId]` for public consumer reviews. Do not re-execute that first-pass task.

Remaining work is optional/refinement work:

- Q&A schema is deferred until there are public Q&A or request pages.
- Citation optimization and richer profile JSON-LD are lower-priority refinements.

## Current State

- Public vendor pages and founder profiles exist
- Public vendor pages expose consumer reviews to anonymous crawlers
- Public vendor pages include `Product`, `AggregateRating`, and `Review` JSON-LD from public consumer reviews only
- Named founder reviews remain behind the signed-in cohort boundary
- Founder profile pages already include `Person` JSON-LD
- Backlinks from founder startups → platform improve domain authority
- GSC is wired for individual founders (oauth2)
- `/seo` page tracks GSC + backlink verification per founder

## Gap

- Public vendor review JSON-LD is implemented
- No Q&A / FAQ schema on targeted request pages, deferred until those pages are public
- No deliberate citation optimization in review content, lower priority after JSON-LD

## Implementation Notes

### 1. Review JSON-LD on Vendor Pages - Implemented

`Review` + `AggregateRating` schema markup has been added to public vendor pages, based only on reviews visible to the public audience.

- Anonymous/public page: include consumer reviews only
- Signed-in cohort page: founder reviews can be rendered for users, but should not be treated as public SEO inventory unless the product intentionally exposes them

```
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Northstar Startup Counsel",
  "category": "Legal",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.5",
    "reviewCount": "12",
    "bestRating": "5"
  },
  "review": [
    {
      "@type": "Review",
      "author": { "@type": "Person", "name": "Maya Chen" },
      "datePublished": "2026-01-15",
      "reviewBody": "Clear startup package, fast turnaround...",
      "reviewRating": { "@type": "Rating", "ratingValue": "5" }
    }
  ]
}
```

This is the highest-impact single change for public vendor pages. It makes public consumer reviews structurable by AI crawlers (Google, ChatGPT, Perplexity, Gemini) without leaking private cohort review content.

**Files:**

- `src/app/vendors/[vendorId]/page.tsx` includes the `<script type="application/ld+json">` block and computes JSON-LD server-side from vendor + public consumer review data.
- `src/lib/vendors.ts` exposes the consumer review data used by the page.

**Risk:** Medium if implemented carelessly. JSON-LD is invisible to users, but crawlers may consume it as authoritative. Keep it aligned with visible public content, escape with `JSON.stringify`, do not include private founder reviews for anonymous pages, and omit `aggregateRating` when there are no public reviews.

### 2. Profile JSON-LD on Founder Pages

Already implemented on public founder profile pages. Keep this as a refinement area rather than a first implementation task.

```
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Maya Chen",
  "description": "Founder building workflow software for local service businesses.",
  "knowsAbout": ["startups", "SaaS", "incorporation"],
  "memberOf": { "@type": "Organization", "name": "Demo Incubator" }
}
```

**Files:** `src/app/founder/[slug]/page.tsx`

Potential refinements:

- Add `sameAs` when a founder has verified public profile URLs
- Add `worksFor` or `founder`/`alumniOf` style organization fields if the product collects reliable startup/incubator metadata
- Avoid adding speculative `knowsAbout` terms unless they come from explicit profile fields or reviewed categories

### 3. Q&A Schema on Request/Vendor Pages

Defer until there are public Q&A pages. Current targeted request workflows are cohort-scoped, so adding `QAPage` to private request content would be misleading for crawlers and could expose content assumptions the public cannot verify.

```
{
  "@context": "https://schema.org",
  "@type": "QAPage",
  "mainEntity": {
    "@type": "Question",
    "name": "Looking for a payroll provider for contractors + W-2",
    "text": "Looking for a payroll provider that can handle contractors...",
    "answerCount": 0,
    "author": { "@type": "Person", "name": "Maya Chen" }
  }
}
```

### 4. AI Citation Optimization

Structure review content to maximize AI extractability:

- Wrap key metrics (rating, usedVendor, workType) in microdata or visible `<data>` attributes
- Ensure review date, author name, and rating are always in predictable positions within the DOM
- Add a visible "key details" section to each review card with structured layout

This is lower priority than public JSON-LD. For founder reviews, prioritize clarity for signed-in users over public citation optimization unless the privacy model changes.

## Effort Estimate

| Item | Effort | Impact |
|------|--------|--------|
| Public review JSON-LD on vendor pages | Done | High — unlocks structured public consumer review data for crawlers |
| Profile JSON-LD refinements | ~30min | Low-medium — already implemented; useful if richer public profile fields exist |
| Q&A schema | Deferred | Low until public Q&A/request pages exist |
| Citation optimization | ~2h | Low — nice-to-have after JSON-LD |

Recommended next pass: skip vendor JSON-LD because it is done. Add Q&A schema only if request/Q&A pages become public.

## Open Questions

- Should public vendor JSON-LD include only consumer reviews, or should there be an explicit product decision to expose selected founder reviews publicly?
