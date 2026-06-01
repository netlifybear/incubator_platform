# Operating Guide

### `weekly-digest` — GET `/api/cron/weekly-digest`

Weekly email digest for all cohort founders. Requires `CRON_SECRET` env var.

**Manual trigger (admin dashboard):**
`/admin/requests` → "Weekly digest" section → "Send digest now" button sends to the admin's cohort.

**Vercel (auto):** Cron is configured in `vercel.json` — every Monday at 9 AM UTC.
Set `CRON_SECRET` in Vercel project environment variables.

**Other providers (cron-job.org, GitHub Actions, etc.):**
```
curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain.com/api/cron/weekly-digest
```
Omitting `cohortId` sends to all cohorts sequentially.

### `sprints` — GET `/api/cron/sprints`

Auto-creates a monthly sprint for each cohort on the 1st of the month at 6 AM UTC.
Same `CRON_SECRET` auth as the digest endpoint.

## Routes

| Route | Purpose | Auth |
|-------|---------|------|
| `/` | Home — vendor directory + request form + onboarding banner | Founder |
| `/signin` | Magic-link sign-in (demo collapsed) | None |
| `/vendors` | Vendor directory with search, category filter, sort by name/rating/trending/reviews | Founder |
| `/vendors/[id]` | Vendor detail + guided/free review form + quality engine + CelebrationToast | Founder |
| `/top-vendors` | Vendor ranking page by authority score with tier badges | Founder |
| `/requests` | My request history (open/fulfilled/closed) | Founder |
| `/nominations` | Nominate a peer for a badge + see my nominations | Founder |
| `/leaderboard` | Cohort leaderboard by points (reviews, badges, helpful votes) | Founder |
| `/leaderboard/public` | Public cohort leaderboard (anonymous, accessible without auth) | None |
| `/rewards` | Point rules, personal breakdown, milestone tiers with progress bar | Founder |
| `/sprints` | Active sprint progress bar + leaderboard; past sprint history | Founder |
| `/exchanges` | Guest-post exchange requests (propose, accept/decline, mark published) | Founder |
| `/analytics` | Cohort analytics: review quality, backlink stats, founder stats | Founder |
| `/profile/settings` | Edit profile + quality dashboard + reputation portability (export/import JWT) | Founder |
| `/seo` | SEO education guidance | Founder |
| `/backlinks` | Backlink tracker + validation analysis panel + spam policy comparison UI (Google, Bing) | Founder |
| `/founder/[slug]` | Public founder profile (name, bio, badges, points, rank, Schema.org, copy link, portable badge embed) | None |
| `/invite/[token]` | Accept a cohort invite | None |
| `/admin/requests` | Admin dashboard: metrics, invites, request queue, sprint creation, admin badge award, nominations queue, founders badges with issuer labels | Admin |
| `/api/auth/[...nextauth]` | NextAuth handler | — |
| `/api/auth/gsc` | Google Search Console OAuth flow | Founder |
| `/api/badge/[slug]` | Embeddable SVG reputation badge (name, cohort, points, profile completeness) | None |
| `/api/badges/vendor-award` | Vendor badge award via secret (POST: founderEmail, badgeType, secret) | Vendor secret |
| `/api/badges/investor-award` | Investor badge award via secret (POST: founderEmail, badgeType, secret) | Investor secret |
| `/api/reputation/export` | Export reputation as signed JWT | Founder |
| `/api/reputation/import` | Import reputation from JWT (verified + stored) | Founder |

## Demo Accounts

All passwords are `password`.

| Email | Name | Role | Profile Slug | Seed Data |
|-------|------|------|--------------|-----------|
| `admin@example.com` | Avery Admin | admin | `avery-admin` | — |
| `maya@example.com` | Maya Chen | founder | `maya` | 1 review (Legal), 1 open request (Payroll), 1 badge (reviewer), 1 pending exchange request, 2 verified backlinks, 1 helpful vote received |
| `jordan@example.com` | Jordan Lee | founder | `jordan` | 1 review (Accounting), 1 badge (community_contributor), 1 pending backlink |

## Seed Data

Run `npx prisma db push && npm run db:seed` after schema changes (see README.md).

Creates:
- 1 cohort (Demo Incubator), 3 users (admin, 2 founders), 3 vendors (Legal, Accounting, Design)
- 2 reviews with helpful vote, 2 badges, 1 active sprint, 1 pending exchange request, 3 backlinks (mixed statuses), 1 open vendor request

## Verification

```bash
npm test          # 59 tests across 18 test files (node:test, node:assert/strict)
npm run build     # Next.js production build (27 routes including 2 new API routes)
```

## Smoke Test Flow

1. `npm run dev`
2. Open `http://localhost:3000/signin` — two options: magic-link or collapsed demo
3. Sign in as `maya@example.com` / `password`
4. Home page shows Demo Incubator vendors, category filters, open requests
5. Click a vendor → detail page with review(s), review form, helpful vote buttons
6. `/vendors` — search, filter by category, sort by name/rating/trending/most reviews; vendor cards show authority tier badges (Top Rated, Highly Rated, etc.)
7. `/top-vendors` — ranked leaderboard of vendors by authority score
8. `/leaderboard` — ranked by quality-adjusted review points, badges, and helpful votes
9. `/rewards` — point rules, personal breakdown, milestone tiers (Bronze→Platinum) with progress bar
10. `/sprints` — active Q2 sprint with progress bar, sprint leaderboard
11. `/exchanges` — incoming/outgoing guest-post requests, propose new exchange
12. `/analytics` — review quality, backlink, and founder stats
13. `/nominations` — nominate `jordan@example.com` for Community Contributor
14. `/profile/settings` — edit public profile fields; use "Export reputation" to generate a signed JWT
15. `/profile/settings` → "Import reputation" — paste the JWT to verify cross-incubator portability
16. `/founder/maya` — public profile (unauthenticated), badges, points, cohort rank, Schema.org JSON-LD, copy profile link, portable badge embed
17. `/leaderboard/public?cohort=demo-incubator` — public leaderboard (no auth, anonymous entries)
18. `/seo` — guidance page
19. `/backlinks` — add `example.com`, status badges, reachability checks, GSC connect, view link profile analysis (anchor text breakdown, velocity, natural link score)
20. Sign in as `admin@example.com` / `password`
21. `/admin/requests` — metrics, invites, request queue, create sprint, badge award, pending nominations, founder badges grid
22. Approve/reject the nomination from step 13
23. `/profile/settings` — "Review quality" section shows per-user quality dashboard (avg length, avg rating, helpful votes, strengths, improvement areas)
24. `/admin/requests` — Badge section shows issuer type labels (Auto/Admin/Vendor/Investor) on every badge definition; admin award form can award admin-approved badges only
25. `/backlinks` — Analysis panel now shows "Policy comparison" section linking to Google/Bing spam policies when violations are detected
26. `/api/badges/vendor-award` — Award a badge as a vendor using a shared secret. The `Vendor.badgeAwardSecret` database field stores an HMAC hash, not the raw secret.
27. `/api/badges/investor-award` — Award a badge as an investor using a shared secret. The `Investor.badgeAwardSecret` database field stores an HMAC hash, not the raw secret.
28. `/admin/requests` — External badge audit section shows recent vendor/investor award attempts without raw submitted secrets.

## Architecture

```
Server components     →  Page data fetching (async, direct Prisma)
Server actions        →  Mutations (form data → validate → DB → revalidate)
Client components     →  Interactivity (forms with useActionState, search UI)
Shared lib            →  Pure functions (validation, presenters, badges, quality engine)
Config                →  JSON rules files, badge definitions
```

Key libraries:
- `src/lib/auth.ts` — `getCurrentFounder()`, `getCurrentAdmin()` (both load cohort)
- `src/lib/email.ts` — email sending (Resend API in prod, console in dev)
- `src/lib/vendors.ts` — tenant-scoped vendor queries, authority score computation, tier labeling
- `src/lib/badges.ts` — auto badge computation + stored badge merge, admin award
- `src/lib/badge-award-attempts.ts` — rate limiting and audit logging for external badge award attempts
- `src/lib/nominations.ts` — peer nomination lifecycle
- `src/lib/backlinks.ts` — backlink CRUD + status verification
- `src/lib/backlink-analysis.ts` — anchor text diversity, link velocity, natural link score computation
- `src/lib/gsc.ts` — Google Search Console API client
- `src/lib/points.ts` — point computation (0-10 per review based on quality signals, 25/badge, 2/helpful vote)
- `src/lib/sprints.ts` — sprint active/history queries with contributor data
- `src/lib/guest-posts.ts` — guest-post exchange lifecycle
- `src/lib/helpful-votes.ts` — vote toggle, counts, user vote
- `src/lib/analytics.ts` — cohort analytics computation
- `src/lib/review-quality.ts` — quality analysis engine (pure functions)
- `src/lib/review-template.ts` — guided review template data model + natural-language composition
- `src/lib/reputation.ts` — JWT reputation packet generation, signing, verification, serialization
- `src/lib/review-quality-stats.ts` — per-user quality metrics computation (avg length, sentiment balance, helpful votes, strengths/improvements)
- `src/lib/backlink-analysis.ts` — anchor text diversity, link velocity, natural link score, spam policy comparison (Google, Bing)
- `src/hooks/useReviewQuality.ts` — debounced hook wrapping the engine

## Env Configuration

See `.env.example` for all required variables:

| Var | Required | Purpose |
|-----|----------|---------|
| `DATABASE_URL` | Yes | Prisma Postgres connection |
| `DIRECT_DATABASE_URL` | Yes | Direct Postgres connection |
| `NEXTAUTH_SECRET` | Yes | NextAuth JWT encryption |
| `NEXTAUTH_URL` | Yes | App base URL |
| `AUTH_GOOGLE_ID` | For GSC | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | For GSC | Google OAuth client secret |
| `RESEND_API_KEY` | For email | Resend transaction API key |
| `EMAIL_FROM` | For email | Sender address |
| `REPUTATION_SHARED_SECRET` | For cross-instance portability | Shared secret for signing/verifying reputation JWTs |
| `ISSUER_SECRET_PEPPER` | For external badge awards | Pepper used to HMAC vendor/investor award secrets before database lookup and attempt logging. Falls back to `NEXTAUTH_SECRET` in development. |

In development, email (magic-link + notifications) is logged to console — no Resend key needed.

## DB-Backed Test Setup

`npm test` includes integration tests that create and clean isolated cohorts, founders, vendors, reviews, helpful votes, badge award attempts, and admin metrics rows. The test runner loads `.env` through `src/lib/prisma.ts`, so local runs need the same `DATABASE_URL` and `DIRECT_DATABASE_URL` values used by Prisma/Next. Test records use unique `test-*` slugs and emails and are removed at the end of each test.

## MVP Thesis

The first useful product is a private, cohort-scoped trust layer that replaces repeated Slack/WhatsApp vendor recommendation threads. Public authority features follow — without trusted founder participation, the SEO layer is mostly decorative.

## Data Models

Full schema at `prisma/schema.prisma`. Key models:

- `Cohort`, `User`, `Vendor`, `Review`, `VendorRequest`, `Invite`
- `Badge` (issuerType, issuerId for multi-issuer: auto/admin/vendor/investor)
- `BadgeNomination`, `BacklinkLog` (anchorText, contextText, linkType, linkedAt)
- `HelpfulVote`, `Sprint`, `GuestPostExchange`, `GscState`, `ReputationImport`
- `Investor` (name, email, company, badgeAwardSecret HMAC hash)
- `Account`, `Session`, `VerificationToken` (NextAuth)

## Guardrails

- Links to startup sites should be editorial profile links, not required reciprocal links.
- Do not promise that any badge directly improves Google ranking.
- Do not create automated link-exchange mechanics.
- Private cohort reviews must never leak into public founder profiles.
- Badge award logic must be auditable in code or admin records.
- Backlink features are framed as monitoring/education, not guaranteed ranking improvement.
- Magic-link auth coexists with demo credentials (collapsed under details). Demo remains for dev speed.
- Public founder profiles are opt-in; invited founders start private until they explicitly enable a profile.
- Treat backlink "verified" status as domain reachability only unless page-level link verification is added.
- Do not let admin UI impersonate vendor or investor badge issuers; external issuer badges must come through issuer-specific routes.
- Store only hashed vendor/investor badge award secrets; rotate secrets by replacing the stored HMAC hash.
- External badge award routes record success/failure attempts and rate-limit repeated failures by issuer type and submitted-secret fingerprint.
- Admins can review recent external badge award attempts without seeing raw submitted secrets.
- Public cohort leaderboards are hidden below the configured founder-count threshold to reduce deanonymization risk.

## Known Constraints

- **Auth**: Magic-link (EmailProvider) + demo credentials (CredentialsProvider). Demo is collapsed under `<details>` on the sign-in page.
- **Next.js 16**: Breaking changes from earlier versions. Read `node_modules/next/dist/docs/` before writing code.
- **Lint rule**: `react-hooks/set-state-in-effect` — use `setTimeout` callbacks or derive state.
- **Prisma 7**: Regenerate client after schema changes (`npx prisma generate`).
- **Permissions**: Only cohort-scoped data is visible. Non-admin founders cannot access `/admin/*`.
- **GSC OAuth**: Requires Google Cloud credentials with `webmasters.readonly` scope and redirect URI `{NEXTAUTH_URL}/api/auth/gsc`.
