import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
export function useOrder(orderId) {
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  useEffect(() => {
    if (!orderId) { setLoading(false); return }
    let cancelled = false
    async function fetchOrder() {
      setLoading(true)
      const { data, error: sbError } = await supabase.from('orders').select('*, order_items(*)').eq('id', orderId).single()
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
export async function createOrder({ cart, customer, shippingAddress, shipping, total, paymentMethod, notes }) {
  const { data: order, error: orderError } = await supabase.from('orders').insert({ guest_email: customer.email, guest_name: customer.name, guest_phone: customer.phone, status: 'pending_payment', subtotal: total - shipping, shipping, total, shipping_address: shippingAddress, payment_method: paymentMethod, notes: notes || null }).select().single()
  if (orderError) return { orderId: null, error: orderError.message }
  const items = cart.map(item => ({ order_id: order.id, product_slug: item.slug, product_name: item.name, unit_price: item.price, qty: item.qty, variant_name: item.variantName || null, personalisation_note: item.personalisationNote || null }))
  const { error: itemsError } = await supabase.from('order_items').insert(items)
  if (itemsError) return { orderId: order.id, error: itemsError.message }
  return { orderId: order.id, error: null }
}
