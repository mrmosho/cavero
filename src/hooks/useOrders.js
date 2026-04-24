import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Fetches a single order by ID.
 * Used on the order confirmation page — no auth required,
 * the order_id in the URL is the only key needed.
 */
export function useOrder(orderId) {
  const [order,   setOrder]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (!orderId) { setLoading(false); return }
    let cancelled = false

    async function fetchOrder() {
      setLoading(true)
      const { data, error: sbError } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', orderId)
        .single()

      if (cancelled) return
      if (sbError) setError(sbError.message)
      else setOrder(data)
      setLoading(false)
    }

    fetchOrder()
    return () => { cancelled = true }
  }, [orderId])

  return { order, loading, error }
}

/**
 * Creates an order in Supabase.
 * Called from Checkout.jsx after form validation.
 * Returns { orderId, error }.
 */
export async function createOrder({ cart, customer, shippingAddress, shipping, total, paymentMethod, notes }) {
  // 1 — insert order row
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      guest_email:      customer.email,
      status:           'pending_payment',
      subtotal:         total - shipping,
      shipping,
      total,
      shipping_address: shippingAddress,
      payment_method:   paymentMethod,
      notes:            notes || null,
    })
    .select()
    .single()

  if (orderError) return { orderId: null, error: orderError.message }

  // 2 — insert order_items rows
  const items = cart.map(item => ({
    order_id:             order.id,
    product_slug:         item.slug,
    product_name:         item.name,
    unit_price:           item.price,
    qty:                  item.qty,
    variant_name:         item.variantName        || null,
    personalisation_note: item.personalisationNote || null,
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(items)

  if (itemsError) {
    // Order row exists but items failed — log and return error
    console.error('Order created but items insert failed:', itemsError.message)
    return { orderId: order.id, error: itemsError.message }
  }

  return { orderId: order.id, error: null }
}
