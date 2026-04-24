# Cavero

Studio-crafted home objects · Cairo, Egypt

## Stack

- **React 18** + Vite
- **React Router v6** — client-side routing
- **Supabase** — database, RLS, edge functions
- **Vercel** — hosting

## Local setup

```bash
npm install
cp .env.example .env.local
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

## Supabase setup

1. Create a new project at supabase.com
2. Go to SQL editor and run migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_seed_products.sql`
3. Copy your project URL and anon key into `.env.local`

## Deploy to Vercel

1. Push repo to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_URL` (your production URL)
4. Deploy

## Deploy Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref <your-project-ref>

# Deploy functions
supabase functions deploy validate-order
supabase functions deploy paymob-webhook
```

## Pending integrations

| Integration | Status | File to update |
|---|---|---|
| Paymob payment | Stubbed — ready to wire | `src/lib/paymob.js` |
| Bosta shipping | Stubbed — flat rate for now | `src/lib/shipping.js` |
| Email (Resend) | Stubbed | `supabase/functions/paymob-webhook/index.ts` |

## Project structure

```
src/
├── lib/           Constants, Supabase client, product data, stubs
├── context/       CartContext (localStorage + state)
├── hooks/         useProducts, useOrders, useScrollReveal, useNavScroll
├── components/    Nav, Footer, CartDrawer, ProductCard, Marquee, Newsletter, Toast
│   └── illustrations/  SVG product illustrations keyed by slug
└── pages/         Home, Shop, Product, Gifting, About, Contact, Cart, Checkout, OrderConfirmation

supabase/
├── migrations/    Schema + seed SQL
└── functions/     validate-order, paymob-webhook Edge Functions
```
