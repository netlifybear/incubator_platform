# Supabase + Vercel Demo Setup

Use this path for a hosted demo. Keep local-only `npx prisma dev` for local development, but use Supabase Postgres for the deployed Vercel site.

## Environment Variables

Set these in Vercel:

| Variable | Value |
|----------|-------|
| `NEXTAUTH_URL` | Your Vercel app URL, for example `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | A random secret from `openssl rand -base64 32` |
| `DATABASE_URL` | Supabase pooled Postgres connection string |
| `DIRECT_DATABASE_URL` | Supabase direct Postgres connection string |
| `REPUTATION_SHARED_SECRET` | A random secret from `openssl rand -base64 32` |
| `ISSUER_SECRET_PEPPER` | A random secret from `openssl rand -base64 32` |
| `CRON_SECRET` | A random secret from `openssl rand -base64 32` |

Do not use the Supabase publishable key as `DATABASE_URL`; Prisma needs a Postgres connection string. Do not commit database passwords or service-role keys.

## Schema And Seed

Run these locally with `.env` pointing at Supabase:

```bash
npx prisma db push
npm run db:seed
```

Then deploy on Vercel and test:

```text
maya@example.com / password
jordan@example.com / password
admin@example.com / password
```

## Connection Choice

- App runtime: pooled Supabase URL in `DATABASE_URL`.
- Prisma CLI/schema/seed: direct Supabase URL in `DIRECT_DATABASE_URL`.

This keeps serverless runtime traffic on the pooler while keeping schema operations on a direct database connection.
