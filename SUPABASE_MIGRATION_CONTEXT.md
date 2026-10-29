# Supabase migration context

The application is being migrated from Supabase to a local Node.js/Express API,
PostgreSQL, and Prisma. There is no production Supabase data to migrate.

Security requirements:

- Keep login and authorization in place throughout the migration.
- Enforce every former RLS rule on the server; frontend gates are only UX.
- Do not retain hard-coded demo credentials or privilege-escalation flows.
- Do not remove a Supabase integration until its server-side replacement is complete and tested.

Migration reference sources:

- `supabase/migrations/` contains the source tables, RLS policies, triggers, and RPCs.
- `supabase/functions/` contains four former Edge Functions: food sync, library sync,
  internet quota, and SLA escalation.
- `prisma/schema.prisma` is the target database schema.
