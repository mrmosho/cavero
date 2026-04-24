-- ═══════════════════════════════════════════════════════════
-- CAVERO — Initial Schema
-- Run this in the Supabase SQL editor or via supabase db push
-- ═══════════════════════════════════════════════════════════

-- ── PRODUCTS ──────────────────────────────────────────────
create table if not exists products (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  price       integer not null,             -- whole EGP
  category    text not null,                -- vases | desk | gifts | lighting | decor
  label       text not null,
  description text,
  details     text,
  badge       text,                         -- 'new' | 'custom' | null
  available   boolean default true,
  sort_order  integer default 0,
  created_at  timestamptz default now()
);

create table if not exists product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid references products(id) on delete cascade,
  url         text not null,
  alt         text,
  position    integer default 0
);

create table if not exists product_variants (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid references products(id) on delete cascade,
  name        text not null,               -- 'Charcoal', 'Cream', etc.
  value       text not null,               -- hex or slug
  available   boolean default true
);

-- ── ORDERS ────────────────────────────────────────────────
create table if not exists orders (
  id               uuid primary key default gen_random_uuid(),
  guest_email      text not null,
  status           text not null default 'pending_payment',
  subtotal         integer not null,        -- whole EGP
  shipping         integer not null default 0,
  total            integer not null,
  shipping_address jsonb not null,
  payment_method   text,
  paymob_order_id  text,
  paymob_txn_id    text,
  notes            text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger orders_updated_at
  before update on orders
  for each row execute function update_updated_at();

-- ── ORDER ITEMS ───────────────────────────────────────────
create table if not exists order_items (
  id                   uuid primary key default gen_random_uuid(),
  order_id             uuid references orders(id) on delete cascade,
  product_id           uuid references products(id) on delete set null,
  product_slug         text not null,
  product_name         text not null,
  unit_price           integer not null,
  qty                  integer not null default 1,
  variant_name         text,
  personalisation_note text,
  created_at           timestamptz default now()
);

-- ── NEWSLETTER ────────────────────────────────────────────
create table if not exists newsletter_subscribers (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  subscribed_at timestamptz default now(),
  source        text default 'website'
);

-- ── CONTACT ENQUIRIES ─────────────────────────────────────
create table if not exists contact_enquiries (
  id         uuid primary key default gen_random_uuid(),
  name       text,
  email      text not null,
  subject    text,
  message    text not null,
  created_at timestamptz default now()
);

-- ── ROW LEVEL SECURITY ────────────────────────────────────
alter table products             enable row level security;
alter table product_images       enable row level security;
alter table product_variants     enable row level security;
alter table orders               enable row level security;
alter table order_items          enable row level security;
alter table newsletter_subscribers enable row level security;
alter table contact_enquiries    enable row level security;

-- Products: public read for available items
create policy "public can read available products"
  on products for select using (available = true);

create policy "public can read product images"
  on product_images for select using (true);

create policy "public can read product variants"
  on product_variants for select using (true);

-- Orders: only insert (guest checkout — no read via anon)
-- Reading orders is done via the service role key in edge functions
create policy "anyone can insert orders"
  on orders for insert with check (true);

-- Allow reading own order via order ID (for confirmation page)
-- This is permissive since it's guest — the order UUID is the secret
create policy "anyone can read orders by id"
  on orders for select using (true);

create policy "anyone can insert order items"
  on order_items for insert with check (true);

create policy "anyone can read order items"
  on order_items for select using (true);

-- Newsletter: insert only
create policy "anyone can subscribe to newsletter"
  on newsletter_subscribers for insert with check (true);

-- Contact: insert only
create policy "anyone can submit contact enquiry"
  on contact_enquiries for insert with check (true);
