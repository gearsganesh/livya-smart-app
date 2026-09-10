# LIVYA AI Prototype → Production Map

Source: `LIVYA-AI-Prototype.html` v12 (10 Sep 2026).

The HTML prototype is the UX/functional specification. Production code must preserve its flows while replacing mock state with authenticated, persistent data.

## Patient application

| Prototype area | Production module | Primary data |
|---|---|---|
| Login / OTP | Auth | Supabase Auth, profiles |
| Home + widgets | Dashboard | patient dashboard, vitals, medicines, schedule |
| Health monitoring | Vitals | vitals, wearable readings, trends |
| Devices | Wearables | device connections, readings |
| Manual vital entry | Vitals | vital readings, offline queue |
| Alarms | Alert engine | thresholds, alerts, acknowledgements |
| Emergency SOS | Emergency | emergency events, contacts, location |
| Medicines | Medication | prescriptions, medicine schedule, adherence, stock |
| Hydration | Wellness tracking | hydration logs, goals |
| Health records | Records | records, files, extracted measurements |
| Upload + AI analysis | Records/AI | storage, extraction, review state |
| Prescription | Clinical | e-prescriptions, prescription items |
| Nutrition / My plan | Nutrition | plans, targets, recipes, coach notes |
| Programme | Programmes | programme definitions, enrolments, tracking |
| Recipe | Nutrition | recipes, diet-chart entries |
| Wellness / therapies | Therapy | services, therapists, bookings |
| Store / cart | Commerce | products, cart, orders |
| Lab tests | Diagnostics | tests, labs, bookings, results |
| Membership | Membership | plans, memberships, entitlements, usage |
| Scheduler | Scheduling | appointments/bookings/resources |
| LIVYA AI | AI | conversations, messages, analysis jobs |
| More / Profile | Account | profile, family, settings |

## Admin console

| Prototype area | Production module | Primary data |
|---|---|---|
| Dashboard | Operations | aggregate operational metrics |
| Patients | Patient management | patients, memberships, flags |
| Patient 360 | Clinical overview | all patient-linked clinical data |
| Vital alerts | Alert operations | alerts, rules, escalation |
| Records & AI review | Clinical review | reports, extracted values, approvals |
| Prescriptions | e-Rx | prescriptions, medicines, signatures |
| Medicine catalogue | Formulary | medicines, SKUs, stock partners |
| Nutrition | Diet chart | diet plans, targets, recipes, notes |
| Programmes | Programme management | programmes, milestones, enrolments |
| Therapies | Service management | services, therapists, capacity |
| Store & orders | Commerce operations | orders, pharmacy routing |
| Lab partners | Diagnostics operations | labs, tests, slots, results |
| Members & plan builder | Membership | plans, entitlements, members |
| Consumption monitor | Entitlements | usage, burn rate, cancellations |
| Scheduler | Resource scheduling | appointments, resources, locations |
| Roles & SOP | Governance | staff roles, permissions, SOPs, audit |
| Ask LIVYA AI | Staff AI | AI conversations + authorized context |

## Build rules

1. Do not replace the prototype with a new UX unless explicitly approved.
2. Every patient-facing record must be tied to an authenticated patient identity.
3. Every staff action must be permission checked and auditable.
4. Files belong in private Supabase Storage buckets with database metadata.
5. AI extraction is draft data until an authorized reviewer confirms it where the workflow requires review.
6. Publishable Supabase keys may exist in the browser; secret/service credentials must never be shipped to the client.
7. RLS must protect every exposed table.
8. Offline-capable flows must have a sync state and conflict strategy rather than silently pretending persistence exists.
