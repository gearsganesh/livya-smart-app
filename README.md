# LIVYA AI Smart App

Production rebuild of the LIVYA AI healthcare prototype using Next.js, TypeScript and Supabase.

## Stack

- Next.js 16
- React 19
- TypeScript
- Supabase Auth + Postgres + RLS
- Lucide icons

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set these values in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tiywldtrchjnmkkjgwmy.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

The publishable key belongs in the browser environment. Never put a Supabase secret/service-role key in `.env.local` for a frontend app or commit it to Git.

## Current production foundation

- Supabase project connected
- Core schema deployed
- RLS enabled on all clinical tables
- Auth profile bootstrap trigger deployed
- Patient self-creation policy deployed
- Email OTP / magic-link sign-in implemented
- Patient dashboard reads live vitals, medication schedule and appointments
- Manual vital entry writes to Supabase
- Admin navigation is restricted to users present in `staff_users`
- Responsive patient/admin shell implemented

## Database migrations

Migrations live in `supabase/migrations/` and are applied to the connected Supabase project as versioned changes.

## Build roadmap

1. Authentication and onboarding
2. Health monitoring + wearable sync
3. Medicines + e-prescriptions
4. Health records + Storage + AI extraction/review
5. Scheduling and care bookings
6. Nutrition, programmes and wellness
7. Labs, store and membership
8. Patient 360 admin console
9. LIVYA AI assistant
10. Production hardening, audit, observability and deployment
