/**
 * Paymob integration — STUBBED
 *
 * When your Paymob account is ready:
 * 1. Add VITE_PAYMOB_API_KEY, VITE_PAYMOB_INTEGRATION_ID, VITE_PAYMOB_IFRAME_ID to .env.local
 * 2. Uncomment and implement the functions below
 * 3. Update Checkout.jsx to call initiatePaymobPayment() instead of the manual stub
 * 4. Deploy supabase/functions/paymob-webhook/index.ts as an Edge Function
 *
 * Paymob flow:
 *   authenticate() → createPaymobOrder() → getPaymentKey() → redirect to iframe
 */

export const PAYMOB_READY = false  // flip to true when integrated

// Step 1 — get auth token (valid for 1hr, cache it)
export async function authenticatePaymob() {
  throw new Error('Paymob not yet integrated. Set PAYMOB_READY = true when ready.')
  /*
  const res = await fetch('https://accept.paymob.com/api/auth/tokens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: import.meta.env.VITE_PAYMOB_API_KEY }),
  })
  const data = await res.json()
  return data.token
  */
}

// Step 2 — create order on Paymob
export async function createPaymobOrder({ authToken, amountCents, items }) {
  throw new Error('Paymob not yet integrated.')
  /*
  const res = await fetch('https://accept.paymob.com/api/ecommerce/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_token: authToken,
      delivery_needed: false,
      amount_cents: amountCents,
      currency: 'EGP',
      items,
    }),
  })
  const data = await res.json()
  return data.id
  */
}

// Step 3 — get payment key for iframe
export async function getPaymentKey({ authToken, amountCents, paymobOrderId, billingData }) {
  throw new Error('Paymob not yet integrated.')
  /*
  const res = await fetch('https://accept.paymob.com/api/acceptance/payment_keys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_token: authToken,
      amount_cents: amountCents,
      expiration: 3600,
      order_id: paymobOrderId,
      billing_data: billingData,
      currency: 'EGP',
      integration_id: import.meta.env.VITE_PAYMOB_INTEGRATION_ID,
    }),
  })
  const data = await res.json()
  return data.token
  */
}

// Full flow helper — call this from Checkout.jsx when ready
export async function initiatePaymobPayment({ order, customer }) {
  if (!PAYMOB_READY) {
    throw new Error('Paymob not yet integrated.')
  }
  const authToken     = await authenticatePaymob()
  const paymobOrderId = await createPaymobOrder({
    authToken,
    amountCents: order.total * 100,
    items: order.items.map(i => ({
      name: i.product_name,
      amount_cents: i.unit_price * 100,
      description: i.variant_name || '',
      quantity: i.qty,
    })),
  })
  const paymentKey = await getPaymentKey({
    authToken,
    amountCents: order.total * 100,
    paymobOrderId,
    billingData: {
      first_name:   customer.name.split(' ')[0],
      last_name:    customer.name.split(' ').slice(1).join(' ') || 'N/A',
      email:        customer.email,
      phone_number: customer.phone,
      country:      'EG',
      city:         customer.city,
      street:       customer.line1,
    },
  })
  const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${import.meta.env.VITE_PAYMOB_IFRAME_ID}?payment_token=${paymentKey}`
  window.location.href = iframeUrl
}
