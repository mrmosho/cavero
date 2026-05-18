# Cavero

Studio-crafted home objects · Cairo, Egypt

## Quick start

```bash
npm install
cp .env.example .env.local
# Fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_ADMIN_PASSWORD
npm run dev
```

## Supabase setup

1. Create project at supabase.com
2. SQL Editor → run `supabase/migrations/001_initial_schema.sql`
3. SQL Editor → run `supabase/migrations/002_seed_products.sql`
4. Copy URL + anon key into `.env.local`

## Deploy to Vercel

1. Push to GitHub
2. Import in Vercel dashboard
3. Add env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ADMIN_PASSWORD`
4. Deploy

## Deploy to Hostinger (when ready)

1. `npm run build`
2. Upload contents of `dist/` to `public_html/` via File Manager or FTP
3. The `.htaccess` file is already in `public/` and gets copied to `dist/` automatically

## Admin panel

Visit `/admin` — password is whatever you set as `VITE_ADMIN_PASSWORD`

## Pending integrations (stubbed, ready to wire)

| Integration | File to update |
|---|---|
| Paymob payments | `src/lib/paymob.js` |
| Bosta shipping  | `supabase/functions/create-bosta-shipment/index.ts` |
| Resend email    | `supabase/functions/paymob-webhook/index.ts` |

## Edge functions deployment

```bash
npm install -g supabase
supabase link --project-ref <your-ref>
supabase functions deploy validate-order
supabase functions deploy paymob-webhook
supabase functions deploy create-bosta-shipment
```
