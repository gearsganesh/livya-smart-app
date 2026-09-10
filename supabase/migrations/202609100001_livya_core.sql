create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  email text,
  avatar_url text,
  date_of_birth date,
  gender text,
  city text,
  abha_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.staff_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null default 'agent',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  profile_id uuid references public.profiles(id) on delete set null,
  patient_code text unique,
  care_owner_id uuid references public.staff_users(id) on delete set null,
  status text not null default 'active',
  plan_name text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  relationship text not null,
  caregiver_access boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.vitals (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  vital_type text not null,
  value numeric,
  secondary_value numeric,
  unit text,
  source text not null default 'manual',
  measured_at timestamptz not null default now(),
  sync_status text not null default 'synced',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.vital_thresholds (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  vital_type text not null,
  low_limit numeric,
  high_limit numeric,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique(patient_id, vital_type)
);

create table if not exists public.vital_alerts (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  vital_id uuid references public.vitals(id) on delete set null,
  severity text not null default 'warning',
  status text not null default 'open',
  message text not null,
  acknowledged_by uuid references public.staff_users(id) on delete set null,
  acknowledged_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  strength text,
  form text,
  manufacturer text,
  sku text unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  doctor_id uuid references public.staff_users(id) on delete set null,
  status text not null default 'draft',
  issued_at timestamptz,
  valid_until timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.prescription_items (
  id uuid primary key default gen_random_uuid(),
  prescription_id uuid not null references public.prescriptions(id) on delete cascade,
  medication_id uuid not null references public.medications(id) on delete restrict,
  dose text,
  frequency text,
  timing text,
  duration text,
  quantity numeric,
  instructions text,
  created_at timestamptz not null default now()
);

create table if not exists public.medication_schedule (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  prescription_item_id uuid references public.prescription_items(id) on delete set null,
  scheduled_at timestamptz not null,
  status text not null default 'upcoming',
  taken_at timestamptz,
  snoozed_until timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.health_records (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  record_type text not null,
  title text not null,
  record_date date,
  storage_path text,
  status text not null default 'uploaded',
  ai_status text not null default 'not_started',
  reviewed_by uuid references public.staff_users(id) on delete set null,
  reviewed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.report_measurements (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.health_records(id) on delete cascade,
  marker text not null,
  value_numeric numeric,
  value_text text,
  unit text,
  reference_range text,
  confidence numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  staff_id uuid references public.staff_users(id) on delete set null,
  appointment_type text not null,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location text,
  mode text,
  status text not null default 'booked',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_patients_user_id on public.patients(user_id);
create index if not exists idx_vitals_patient_time on public.vitals(patient_id, measured_at desc);
create index if not exists idx_alerts_patient_status on public.vital_alerts(patient_id, status);
create index if not exists idx_records_patient_date on public.health_records(patient_id, record_date desc);
create index if not exists idx_appointments_patient_time on public.appointments(patient_id, starts_at);
create index if not exists idx_notifications_user_read on public.notifications(user_id, read_at);

alter table public.profiles enable row level security;
alter table public.staff_users enable row level security;
alter table public.patients enable row level security;
alter table public.family_members enable row level security;
alter table public.vitals enable row level security;
alter table public.vital_thresholds enable row level security;
alter table public.vital_alerts enable row level security;
alter table public.medications enable row level security;
alter table public.prescriptions enable row level security;
alter table public.prescription_items enable row level security;
alter table public.medication_schedule enable row level security;
alter table public.health_records enable row level security;
alter table public.report_measurements enable row level security;
alter table public.appointments enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_log enable row level security;

create policy "profile owner read" on public.profiles for select to authenticated using (id = auth.uid());
create policy "profile owner update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "staff own row" on public.staff_users for select to authenticated using (user_id = auth.uid());

create policy "patient self read" on public.patients for select to authenticated using (user_id = auth.uid() or exists (select 1 from public.staff_users s where s.user_id = auth.uid() and s.active = true));
create policy "patient self update" on public.patients for update to authenticated using (user_id = auth.uid() or exists (select 1 from public.staff_users s where s.user_id = auth.uid() and s.active = true)) with check (user_id = auth.uid() or exists (select 1 from public.staff_users s where s.user_id = auth.uid() and s.active = true));

create policy "family patient or staff" on public.family_members for select to authenticated using (exists (select 1 from public.patients p where p.id = patient_id and (p.user_id = auth.uid() or exists (select 1 from public.staff_users s where s.user_id = auth.uid() and s.active = true))));
create policy "vitals patient or staff" on public.vitals for all to authenticated using (exists (select 1 from public.patients p where p.id = patient_id and (p.user_id = auth.uid() or exists (select 1 from public.staff_users s where s.user_id = auth.uid() and s.active = true)))) with check (exists (select 1 from public.patients p where p.id = patient_id and (p.user_id = auth.uid() or exists (select 1 from public.staff_users s where s.user_id = auth.uid() and s.active = true))));
create policy "threshold patient or staff" on public.vital_thresholds for all to authenticated using (exists (select 1 from public.patients p where p.id = patient_id and (p.user_id = auth.uid() or exists (select 1 from public.staff_users s where s.user_id = auth.uid() and s.active = true)))) with check (exists (select 1 from public.patients p where p.id = patient_id and (p.user_id = auth.uid() or exists (select 1 from public.staff_users s where s.user_id = auth.uid() and s.active = true))));
create policy "alerts patient or staff" on public.vital_alerts for all to authenticated using (exists (select 1 from public.patients p where p.id = patient_id and (p.user_id = auth.uid() or exists (select 1 from public.staff_users s where s.user_id = auth.uid() and s.active = true)))) with check (exists (select 1 from public.patients p where p.id = patient_id and (p.user_id = auth.uid() or exists (select 1 from public.staff_users s where s.user_id = auth.uid() and s.active = true))));
create policy "medications authenticated read" on public.medications for select to authenticated using (true);
create policy "prescriptions patient or staff" on public.prescriptions for all to authenticated using (exists (select 1 from public.patients p where p.id = patient_id and (p.user_id = auth.uid() or exists (select 1 from public.staff_users s where s.user_id = auth.uid() and s.active = true)))) with check (exists (select 1 from public.patients p where p.id = patient_id and (p.user_id = auth.uid() or exists (select 1 from public.staff_users s where s.user_id = auth.uid() and s.active = true))));
create policy "prescription items via parent" on public.prescription_items for select to authenticated using (exists (select 1 from public.prescriptions r join public.patients p on p.id = r.patient_id where r.id = prescription_id and (p.user_id = auth.uid() or exists (select 1 from public.staff_users s where s.user_id = auth.uid() and s.active = true))));
create policy "med schedule patient or staff" on public.medication_schedule for all to authenticated using (exists (select 1 from public.patients p where p.id = patient_id and (p.user_id = auth.uid() or exists (select 1 from public.staff_users s where s.user_id = auth.uid() and s.active = true)))) with check (exists (select 1 from public.patients p where p.id = patient_id and (p.user_id = auth.uid() or exists (select 1 from public.staff_users s where s.user_id = auth.uid() and s.active = true))));
create policy "records patient or staff" on public.health_records for all to authenticated using (exists (select 1 from public.patients p where p.id = patient_id and (p.user_id = auth.uid() or exists (select 1 from public.staff_users s where s.user_id = auth.uid() and s.active = true)))) with check (exists (select 1 from public.patients p where p.id = patient_id and (p.user_id = auth.uid() or exists (select 1 from public.staff_users s where s.user_id = auth.uid() and s.active = true))));
create policy "measurements via record" on public.report_measurements for select to authenticated using (exists (select 1 from public.health_records r join public.patients p on p.id = r.patient_id where r.id = record_id and (p.user_id = auth.uid() or exists (select 1 from public.staff_users s where s.user_id = auth.uid() and s.active = true))));
create policy "appointments patient or staff" on public.appointments for all to authenticated using (exists (select 1 from public.patients p where p.id = patient_id and (p.user_id = auth.uid() or exists (select 1 from public.staff_users s where s.user_id = auth.uid() and s.active = true)))) with check (exists (select 1 from public.patients p where p.id = patient_id and (p.user_id = auth.uid() or exists (select 1 from public.staff_users s where s.user_id = auth.uid() and s.active = true))));
create policy "notifications owner" on public.notifications for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "audit staff read" on public.audit_log for select to authenticated using (exists (select 1 from public.staff_users s where s.user_id = auth.uid() and s.active = true));
