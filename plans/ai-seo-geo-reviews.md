# AI SEO / GEO Through Reviews

## Current State

- Public vendor pages and founder profiles exist
- Public vendor pages expose consumer reviews to anonymous crawlers
- Named founder reviews remain behind the signed-in cohort boundary
- Founder profile pages already include `Person` JSON-LD
- Backlinks from founder startups → platform improve domain authority
- GSC is wired for individual founders (oauth2)
- `/seo` page tracks GSC + backlink verification per founder

## Gap

- No structured data markup for public vendor reviews (JSON-LD)
- No AI-friendly site overview (llms.txt)
- No Q&A / FAQ schema on targeted request pages
- No deliberate citation optimization in review content

## Implementation Plan

### 1. Review JSON-LD on Vendor Pages

Add `Review` + `AggregateRating` schema markup to public vendor pages, based only on reviews visible to the current audience.

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

- `src/app/vendors/[vendorId]/page.tsx` — add a `<script type="application/ld+json">` block with the JSON-LD, computed server-side from vendor + consumer reviews data.
- `src/lib/vendors.ts` — either reuse `getConsumerReviewsForVendor` or add a helper that returns the exact public review fields needed by JSON-LD.

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

### 3. llms.txt

Generate an `llms.txt` at the root that lists all public pages with descriptions, helping AI crawlers discover the full site structure.

```
# Incubator Trust
> Private trust network for incubator founders

## Vendors
- /vendors/[id]: Vendor detail page with founder reviews and ratings
- /founders: Directory of verified cohort founders
- /founder/[slug]: Public founder profile with reputation and badges
```

**Files:** `src/app/llms.txt/route.ts` — dynamic route that queries public vendors and founders, renders plaintext.

Keep this public-only. Do not list cohort-scoped pages, private admin pages, private request queues, or reputation import/export endpoints. The existing sitemap and robots configuration are also public-only, so `llms.txt` should follow that boundary.

### 4. Q&A Schema on Request/Vendor Pages

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

### 5. AI Citation Optimization

Structure review content to maximize AI extractability:

- Wrap key metrics (rating, usedVendor, workType) in microdata or visible `<data>` attributes
- Ensure review date, author name, and rating are always in predictable positions within the DOM
- Add a visible "key details" section to each review card with structured layout

This is lower priority than public JSON-LD and `llms.txt`. For founder reviews, prioritize clarity for signed-in users over public citation optimization unless the privacy model changes.

## Effort Estimate

| Item | Effort | Impact |
|------|--------|--------|
| Public review JSON-LD on vendor pages | ~1h | High — unlocks structured public consumer review data for crawlers |
| Profile JSON-LD refinements | ~30min | Low-medium — already implemented; useful if richer public profile fields exist |
| llms.txt | ~30min | Medium — improves crawl efficiency |
| Q&A schema | Deferred | Low until public Q&A/request pages exist |
| Citation optimization | ~2h | Low — nice-to-have after JSON-LD |

Recommended first pass: vendor JSON-LD + `llms.txt` in ~1.5h. Founder JSON-LD is already in place.

## Open Questions

- Should public vendor JSON-LD include only consumer reviews, or should there be an explicit product decision to expose selected founder reviews publicly?
- Should `llms.txt` include every public vendor URL or only directory-level routes until vendor quality thresholds are met?
- Do we want an `/llms-full.txt` alternative with more detail?
