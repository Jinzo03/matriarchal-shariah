© 2026 [Jinzo03]. All rights reserved. This project is proprietary and governed by the MatriArchive Proprietary License v1.0.

# MatriArchive

MatriArchive is a Next.js 16 + Prisma app for building and browsing a connected universe of entities, relationships, revisions, media, and imports.

## Local development

1. Set `DATABASE_URL` in `.env` to your local Postgres database.
2. Generate the Prisma client:

```bash
pnpm run db:generate
```

3. Apply local migrations during development:

```bash
pnpm prisma migrate dev
```

4. Start the app:

```bash
pnpm dev
```

## Vercel deployment

This app should use a hosted Postgres database in Vercel, not `localhost`.

1. Create or connect a hosted Postgres database such as Neon.
2. In Vercel, set `DATABASE_URL` for `Production`.
3. Set `DATABASE_URL` for `Preview` too if you want preview deployments to work.
4. In Vercel project settings, set the build command to:

```bash
pnpm run vercel-build
```

That build command will:

- generate Prisma Client
- apply pending Prisma migrations with `prisma migrate deploy`
- build the Next.js app

## Database commands

Generate Prisma client:

```bash
pnpm run db:generate
```

Apply pending production/staging migrations:

```bash
pnpm run db:migrate:deploy
```

Run the seed script intentionally:

```bash
ALLOW_DESTRUCTIVE_SEED=true pnpm run db:seed
```

The current seed script deletes existing entity data before inserting sample data, so it is protected behind `ALLOW_DESTRUCTIVE_SEED=true`.

## Content import

If you already have universe package JSON files, prefer importing real content instead of running the destructive sample seed.

Examples:

```bash
pnpm run import:dry-run
pnpm run import:content
```
