# AI SEO / GEO Through Reviews

## Current State

- Public vendor pages and founder profiles exist, crawlable, indexed
- Review text is on the public web — AI crawlers can find it
- Backlinks from founder startups → platform improve domain authority
- GSC is wired for individual founders (oauth2)
- `/seo` page tracks GSC + backlink verification per founder

## Gap

- No structured data markup for reviews (JSON-LD)
- No AI-friendly site overview (llms.txt)
- No Q&A / FAQ schema on targeted request pages
- No deliberate citation optimization in review content

## Implementation Plan

### 1. Review JSON-LD on Vendor Pages

Add `Review` + `AggregateRating` schema markup to public vendor pages.

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

This is the highest-impact single change — it makes every review immediately structurable by AI crawlers (Google, ChatGPT, Perplexity, Gemini).

**Files:** `src/app/vendors/[vendorId]/page.tsx` — add a `<script type="application/ld+json">` block with the JSON-LD, computed server-side from vendor + reviews data.

**Risk:** None. JSON-LD in a script tag is invisible to users, harmless if malformed.

### 2. Profile JSON-LD on Founder Pages

Add `Person` schema to public founder profile pages.

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

**Files:** `src/app/founder/[slug]/page.tsx` — similar JSON-LD block.

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

### 4. Q&A Schema on Request/Vendor Pages

Targeted request pages (or the vendor page sections where Q&A exists) get `QAPage` schema.

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

This is lower priority than JSON-LD — the script tags already give AI crawlers everything they need.

## Effort Estimate

| Item | Effort | Impact |
|------|--------|--------|
| Review JSON-LD on vendor pages | ~1h | High — unlocks structured review data for all AI crawlers |
| Profile JSON-LD on founder pages | ~30min | Medium — strengthens entity recognition |
| llms.txt | ~30min | Medium — improves crawl efficiency |
| Q&A schema | ~1h | Low-medium — depends on whether request pages are public |
| Citation optimization | ~2h | Low — nice-to-have after JSON-LD |

Total: ~5h for the full scope. The first two items (JSON-LD on vendors + founders) cover 80% of the value in ~1.5h.

## Open Questions

- Are targeted request pages publicly accessible? (currently cohort-scoped)
- Should llms.txt reference cohort pages or only public pages?
- Do we want an `/llms-full.txt` alternative with more detail?
