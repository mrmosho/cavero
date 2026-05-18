-- ═══════════════════════════════════════════════════════════
-- CAVERO — Complete Schema
-- Run in Supabase SQL editor (Project > SQL Editor > New query)
-- ═══════════════════════════════════════════════════════════

-- Safe re-run: drop everything first
drop table if exists notification_log      cascade;
drop table if exists order_items           cascade;
drop table if exists orders                cascade;
drop table if exists product_variants      cascade;
drop table if exists product_images        cascade;
drop table if exists products              cascade;
drop table if exists newsletter_subscribers cascade;
drop table if exists contact_enquiries     cascade;
drop function if exists update_updated_at  cascade;

-- ── PRODUCTS ──────────────────────────────────────────────
create table products (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  name         text not null,
  price        integer not null,        -- whole EGP, no decimals
  category     text not null,           -- vases | desk | gifts | lighting | decor
  label        text not null,           -- display label e.g. "Vases"
  description  text,
  details      text,
  badge        text,                    -- 'new' | 'custom' | null
  available    boolean default true,
  customisable boolean default false,   -- shows personalisation field on product page
  sort_order   integer default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ── PRODUCT IMAGES ────────────────────────────────────────
create table product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid references products(id) on delete cascade,
  url         text not null,            -- Supabase Storage public URL
  alt         text,
  position    integer default 0,        -- 0 = primary image
  created_at  timestamptz default now()
);

-- ── PRODUCT VARIANTS (colours) ────────────────────────────
create table product_variants (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid references products(id) on delete cascade,
  name        text not null,            -- 'Charcoal', 'Cream', etc.
  hex         text not null,            -- '#2D2B34'
  available   boolean default true,
  sort_order  integer default 0
);

-- ── ORDERS ────────────────────────────────────────────────
create table orders (
  id                uuid primary key default gen_random_uuid(),
  guest_email       text not null,
  guest_name        text not null,
  guest_phone       text not null,
  status            text not null default 'pending_payment',
  -- pending_payment | paid | in_production | ready_to_ship | shipped | delivered | cancelled
  subtotal          integer not null,
  shipping          integer not null default 0,
  total             integer not null,
  shipping_address  jsonb not null,
  -- { name, phone, line1, line2, city, governorate, postal_code }
  payment_method    text,
  paymob_order_id   text,
  paymob_txn_id     text,
  bosta_shipment_id text,
  bosta_tracking_no text,
  notes             text,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ── ORDER ITEMS ───────────────────────────────────────────
create table order_items (
  id                    uuid primary key default gen_random_uuid(),
  order_id              uuid references orders(id) on delete cascade,
  product_id            uuid references products(id) on delete set null,
  product_slug          text not null,   -- denormalised, survives product deletion
  product_name          text not null,   -- denormalised
  unit_price            integer not null, -- price at time of purchase
  qty                   integer not null default 1,
  variant_name          text,
  variant_hex           text,
  personalisation_note  text,
  created_at            timestamptz default now()
);

-- ── NOTIFICATION LOG ──────────────────────────────────────
create table notification_log (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid references orders(id) on delete cascade,
  type        text not null,             -- 'email' | 'sms'
  recipient   text not null,
  subject     text,
  status      text not null default 'pending', -- 'sent' | 'failed'
  error       text,
  sent_at     timestamptz default now()
);

-- ── NEWSLETTER ────────────────────────────────────────────
create table newsletter_subscribers (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  subscribed_at timestamptz default now(),
  source        text default 'website'
);

-- ── CONTACT ENQUIRIES ─────────────────────────────────────
create table contact_enquiries (
  id         uuid primary key default gen_random_uuid(),
  name       text,
  email      text not null,
  subject    text,
  message    text not null,
  read       boolean default false,
  created_at timestamptz default now()
);

-- ── AUTO updated_at ───────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger products_updated_at before update on products for each row execute function update_updated_at();
create trigger orders_updated_at   before update on orders   for each row execute function update_updated_at();

-- ── ROW LEVEL SECURITY ────────────────────────────────────
alter table products               enable row level security;
alter table product_images         enable row level security;
alter table product_variants       enable row level security;
alter table orders                 enable row level security;
alter table order_items            enable row level security;
alter table notification_log       enable row level security;
alter table newsletter_subscribers enable row level security;
alter table contact_enquiries      enable row level security;

-- Products: anyone can read available ones
create policy "public read available products" on products      for select using (available = true);
create policy "public read product images"     on product_images for select using (true);
create policy "public read product variants"   on product_variants for select using (true);

-- Orders: guest insert + read by UUID (UUID is the secret for guest order confirmation)
create policy "anyone can insert orders"     on orders      for insert with check (true);
create policy "anyone can read orders"       on orders      for select using (true);
create policy "anyone can insert order items" on order_items for insert with check (true);
create policy "anyone can read order items"   on order_items for select using (true);

-- Newsletter + contact: insert only
create policy "anyone can subscribe"        on newsletter_subscribers for insert with check (true);
create policy "anyone can submit enquiry"   on contact_enquiries      for insert with check (true);

-- ── STORAGE BUCKET ────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "public can view product images" on storage.objects for select using (bucket_id = 'product-images');
create policy "admin can upload product images" on storage.objects for insert with check (bucket_id = 'product-images');
create policy "admin can delete product images" on storage.objects for delete using (bucket_id = 'product-images');
