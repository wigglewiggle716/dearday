create extension if not exists pgcrypto;
create schema if not exists private;
revoke all on schema private from public;

do $$ begin
  create type public.app_role as enum (
    'super_admin','admin','operations','accountant','partner_manager',
    'customer_support','marketing','content_admin','partner_user','customer'
  );
exception when duplicate_object then null; end $$;

do $$ begin create type public.partner_status as enum ('pending','under_review','active','suspended','rejected'); exception when duplicate_object then null; end $$;
do $$ begin create type public.listing_kind as enum ('product','service','venue','experience'); exception when duplicate_object then null; end $$;
do $$ begin create type public.listing_status as enum ('draft','pending_review','published','rejected','archived'); exception when duplicate_object then null; end $$;
do $$ begin create type public.order_status as enum ('draft','pending_payment','paid','confirmed','in_progress','completed','cancelled','refunded'); exception when duplicate_object then null; end $$;
do $$ begin create type public.partner_order_status as enum ('pending','accepted','rejected','in_progress','ready','completed','cancelled'); exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role public.app_role not null default 'customer',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text,
  slug text not null unique,
  status public.partner_status not null default 'pending',
  commission_rate numeric(5,2) not null default 0 check (commission_rate between 0 and 100),
  contact_name text,
  phone text,
  email text,
  coverage_areas jsonb not null default '[]'::jsonb,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.partner_users (
  partner_id uuid not null references public.partners(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  partner_role text not null default 'manager',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (partner_id,user_id)
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_ar text not null,
  name_en text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  category_id uuid references public.categories(id),
  kind public.listing_kind not null,
  published_version_id uuid,
  is_available boolean not null default true,
  stock_qty integer,
  capacity_per_day integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listing_versions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  status public.listing_status not null default 'draft',
  name_ar text not null,
  name_en text,
  description_ar text,
  description_en text,
  price numeric(12,2) not null default 0 check (price >= 0),
  compare_at_price numeric(12,2),
  currency text not null default 'EGP',
  media jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  submitted_by uuid references public.profiles(id),
  reviewed_by uuid references public.profiles(id),
  review_note text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.listings drop constraint if exists listings_published_version_fk;
alter table public.listings
  add constraint listings_published_version_fk
  foreign key (published_version_id) references public.listing_versions(id) on delete set null;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  customer_id uuid references public.profiles(id),
  status public.order_status not null default 'draft',
  occasion_type text,
  occasion_date date,
  occasion_time time,
  delivery_area text,
  delivery_address jsonb,
  customer_note text,
  subtotal numeric(12,2) not null default 0,
  discount_total numeric(12,2) not null default 0,
  delivery_total numeric(12,2) not null default 0,
  grand_total numeric(12,2) not null default 0,
  currency text not null default 'EGP',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  listing_id uuid references public.listings(id),
  partner_id uuid not null references public.partners(id),
  listing_version_id uuid references public.listing_versions(id),
  item_name text not null,
  unit_price numeric(12,2) not null,
  quantity integer not null default 1 check (quantity > 0),
  line_total numeric(12,2) not null,
  item_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.partner_orders (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  partner_id uuid not null references public.partners(id),
  status public.partner_order_status not null default 'pending',
  subtotal numeric(12,2) not null default 0,
  commission_rate numeric(5,2) not null default 0,
  commission_amount numeric(12,2) not null default 0,
  partner_net numeric(12,2) not null default 0,
  accepted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(order_id,partner_id)
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_partners_status on public.partners(status);
create index if not exists idx_listings_partner on public.listings(partner_id);
create index if not exists idx_listing_versions_listing_status on public.listing_versions(listing_id,status);
create index if not exists idx_orders_customer on public.orders(customer_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_order_items_order on public.order_items(order_id);
create index if not exists idx_partner_orders_partner_status on public.partner_orders(partner_id,status);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function private.set_updated_at() from public;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function private.set_updated_at();
drop trigger if exists partners_set_updated_at on public.partners;
create trigger partners_set_updated_at before update on public.partners for each row execute function private.set_updated_at();
drop trigger if exists listings_set_updated_at on public.listings;
create trigger listings_set_updated_at before update on public.listings for each row execute function private.set_updated_at();
drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at before update on public.orders for each row execute function private.set_updated_at();
drop trigger if exists partner_orders_set_updated_at on public.partner_orders;
create trigger partner_orders_set_updated_at before update on public.partner_orders for each row execute function private.set_updated_at();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name',''),
    new.raw_user_meta_data->>'phone',
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function private.handle_new_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists(
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_active = true
      and p.role in (
        'super_admin','admin','operations','accountant','partner_manager',
        'customer_support','marketing','content_admin'
      )
  );
$$;
revoke all on function private.is_staff() from public;
grant usage on schema private to anon, authenticated;
grant execute on function private.is_staff() to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.partners enable row level security;
alter table public.partner_users enable row level security;
alter table public.categories enable row level security;
alter table public.listings enable row level security;
alter table public.listing_versions enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.partner_orders enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles for select to authenticated
using ((select auth.uid()) = id or private.is_staff());

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories for select to anon, authenticated
using (is_active = true or private.is_staff());

drop policy if exists partners_public_read on public.partners;
create policy partners_public_read on public.partners for select to anon, authenticated
using (status = 'active' or private.is_staff());

drop policy if exists listings_public_read on public.listings;
create policy listings_public_read on public.listings for select to anon, authenticated
using ((is_available = true and published_version_id is not null) or private.is_staff());

drop policy if exists listing_versions_public_read on public.listing_versions;
create policy listing_versions_public_read on public.listing_versions for select to anon, authenticated
using (status = 'published' or private.is_staff());

drop policy if exists orders_customer_read on public.orders;
create policy orders_customer_read on public.orders for select to authenticated
using (customer_id = (select auth.uid()) or private.is_staff());

drop policy if exists orders_customer_insert on public.orders;
create policy orders_customer_insert on public.orders for insert to authenticated
with check (customer_id = (select auth.uid()));

drop policy if exists order_items_customer_read on public.order_items;
create policy order_items_customer_read on public.order_items for select to authenticated
using (exists(
  select 1 from public.orders o
  where o.id = order_id and (o.customer_id = (select auth.uid()) or private.is_staff())
));

drop policy if exists partner_users_self_read on public.partner_users;
create policy partner_users_self_read on public.partner_users for select to authenticated
using (user_id = (select auth.uid()) or private.is_staff());

drop policy if exists partner_orders_partner_read on public.partner_orders;
create policy partner_orders_partner_read on public.partner_orders for select to authenticated
using (
  private.is_staff() or exists(
    select 1 from public.partner_users pu
    where pu.partner_id = partner_orders.partner_id
      and pu.user_id = (select auth.uid())
      and pu.is_active = true
  )
);

drop policy if exists staff_all_partners on public.partners;
create policy staff_all_partners on public.partners for all to authenticated
using (private.is_staff()) with check (private.is_staff());

drop policy if exists staff_all_categories on public.categories;
create policy staff_all_categories on public.categories for all to authenticated
using (private.is_staff()) with check (private.is_staff());

drop policy if exists staff_all_listings on public.listings;
create policy staff_all_listings on public.listings for all to authenticated
using (private.is_staff()) with check (private.is_staff());

drop policy if exists staff_all_listing_versions on public.listing_versions;
create policy staff_all_listing_versions on public.listing_versions for all to authenticated
using (private.is_staff()) with check (private.is_staff());

drop policy if exists staff_all_orders on public.orders;
create policy staff_all_orders on public.orders for all to authenticated
using (private.is_staff()) with check (private.is_staff());

drop policy if exists staff_all_order_items on public.order_items;
create policy staff_all_order_items on public.order_items for all to authenticated
using (private.is_staff()) with check (private.is_staff());

drop policy if exists staff_all_partner_orders on public.partner_orders;
create policy staff_all_partner_orders on public.partner_orders for all to authenticated
using (private.is_staff()) with check (private.is_staff());

drop policy if exists staff_all_audit_logs on public.audit_logs;
create policy staff_all_audit_logs on public.audit_logs for select to authenticated
using (private.is_staff());

grant select on public.categories, public.partners, public.listings, public.listing_versions to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.partner_users, public.partner_orders, public.order_items to authenticated;
grant select, insert on public.orders to authenticated;
grant insert, update, delete on public.partners, public.categories, public.listings, public.listing_versions, public.order_items, public.partner_orders to authenticated;
grant select, insert on public.audit_logs to authenticated;
grant usage, select on all sequences in schema public to authenticated;

revoke update on public.profiles from authenticated;
grant update (full_name, phone) on public.profiles to authenticated;
