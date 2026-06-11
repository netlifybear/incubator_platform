# Operating Guide

## Documentation Sources

- `README.md` — compact setup and verification entry point.
- `docs/product.md` — product thesis, flywheel, authority model, ethics, and strategic risks.
- `docs/traceability.md` — business thesis to feature/spec mapping.
- `plans/` — active and proposed implementation plans.
- `docs/README.md` — documentation map and ownership guide.

Workspace-root `doc/` and `docs/` folders are retired. Use `docs/` and `plans/` inside this nested repo for active project documentation.

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

### `contribution tags` — GET `/api/cron/badges`

Batch auto-tag computation for all founders. The route keeps the legacy `/api/cron/badges`
path for compatibility, but it checks each `computable: true` contribution tag type and
awards any the founder qualifies for. Idempotent — skips already-earned tags. Same
`CRON_SECRET` auth as the digest endpoint.

## Routes

| Route | Purpose | Auth |
|-------|---------|------|
| `/` | Write hub — vendor directory, request form, sprint/review context, onboarding banner | Founder |
| `/signin` | Magic-link sign-in (demo collapsed) | None |
| `/connect` | Connect hub — incoming questions, open requests, exchanges, cohort activity | Founder |
| `/grow` | Grow hub — profile, impact, backlinks, SEO actions, reputation export link | Founder |
| `/cohorts` | Public cohort directory with privacy-gated aggregate counts | None |
| `/cohorts/[slug]` | Public cohort aggregate page with privacy-gated top vendors and review counts | None |
| `/vendors` | Vendor directory with search, category filter, sort by name/rating/trending/reviews | Founder |
| `/vendors/[id]` | Vendor detail + founder/consumer review modes + quality engine + optional images | Founder/public hybrid |
| `/top-vendors` | Vendor ranking page by authority score with tier labels | Founder |
| `/requests` | My request history (open/fulfilled/closed) | Founder |
| `/founders` | Public founder directory for opted-in profiles | None |
| `/nominations` | Nominate a peer for a contribution tag + see my nominations | Founder |
| `/leaderboard` | Cohort contribution view ordered internally by reviews, contribution tags, and helpful votes | Founder |
| `/leaderboard/public` | Public cohort leaderboard (anonymous, accessible without auth) | None |
| `/rewards` | Contribution measurement, impact summary, and review streak | Founder |
| `/badges` | Contribution tag overview and earned tag context; legacy route name retained | Founder |
| `/sprints` | Active sprint progress bar + leaderboard; past sprint history | Founder |
| `/exchanges` | Guest-post exchange requests (propose, accept/decline, mark published) | Founder |
| `/analytics` | Cohort analytics: review quality, backlink stats, founder stats | Founder |
| `/profile/settings` | Edit profile + quality dashboard + reputation portability (export/import JWT) | Founder |
| `/seo` | SEO education guidance | Founder |
| `/backlinks` | Backlink tracker + validation analysis panel + spam policy comparison UI (Google, Bing) | Founder |
| `/founder/[slug]` | Public founder profile (name, bio, contribution tags, cohort context, Schema.org, copy link, portable tag embed) | None |
| `/founder/[slug]/credibility` | Public founder credibility report with aggregate reputation and verification data | None |
| `/invite` | Founder referral invite page | Founder |
| `/invite/[token]` | Accept a cohort invite | None |
| `/notifications` | Notification inbox and mark-read controls | Founder |
| `/admin` | Admin home with cohort overview and admin navigation | Admin |
| `/admin/cohorts` | Cohort management | Admin |
| `/admin/imports` | Reputation import approval queue and history | Admin |
| `/admin/users` | Founder/alumni role management | Admin |
| `/admin/vendors` | Admin vendor management | Admin |
| `/admin/reviews` | Admin founder/consumer review moderation | Admin |
| `/admin/requests` | Admin requests: invites, request queue, sprint creation, contribution tag award, nominations, digest | Admin |
| `/api/auth/[...nextauth]` | NextAuth handler | — |
| `/api/auth/gsc` | Google Search Console OAuth flow | Founder |
| `/api/badge/[slug]` | Embeddable SVG contribution tag/reputation badge; legacy route name retained | None |
| `/api/badges/vendor-award` | Vendor contribution tag award via secret; legacy route name retained | Vendor secret |
| `/api/badges/investor-award` | Investor contribution tag award via secret; legacy route name retained | Investor secret |
| `/api/credibility/[slug]` | Signed machine-readable founder credibility report | None |
| `/api/cron/weekly-digest` | Weekly cohort digest cron endpoint | Cron secret |
| `/api/cron/sprints` | Monthly sprint auto-creation and sprint-end notification cron endpoint | Cron secret |
| `/api/cron/badges` | Batch auto-tag computation for all founders; legacy route name retained | Cron secret |
| `/api/notifications` | Unread notification count API | Founder |
| `/api/reputation/export` | Export reputation as signed JWT | Founder |
| `/api/reputation/import` | Import reputation from JWT (verified + stored) | Founder |
| `/.well-known/reputation-public-key` | Public Ed25519 reputation verification key when configured | None |

## Demo Accounts

All passwords are `password`.

| Email | Name | Role | Profile Slug | Seed Data |
|-------|------|------|--------------|-----------|
| `admin@example.com` | Avery Admin | admin | `avery-admin` | — |
| `maya@example.com` | Maya Chen | founder | `maya` | 1 review (Legal), 1 open request (Payroll), 1 contribution tag (reviewer), 1 pending exchange request, 2 verified backlinks, 1 helpful vote received |
| `jordan@example.com` | Jordan Lee | founder | `jordan` | 1 review (Accounting), 1 contribution tag (community_contributor), 1 pending backlink |
| `lina@example.com` | Lina Patel | founder | `lina` | Harbor Accelerator founder with Legal and Payroll reviews for cross-cohort recommendations |
| `omar@example.com` | Omar Rivera | founder | `omar` | Harbor Accelerator founder with Legal and Payroll reviews for cross-cohort recommendations |

## Seed Data

Run `npx prisma db push && npm run db:seed` after schema changes (see README.md).

Creates:
- 2 cohorts (Demo Incubator and Harbor Accelerator), 5 users (admin, 4 founders), and 6 seeded vendors across Legal, Accounting, Design, and Payroll
- Demo Incubator reviews, helpful vote, contribution tags, active sprint, pending exchange request, backlinks, and one open vendor request
- Harbor Accelerator Legal and Payroll reviews used to demonstrate cross-cohort recommendations

## Verification

```bash
npm test          # DB-backed node:test suite
npm run build     # Next.js production build
```

## Smoke Test Flow

1. `npm run dev`
2. Open `http://localhost:3000/signin` — two options: magic-link or collapsed demo
3. Sign in as `maya@example.com` / `password`
4. Home page shows the Write hub with Demo Incubator vendors, category filters, open requests, and contribution context
5. Click a vendor → detail page with review(s), review form, helpful vote buttons
6. `/vendors` — search, filter by category, sort by name/rating/trending/most reviews; vendor cards show authority tier labels (Top Rated, Highly Rated, etc.)
7. `/top-vendors` — ranked leaderboard of vendors by authority score
8. `/leaderboard` — cohort contribution view ordered by reviews, contribution tags, and helpful votes
9. `/rewards` — contribution measurement, impact summary, and review streak
10. `/sprints` — active Q2 sprint with progress bar, sprint leaderboard
11. `/exchanges` — incoming/outgoing guest-post requests, propose new exchange
12. `/analytics` — review quality, backlink, and founder stats
13. `/nominations` — nominate `jordan@example.com` for Community Contributor
14. `/profile/settings` — edit public profile fields; use "Export reputation" to generate a signed JWT
15. `/profile/settings` → "Import reputation" — paste the JWT to verify cross-incubator portability
16. `/founder/maya` — public profile (unauthenticated), contribution tags, cohort context, Schema.org JSON-LD, copy profile link, portable tag embed
17. `/leaderboard/public?cohort=demo-incubator` — public leaderboard (no auth, anonymous entries)
18. `/cohorts/demo-incubator` — public cohort page with privacy-gated aggregates and Harbor Accelerator cross-cohort vendor recommendations
19. `/seo` — guidance page
20. `/backlinks` — add `example.com`, status labels, reachability checks, GSC connect, view link profile analysis (anchor text breakdown, velocity, natural link score)
21. `/connect` — incoming questions, open requests, pending exchanges, and cohort activity
22. `/grow` — profile status, impact metrics, backlinks, SEO actions, and reputation export link
23. `/notifications` — notification inbox and mark-read controls
24. Sign in as `admin@example.com` / `password`
25. `/admin` — admin home and links to requests, vendors, reviews, and cohorts
26. `/admin/requests` — metrics, invites, request queue, create sprint, contribution tag award, pending nominations, founder tags grid, digest actions
27. Approve/reject the nomination from step 13
28. `/profile/settings` — "Review quality" section shows per-user quality dashboard (avg length, avg rating, helpful votes, strengths, improvement areas)
29. `/admin/requests` — Contribution tag section shows issuer type labels (Auto/Admin/Vendor/Investor) on every tag definition; admin award form can award admin-approved tags only
30. `/admin/vendors` and `/admin/reviews` — create/delete cohort vendors and moderate cohort reviews
31. `/backlinks` — Analysis panel now shows "Policy comparison" section linking to Google/Bing spam policies when violations are detected
32. `/api/badges/vendor-award` — Award a contribution tag as a vendor using a shared secret. The `Vendor.badgeAwardSecret` database field stores an HMAC hash, not the raw secret.
33. `/api/badges/investor-award` — Award a contribution tag as an investor using a shared secret. The `Investor.badgeAwardSecret` database field stores an HMAC hash, not the raw secret.
34. `/admin/requests` — External tag audit section shows recent vendor/investor award attempts without raw submitted secrets.

## Architecture

```
Server components     →  Page data fetching (async, direct Prisma)
Server actions        →  Mutations (form data → validate → DB → revalidate)
Client components     →  Interactivity (forms with useActionState, search UI)
Shared lib            →  Pure functions (validation, presenters, contribution tags, quality engine)
Config                →  JSON rules files, contribution tag definitions
```

Key libraries:
- `src/lib/auth.ts` — `getCurrentFounder()`, `getCurrentAdmin()` (both load cohort)
- `src/lib/email.ts` — email sending (Resend API in prod, console in dev)
- `src/lib/vendors.ts` — tenant-scoped vendor queries, authority score computation, tier labeling
- `src/lib/contribution-tags.ts` — auto tag computation + stored tag merge, admin award
- `src/lib/badges.ts` — compatibility exports for legacy badge imports
- `src/lib/tag-award-attempts.ts` — rate limiting and audit logging for external tag award attempts
- `src/lib/badge-award-attempts.ts` — compatibility exports for legacy badge award imports
- `src/lib/nominations.ts` — peer nomination lifecycle
- `src/lib/backlinks.ts` — backlink CRUD + status verification
- `src/lib/backlink-analysis.ts` — anchor text diversity, link velocity, natural link score computation
- `src/lib/gsc.ts` — Google Search Console API client
- `src/lib/points.ts` — point computation (0-10 per review based on quality signals, 25/contribution tag, 2/helpful vote)
- `src/lib/sprints.ts` — sprint active/history queries with contributor data
- `src/lib/guest-posts.ts` — guest-post exchange lifecycle
- `src/lib/helpful-votes.ts` — vote toggle, counts, user vote
- `src/lib/tenant-policy.ts` — cohort access, write, alumni, and helpful-vote participation policy
- `src/lib/analytics.ts` — cohort analytics computation
- `src/lib/review-quality.ts` — quality analysis engine (pure functions)
- `src/lib/review-template.ts` — guided review template data model + natural-language composition
- `src/lib/reputation.ts` — JWT reputation packet generation, signing, verification, serialization
- `src/lib/notifications.ts` — notification creation, unread counts, listing, and mark-read helpers
- `src/lib/activity.ts` — cohort activity recording and feed queries
- `src/lib/export-reputation.ts` — reputation export payload and JWT helpers
- `src/lib/review-quality-stats.ts` — per-user quality metrics computation (avg length, sentiment balance, helpful votes, strengths/improvements)
- `src/hooks/useReviewQuality.ts` — debounced hook wrapping the engine

## Env Configuration

See `.env.example` for all required variables:

| Var | Required | Purpose |
|-----|----------|---------|
| `DATABASE_URL` | Yes | App runtime database connection. Use the pooled Supabase Postgres URL for Vercel demos, or the `prisma+postgres://...` URL printed by `npx prisma dev` for local Prisma Postgres. |
| `DIRECT_DATABASE_URL` | Yes | Direct Postgres connection used by Prisma CLI/schema/seed commands. Use the direct Supabase URL for Vercel demos, or the direct local URL printed by `npx prisma dev`. |
| `NEXTAUTH_SECRET` | Yes | NextAuth JWT encryption |
| `NEXTAUTH_URL` | Yes | App base URL |
| `AUTH_GOOGLE_ID` | For GSC | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | For GSC | Google OAuth client secret |
| `RESEND_API_KEY` | For email | Resend transaction API key |
| `EMAIL_FROM` | For email | Sender address |
| `REPUTATION_SHARED_SECRET` | For cross-instance portability | Shared secret for signing/verifying reputation JWTs |
| `REPUTATION_PRIVATE_KEY` | Optional for reputation portability | Ed25519 private key for signing reputation exports |
| `REPUTATION_PUBLIC_KEY` | Optional for reputation portability | Ed25519 public key served from `/.well-known/reputation-public-key` |
| `REPUTATION_ISSUER` | Optional for reputation portability | Public issuer URL written into reputation JWT exports; imports still use shared-secret verification unless source-bound public-key trust is implemented |
| `ISSUER_SECRET_PEPPER` | For external contribution tag awards | Pepper used to HMAC vendor/investor award secrets before database lookup and attempt logging. Falls back to `NEXTAUTH_SECRET` in development. |

In development, email (magic-link + notifications) is logged to console — no Resend key needed.

## DB-Backed Test Setup

`npm test` includes integration tests that create and clean isolated cohorts, founders, vendors, reviews, helpful votes, contribution tag award attempts, and admin metrics rows. The test runner loads `.env` through `src/lib/prisma.ts`, so local runs need the same `DATABASE_URL` and `DIRECT_DATABASE_URL` values used by Prisma/Next. Test records use unique `test-*` slugs and emails and are removed at the end of each test.

Interrupted or failed local test runs can leave disposable fixtures in the shared development database. Before UX audits of public directories such as `/cohorts`, run:

```bash
npm run db:cleanup-tests:dry-run
npm run db:cleanup-tests
```

The cleanup script only targets local test prefixes (`test-*`, `cf-*`, `impact-*`, `cohort-impact-*`, `leaderboard-test-*`, and `notif-test-*`) and leaves seeded demo records such as `demo-incubator`, `harbor-accelerator`, `maya@example.com`, and `jordan@example.com` intact. Use the dry run first when another agent may have just updated the project.

## MVP Thesis

The first useful product is a private, cohort-scoped trust layer that replaces repeated Slack/WhatsApp vendor recommendation threads. Public authority features follow — without trusted founder participation, the SEO layer is mostly decorative.

## Data Models

Full schema at `prisma/schema.prisma`. Key models:

- `Cohort`, `User`, `Vendor`, `Review`, `VendorRequest`, `Invite`
- `ContributionTag` (issuerType, issuerId for multi-issuer: auto/admin/vendor/investor; mapped to the legacy `Badge` table)
- `TagNomination` (mapped to the legacy `BadgeNomination` table), `BacklinkLog` (anchorText, contextText, linkType, linkedAt)
- `HelpfulVote`, `Sprint`, `GuestPostExchange`, `GscState`, `Notification`, `ActivityEvent`, `ReputationImport`
- `Investor` (name, email, company, badgeAwardSecret HMAC hash; legacy column name)
- `Account`, `Session`, `VerificationToken` (NextAuth)

## Guardrails

- Links to startup sites should be editorial profile links, not required reciprocal links.
- Do not promise that any contribution tag directly improves Google ranking.
- Do not create automated link-exchange mechanics.
- Private cohort reviews must never leak into public founder profiles.
- Contribution tag award logic must be auditable in code or admin records.
- Backlink features are framed as monitoring/education, not guaranteed ranking improvement.
- Magic-link auth coexists with demo credentials (collapsed under details). Demo remains for dev speed.
- Public founder profiles are opt-in; invited founders start private until they explicitly enable a profile.
- Treat backlink "verified" status as domain reachability only unless page-level link verification is added.
- Do not let admin UI impersonate vendor or investor tag issuers; external issuer tags must come through issuer-specific routes.
- Store only hashed vendor/investor tag award secrets; rotate secrets by replacing the stored HMAC hash.
- External tag award routes record success/failure attempts and rate-limit repeated failures by issuer type and submitted-secret fingerprint.
- Admins can review recent external tag award attempts without seeing raw submitted secrets.
- Public cohort leaderboards are hidden below the configured founder-count threshold to reduce deanonymization risk.

## Known Constraints

- **Auth**: Magic-link (EmailProvider) + demo credentials (CredentialsProvider). Demo is collapsed under `<details>` on the sign-in page.
- **Next.js 16**: Breaking changes from earlier versions. Read `node_modules/next/dist/docs/` before writing code.
- **Lint rule**: `react-hooks/set-state-in-effect` — use `setTimeout` callbacks or derive state.
- **Prisma 7**: Regenerate client after schema changes (`npx prisma generate`).
- **Permissions**: Only cohort-scoped data is visible. Non-admin founders cannot access `/admin/*`.
- **GSC OAuth**: Requires Google Cloud credentials with `webmasters.readonly` scope and redirect URI `{NEXTAUTH_URL}/api/auth/gsc`.
