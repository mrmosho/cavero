export const PAYMOB_READY = false

export async function initiatePaymobPayment({ order, customer }) {
  if (!PAYMOB_READY) throw new Error('Paymob not yet integrated.')
  // Implement when Paymob account is ready
  // See full stub in previous version
}
