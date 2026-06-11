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

If a Supabase database password contains special characters, URL-encode the password segment in both Postgres URLs before putting them in `.env` or Vercel. This is especially important for `$`, because Next.js expands env values and can otherwise shorten the password at local dev startup.

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

- Production app runtime: pooled Supabase URL in `DATABASE_URL`.
- Local development app runtime: direct Supabase URL in `DIRECT_DATABASE_URL` when present.
- Prisma CLI/schema/seed: direct Supabase URL in `DIRECT_DATABASE_URL`.

This keeps serverless runtime traffic on the pooler while keeping local development and schema operations on a direct database connection.
