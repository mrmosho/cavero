/**
 * paymob-webhook Edge Function — STUBBED
 *
 * Receives payment callbacks from Paymob.
 * Verifies HMAC signature, updates order status.
 *
 * When Paymob account is ready:
 * 1. Set PAYMOB_HMAC_SECRET in Supabase Edge Function secrets
 * 2. Register this URL in Paymob dashboard:
 *    https://<your-project>.supabase.co/functions/v1/paymob-webhook
 * 3. Uncomment the HMAC verification and order update logic below
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts'

serve(async (req) => {
  try {
    const body = await req.json()

    // ── HMAC verification ──────────────────────────────────
    // Uncomment when Paymob is ready
    /*
    const hmacSecret = Deno.env.get('PAYMOB_HMAC_SECRET')!
    const receivedHmac = body.hmac

    // Paymob HMAC string — concatenate specific fields in exact order
    const hmacData = [
      body.obj?.amount_cents,
      body.obj?.created_at,
      body.obj?.currency,
      body.obj?.error_occured,
      body.obj?.has_parent_transaction,
      body.obj?.id,
      body.obj?.integration_id,
      body.obj?.is_3d_secure,
      body.obj?.is_auth,
      body.obj?.is_capture,
      body.obj?.is_refunded,
      body.obj?.is_standalone_payment,
      body.obj?.is_voided,
      body.obj?.order?.id,
      body.obj?.owner,
      body.obj?.pending,
      body.obj?.source_data?.pan,
      body.obj?.source_data?.sub_type,
      body.obj?.source_data?.type,
      body.obj?.success,
    ].join('')

    const computedHmac = createHmac('sha512', hmacSecret)
      .update(hmacData)
      .digest('hex')

    if (computedHmac !== receivedHmac) {
      console.error('HMAC verification failed')
      return new Response('Unauthorized', { status: 401 })
    }
    */

    // ── Update order status ────────────────────────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const txn       = body.obj
    const paymobOrderId = String(txn?.order?.id)
    const success       = txn?.success === true
    const pending       = txn?.pending === true
    const txnId         = String(txn?.id)

    if (!paymobOrderId) {
      return new Response('No order ID in payload', { status: 400 })
    }

    let newStatus = 'pending_payment'
    if (success && !pending) newStatus = 'paid'
    else if (!success)       newStatus = 'pending_payment'

    const { error } = await supabase
      .from('orders')
      .update({
        status:         newStatus,
        paymob_txn_id:  txnId,
        updated_at:     new Date().toISOString(),
      })
      .eq('paymob_order_id', paymobOrderId)

    if (error) {
      console.error('Order update failed:', error.message)
      return new Response('DB error', { status: 500 })
    }

    // TODO: Send confirmation email here via Resend when email is set up
    // if (newStatus === 'paid') { await sendConfirmationEmail(order) }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Webhook error:', err)
    return new Response('Error', { status: 500 })
  }
})
