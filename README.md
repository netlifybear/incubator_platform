# Incubator Trust Platform

Cohort knowledge turned into portable founder credibility.

## Status

The platform implementation is built through the private trust loop, public credibility flywheel, SEO education/backlink tooling, review-quality engine, reputation portability, multi-issuer contribution tags, and trust/safety guardrails.

Use these docs by purpose:

- `OPERATING.md` — route map, demo accounts, smoke flow, architecture, env vars, DB-backed test setup, and implementation guardrails.
- `docs/product.md` — product thesis, flywheel, public authority guardrails, and strategic risks.
- `docs/traceability.md` — business thesis to feature/spec mapping.
- `plans/` — current/future implementation plans. Some files are intentionally marked implemented or deferred to prevent stale work.
- `docs/README.md` — documentation map and ownership guide.

## Setup

```bash
npm install
```

Configure `.env` (see `.env.example` for all vars):

```bash
DATABASE_URL="prisma+postgres://..."
DIRECT_DATABASE_URL="postgres://..."
NEXTAUTH_SECRET="generate-a-random-secret"
NEXTAUTH_URL="http://localhost:3000"
```

For a Vercel + Supabase demo, set `DATABASE_URL` to the pooled Supabase Postgres
connection string and `DIRECT_DATABASE_URL` to the direct Supabase Postgres
connection string. Keep both values in environment variables only; do not commit
database passwords. URL-encode special characters in database passwords,
especially `$`, so local Next.js env expansion does not alter the connection
string.

Push schema and seed demo data:

```bash
npx prisma db push
npm run db:seed
```

Run:

```bash
npm run dev
```

See `OPERATING.md` for demo accounts, full route map, smoke test flow, architecture guide, and known constraints.

## Verification

```bash
npm test          # DB-backed node:test suite
npm run build     # Next.js production build
```
