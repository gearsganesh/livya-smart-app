create extension if not exists pgcrypto;

alter table public.profiles add column if not exists subscription_tier text not null default 'free';
alter table public.profiles add column if not exists name text;
alter table public.profiles add column if not exists email text;

create or replace function public.set_updated_at() returns trigger
language plpgsql security definer set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name'), coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'))
  on conflict (id) do update set email = coalesce(excluded.email, public.profiles.email), name = coalesce(excluded.name, public.profiles.name), full_name = coalesce(excluded.full_name, public.profiles.full_name), updated_at = now();
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.staff_users where user_id = auth.uid() and active = true); $$;

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, patient_id uuid references public.patients(id) on delete cascade,
  entry_date date not null default current_date, mood text, title text, body text, tags text[] not null default '{}', metadata jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, patient_id uuid references public.patients(id) on delete set null,
  title text, context_type text not null default 'general', status text not null default 'active', metadata jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(), conversation_id uuid not null references public.ai_conversations(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant','system','tool')), content text not null, model text, tokens_in integer, tokens_out integer, metadata jsonb not null default '{}', created_at timestamptz not null default now()
);
create table if not exists public.health_metrics (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, patient_id uuid references public.patients(id) on delete cascade,
  metric_type text not null, value numeric, unit text, recorded_at timestamptz not null default now(), source text not null default 'manual', metadata jsonb not null default '{}', created_at timestamptz not null default now()
);
create table if not exists public.processing_logs (
  id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete set null, operation text not null, provider text, model text, status text not null default 'completed', duration_ms integer,
  input_tokens integer, output_tokens integer, request_id text, error_code text, metadata jsonb not null default '{}', created_at timestamptz not null default now()
);

create index if not exists idx_journal_user_date on public.journal_entries(user_id, entry_date desc);
create index if not exists idx_ai_conversations_user_updated on public.ai_conversations(user_id, updated_at desc);
create index if not exists idx_ai_messages_conversation_time on public.ai_messages(conversation_id, created_at);
create index if not exists idx_health_metrics_patient_time on public.health_metrics(patient_id, metric_type, recorded_at desc);
create index if not exists idx_processing_logs_created on public.processing_logs(created_at desc);

alter table public.journal_entries enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.health_metrics enable row level security;
alter table public.processing_logs enable row level security;

create policy "journal owner or staff" on public.journal_entries for all to authenticated using (user_id = auth.uid() or public.is_staff()) with check (user_id = auth.uid() or public.is_staff());
create policy "ai conversation owner or staff" on public.ai_conversations for all to authenticated using (user_id = auth.uid() or public.is_staff()) with check (user_id = auth.uid() or public.is_staff());
create policy "ai messages owner or staff" on public.ai_messages for all to authenticated using (user_id = auth.uid() or public.is_staff()) with check (user_id = auth.uid() or public.is_staff());
create policy "metrics owner or staff" on public.health_metrics for all to authenticated using (user_id = auth.uid() or public.is_staff()) with check (user_id = auth.uid() or public.is_staff());
create policy "processing logs staff only" on public.processing_logs for select to authenticated using (public.is_staff());
create policy "processing logs authenticated insert" on public.processing_logs for insert to authenticated with check (user_id = auth.uid() or public.is_staff());

drop policy if exists "profile owner read" on public.profiles;
drop policy if exists "profile owner update" on public.profiles;
drop policy if exists "profile owner insert" on public.profiles;
drop policy if exists "profile owner read staff" on public.profiles;
drop policy if exists "profile owner update staff" on public.profiles;
create policy "profile owner read staff" on public.profiles for select to authenticated using (id = auth.uid() or public.is_staff());
create policy "profile owner insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profile owner update staff" on public.profiles for update to authenticated using (id = auth.uid() or public.is_staff()) with check (id = auth.uid() or public.is_staff());

comment on table public.processing_logs is 'Non-sensitive operational metadata only. Never store prompts, report text, PHI, access tokens, secrets, or raw AI payloads here.';
