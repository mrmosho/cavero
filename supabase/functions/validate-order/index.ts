import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const FREE_SHIPPING_THRESHOLD = 1000
const FLAT_SHIPPING_RATE = 80
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const { items } = await req.json()
    if (!items?.length) return new Response(JSON.stringify({ valid: false, error: 'No items provided' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const slugs = items.map((i: any) => i.slug)
    const { data: products, error } = await supabase.from('products').select('slug, name, price, available').in('slug', slugs)
    if (error) throw error

    for (const item of items) {
      const product = products.find((p: any) => p.slug === item.slug)
      if (!product)          return new Response(JSON.stringify({ valid: false, error: `Product not found: ${item.slug}` }),        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })
      if (!product.available) return new Response(JSON.stringify({ valid: false, error: `Product unavailable: ${product.name}` }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    const validatedItems = items.map((item: any) => {
      const product = products.find((p: any) => p.slug === item.slug)
      return { slug: item.slug, name: product.name, unit_price: product.price, qty: item.qty, line_total: product.price * item.qty }
    })

    const subtotal = validatedItems.reduce((s: number, i: any) => s + i.line_total, 0)
    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_RATE
    const total = subtotal + shipping

    return new Response(JSON.stringify({ valid: true, subtotal, shipping, total, items: validatedItems }), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ valid: false, error: err.message }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } })
  }
})
