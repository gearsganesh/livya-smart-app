create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  provider text not null check (provider in ('revenuecat','razorpay')),
  provider_customer_id text,
  provider_subscription_id text,
  product_id text,
  entitlement text,
  status text not null default 'inactive' check (status in ('active','trialing','grace','paused','cancelled','expired','billing_issue','inactive')),
  environment text,
  current_period_end timestamptz,
  metadata jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(provider, provider_subscription_id)
);

create table if not exists public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('revenuecat','razorpay')),
  provider_event_id text not null,
  event_type text not null,
  payload jsonb not null default '{}',
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(provider, provider_event_id)
);

alter table public.subscriptions enable row level security;
alter table public.payment_webhook_events enable row level security;

create policy "subscriptions owner read" on public.subscriptions
  for select to authenticated using (auth.uid() = user_id);

create policy "payment webhook events staff read" on public.payment_webhook_events
  for select to authenticated using (public.is_staff(auth.uid()));
