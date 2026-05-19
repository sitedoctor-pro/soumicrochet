create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  city text not null,
  address text not null,
  product_id text not null,
  product_name text not null,
  price numeric(10, 2) not null,
  status text not null default 'pending',
  onesignal_user_id text,
  session_id text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_name text not null,
  phone text not null,
  city text not null,
  rating integer not null check (rating between 1 and 5),
  review_text text not null,
  is_published boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.analytics (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  ip_address text,
  city text,
  page_url text not null,
  event_type text not null,
  form_draft jsonb,
  onesignal_user_id text,
  time_spent_seconds integer default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  onesignal_player_id text not null unique,
  city text,
  device_info text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  target_segment text not null,
  sent_at timestamptz not null default timezone('utc', now())
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_session_id_idx on public.orders (session_id);
create index if not exists reviews_published_idx on public.reviews (is_published, created_at desc);
create index if not exists analytics_session_idx on public.analytics (session_id, created_at desc);
create index if not exists analytics_event_idx on public.analytics (event_type, created_at desc);
create index if not exists subscribers_player_idx on public.subscribers (onesignal_player_id);

alter table public.orders enable row level security;
alter table public.reviews enable row level security;
alter table public.analytics enable row level security;
alter table public.subscribers enable row level security;
alter table public.notification_logs enable row level security;

drop policy if exists "public_insert_orders" on public.orders;
create policy "public_insert_orders"
on public.orders
for insert
to anon
with check (true);

drop policy if exists "public_insert_reviews" on public.reviews;
create policy "public_insert_reviews"
on public.reviews
for insert
to anon
with check (true);

drop policy if exists "public_select_published_reviews" on public.reviews;
create policy "public_select_published_reviews"
on public.reviews
for select
to anon
using (is_published = true);

drop policy if exists "public_insert_analytics" on public.analytics;
create policy "public_insert_analytics"
on public.analytics
for insert
to anon
with check (true);

drop policy if exists "public_insert_subscribers" on public.subscribers;
create policy "public_insert_subscribers"
on public.subscribers
for insert
to anon
with check (true);

drop policy if exists "authenticated_manage_orders" on public.orders;
create policy "authenticated_manage_orders"
on public.orders
for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated_manage_reviews" on public.reviews;
create policy "authenticated_manage_reviews"
on public.reviews
for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated_manage_analytics" on public.analytics;
create policy "authenticated_manage_analytics"
on public.analytics
for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated_manage_subscribers" on public.subscribers;
create policy "authenticated_manage_subscribers"
on public.subscribers
for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated_manage_notification_logs" on public.notification_logs;
create policy "authenticated_manage_notification_logs"
on public.notification_logs
for all
to authenticated
using (true)
with check (true);
