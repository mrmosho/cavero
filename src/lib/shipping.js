import { FREE_SHIPPING_THRESHOLD, FLAT_SHIPPING_RATE } from './constants'
export const BOSTA_READY = false
export function calculateShipping(subtotal) {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_RATE
}
