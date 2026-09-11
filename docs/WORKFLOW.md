# LIVYA production workflow

## Trust boundaries

- Supabase Auth is the identity authority.
- Supabase/Postgres is the system of record for patient, clinical and operational data.
- FastAPI owns business workflows, health-score calculations, AI orchestration, privileged writes, webhooks and audit events.
- Client/mobile may use Supabase directly only for RLS-safe user-scoped reads/writes where no business invariant is bypassed.
- Admin UI never grants itself privilege. Staff identity and role are checked server-side and again by RLS/API authorization.
- AI output is advisory until validated. It must not silently overwrite source clinical data.

## Patient flow

1. Sign in with Supabase Auth.
2. Resolve `profiles` and the user's `patients` row.
3. Load dashboard from real vitals, health metrics, medicines/adherence, records, appointments and alerts.
4. Wearable/manual vitals are stored with source and measured timestamp.
5. Threshold evaluation creates alerts. Critical alerts are routed to the configured clinical workflow.
6. Daily check-ins store journal context plus structured mood/focus/hydration metrics.
7. Prescriptions generate medication schedules; adherence events update schedule state.
8. Health record upload writes a private Storage object and `health_records` row.
9. A background processing job extracts/normalizes measurements and produces an AI summary. Raw source remains immutable.
10. Clinical review accepts/rejects extracted measurements and records reviewer/time.
11. Health score/trends are derived from validated data and persisted as versioned health metrics.
12. Appointments, programme tasks and notifications are generated from the same patient identity.

## Admin flow

1. Sign in.
2. Verify JWT using Supabase SSR claims.
3. Resolve active `staff_users` row.
4. Enforce role at route, API and RLS layers.
5. Patient 360 aggregates profile, vitals, alerts, records, prescriptions, adherence, appointments and programme state.
6. Every privileged mutation emits an append-only `audit_log` event with non-sensitive metadata.

## Roles

- `admin`: full operational access and staff/settings management.
- `clinical`: patient clinical review, alerts and records.
- `doctor`: clinical review and prescriptions.
- `nutritionist`: assigned nutrition/programme workflows.
- `therapist`: assigned therapy/programme workflows.
- `operations`: appointments, logistics and programme operations.
- `billing`: subscriptions/payments only.
- `support`: limited patient support/read access; no clinical mutation.

## Record + AI state machine

`uploaded -> queued -> processing -> extracted -> review_required -> reviewed`

Failure is explicit: `processing_failed`. Retry creates a new job attempt; it does not destroy the original record. Store operational metadata in processing logs, never report text, prompts, access tokens, secrets or raw PHI payloads.

## Deployment gates

A release may reach production only when:

1. Supabase migrations apply cleanly on a fresh database and schema/RLS diagnostics pass.
2. Client and admin TypeScript checks/builds pass.
3. FastAPI tests pass, including unauthenticated 401, cross-user denial, staff role denial and webhook signature tests.
4. No service-role/payment/AI secrets are exposed to browser/mobile bundles.
5. Client, admin and API use separate Vercel projects/root directories and correct environment variables.
6. Production smoke test verifies auth, dashboard, check-in, record upload, staff access and logout.

## Required next implementation slices

1. Replace remaining dashboard/demo arrays with repository/API data.
2. Add explicit FastAPI patient-dashboard aggregate contract shared by client/mobile.
3. Implement record upload + private Storage signed access + processing job table/worker.
4. Implement medication adherence events and schedule generation.
5. Add role dependencies to privileged FastAPI endpoints and audit writes.
6. Add E2E tests for patient and staff critical paths.
