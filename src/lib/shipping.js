/**
 * Shipping calculation — STUBBED
 *
 * Currently uses flat rate logic.
 * When Bosta account is ready:
 * 1. Sign up at bosta.co, get API key
 * 2. Add VITE_BOSTA_API_KEY to .env.local
 * 3. Implement getBostaShippingRate() below
 * 4. Replace calculateShipping() with the live API call
 *
 * Bosta API docs: https://developer.bosta.co
 */

import { FREE_SHIPPING_THRESHOLD, FLAT_SHIPPING_RATE } from './constants'

export const BOSTA_READY = false  // flip to true when integrated

// Current stub — flat rate, free over threshold
export function calculateShipping(subtotal) {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_RATE
}

// Future Bosta implementation
export async function getBostaShippingRate({ governorate, weight = 1 }) {
  if (!BOSTA_READY) {
    return calculateShipping(0)  // fallback to flat rate
  }
  /*
  const res = await fetch('https://api.bosta.co/v2/pricing/calculate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_BOSTA_API_KEY}`,
    },
    body: JSON.stringify({
      dropOffCity: 'Cairo',
      pickupCity:  governorate,
      weight,
      type: 'SEND',
    }),
  })
  const data = await res.json()
  return data.price
  */
}
