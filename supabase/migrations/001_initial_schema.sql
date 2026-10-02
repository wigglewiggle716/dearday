create extension if not exists pgcrypto;

create type public.app_role as enum (
  'super_admin','admin','operations','accountant','partner_manager',
  'customer_support','marketing','content_admin','partner_user','customer'
);

create type public.partner_status as enum ('pending','under_review','active','suspended','rejected');
create type public.listing_kind as enum ('product','service','venue','experience');
create type public.listing_status as enum ('draft','pending_review','published','rejected','archived');
create type public.order_status as enum ('draft','pending_payment','paid','confirmed','in_progress','completed','cancelled','refunded');
create type public.partner_order_status as enum ('pending','accepted','rejected','in_progress','ready','completed','cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role public.app_role not null default 'customer',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.partners (
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

create table public.partner_users (
  partner_id uuid not null references public.partners(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  partner_role text not null default 'manager',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (partner_id,user_id)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_ar text not null,
  name_en text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.listings (
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

create table public.listing_versions (
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

alter table public.listings
  add constraint listings_published_version_fk
  foreign key (published_version_id) references public.listing_versions(id) on delete set null;

create table public.orders (
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

create table public.order_items (
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

create table public.partner_orders (
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

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index idx_partners_status on public.partners(status);
create index idx_listings_partner on public.listings(partner_id);
create index idx_listing_versions_listing_status on public.listing_versions(listing_id,status);
create index idx_orders_customer on public.orders(customer_id);
create index idx_orders_status on public.orders(status);
create index idx_order_items_order on public.order_items(order_id);
create index idx_partner_orders_partner_status on public.partner_orders(partner_id,status);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger partners_set_updated_at before update on public.partners for each row execute function public.set_updated_at();
create trigger listings_set_updated_at before update on public.listings for each row execute function public.set_updated_at();
create trigger orders_set_updated_at before update on public.orders for each row execute function public.set_updated_at();
create trigger partner_orders_set_updated_at before update on public.partner_orders for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
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

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

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

create or replace function public.current_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role() in (
    'super_admin','admin','operations','accountant','partner_manager','customer_support','marketing','content_admin'
  ), false);
$$;

create policy "profiles_self_read" on public.profiles for select using (id = auth.uid() or public.is_staff());
create policy "profiles_self_update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "categories_public_read" on public.categories for select using (is_active = true or public.is_staff());
create policy "partners_public_read" on public.partners for select using (status = 'active' or public.is_staff());

create policy "listings_public_read" on public.listings for select using (
  (is_available = true and published_version_id is not null) or public.is_staff()
);
create policy "listing_versions_public_read" on public.listing_versions for select using (
  status = 'published' or public.is_staff()
);

create policy "orders_customer_read" on public.orders for select using (customer_id = auth.uid() or public.is_staff());
create policy "orders_customer_insert" on public.orders for insert with check (customer_id = auth.uid());
create policy "order_items_customer_read" on public.order_items for select using (
  exists(select 1 from public.orders o where o.id = order_id and (o.customer_id = auth.uid() or public.is_staff()))
);

create policy "partner_users_self_read" on public.partner_users for select using (user_id = auth.uid() or public.is_staff());
create policy "partner_orders_partner_read" on public.partner_orders for select using (
  public.is_staff() or exists(
    select 1 from public.partner_users pu
    where pu.partner_id = partner_orders.partner_id and pu.user_id = auth.uid() and pu.is_active = true
  )
);

create policy "staff_all_partners" on public.partners for all using (public.is_staff()) with check (public.is_staff());
create policy "staff_all_categories" on public.categories for all using (public.is_staff()) with check (public.is_staff());
create policy "staff_all_listings" on public.listings for all using (public.is_staff()) with check (public.is_staff());
create policy "staff_all_listing_versions" on public.listing_versions for all using (public.is_staff()) with check (public.is_staff());
create policy "staff_all_orders" on public.orders for all using (public.is_staff()) with check (public.is_staff());
create policy "staff_all_order_items" on public.order_items for all using (public.is_staff()) with check (public.is_staff());
create policy "staff_all_partner_orders" on public.partner_orders for all using (public.is_staff()) with check (public.is_staff());
create policy "staff_all_audit_logs" on public.audit_logs for select using (public.is_staff());
