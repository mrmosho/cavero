import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Paymob webhook — handles payment callbacks
 * Register URL in Paymob dashboard:
 * https://<project-ref>.supabase.co/functions/v1/paymob-webhook
 *
 * Required Supabase secrets:
 *   PAYMOB_HMAC_SECRET
 *   RESEND_API_KEY       (add when Resend account ready)
 *   RESEND_FROM_EMAIL    e.g. orders@cavero.com
 */

serve(async (req) => {
  try {
    const body = await req.json()
    const txn = body.obj

    // HMAC verification
    const hmacSecret = Deno.env.get('PAYMOB_HMAC_SECRET')
    const receivedHmac = body.hmac
    if (hmacSecret && receivedHmac) {
      const hmacString = [txn?.amount_cents,txn?.created_at,txn?.currency,txn?.error_occured,txn?.has_parent_transaction,txn?.id,txn?.integration_id,txn?.is_3d_secure,txn?.is_auth,txn?.is_capture,txn?.is_refunded,txn?.is_standalone_payment,txn?.is_voided,txn?.order?.id,txn?.owner,txn?.pending,txn?.source_data?.pan,txn?.source_data?.sub_type,txn?.source_data?.type,txn?.success].join('')
      const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(hmacSecret), { name:'HMAC', hash:'SHA-512' }, false, ['sign'])
      const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(hmacString))
      const computed = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2,'0')).join('')
      if (computed !== receivedHmac) { console.error('HMAC mismatch'); return new Response('Unauthorized', { status: 401 }) }
    }

    const paymobOrderId = String(txn?.order?.id)
    const success = txn?.success === true
    const pending = txn?.pending === true
    const txnId = String(txn?.id)
    if (!paymobOrderId) return new Response('No order ID', { status: 400 })

    const newStatus = success && !pending ? 'paid' : 'pending_payment'

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: order, error } = await supabase.from('orders').update({ status: newStatus, paymob_txn_id: txnId }).eq('paymob_order_id', paymobOrderId).select('*, order_items(*)').single()
    if (error) { console.error('Order update failed:', error.message); return new Response('DB error', { status: 500 }) }

    if (newStatus === 'paid' && order) await sendConfirmationEmail(order)

    return new Response(JSON.stringify({ received: true, status: newStatus }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('Webhook error:', err)
    return new Response('Error', { status: 500 })
  }
})

async function sendConfirmationEmail(order: any) {
  const resendKey = Deno.env.get('RESEND_API_KEY')
  const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'orders@cavero.com'
  if (!resendKey) { console.warn('RESEND_API_KEY not set — skipping email'); return }

  const items = order.order_items || []
  const addr = order.shipping_address || {}
  const itemsHtml = items.map((i: any) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f0ede6;">${i.product_name}${i.variant_name?` (${i.variant_name})`:''}${i.personalisation_note?`<br><small style="color:#B8B5A8;">"${i.personalisation_note}"</small>`:''}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f0ede6;text-align:right;">x${i.qty}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f0ede6;text-align:right;">EGP ${(i.unit_price*i.qty).toLocaleString()}</td>
    </tr>`).join('')

  const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#f8f6f0;margin:0;padding:40px 20px;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:4px;overflow:hidden;">
      <div style="background:#2D2B34;padding:40px;text-align:center;">
        <h1 style="font-family:Georgia,serif;color:#E8E4D8;font-weight:300;font-size:2rem;margin:0;letter-spacing:0.15em;">Cavero</h1>
        <p style="color:rgba(232,228,216,0.6);font-size:0.75rem;letter-spacing:0.1em;text-transform:uppercase;margin:8px 0 0;">Studio-crafted objects · Cairo</p>
      </div>
      <div style="padding:40px;">
        <p style="font-family:Georgia,serif;font-size:1.5rem;font-weight:300;color:#2D2B34;margin:0 0 8px;">Thank you, ${order.shipping_address?.name?.split(' ')[0]}.</p>
        <p style="color:#B8B5A8;font-size:0.9rem;margin:0 0 32px;">Your order is confirmed and will enter production shortly.</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <thead><tr>
            <th style="text-align:left;font-size:0.7rem;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;color:#B8B5A8;padding-bottom:12px;">Item</th>
            <th style="text-align:right;font-size:0.7rem;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;color:#B8B5A8;padding-bottom:12px;">Qty</th>
            <th style="text-align:right;font-size:0.7rem;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;color:#B8B5A8;padding-bottom:12px;">Price</th>
          </tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div style="background:#f8f6f0;padding:20px;border-radius:2px;margin-bottom:32px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="font-size:0.85rem;color:#B8B5A8;">Subtotal</span><span style="font-size:0.85rem;">EGP ${order.subtotal?.toLocaleString()}</span></div>
          <div style="display:flex;justify-content:space-between;margin-bottom:12px;"><span style="font-size:0.85rem;color:#B8B5A8;">Shipping</span><span style="font-size:0.85rem;">${order.shipping===0?'Free':`EGP ${order.shipping}`}</span></div>
          <div style="display:flex;justify-content:space-between;border-top:1px solid #e8e4d8;padding-top:12px;"><span style="font-weight:500;">Total</span><span style="font-weight:500;color:#A8956F;">EGP ${order.total?.toLocaleString()}</span></div>
        </div>
        <div style="margin-bottom:32px;">
          <p style="font-size:0.7rem;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;color:#B8B5A8;margin-bottom:8px;">Delivering to</p>
          <p style="font-size:0.9rem;line-height:1.7;color:#2D2B34;margin:0;">${addr?.name}<br>${addr?.line1}${addr?.line2?', '+addr?.line2:''}<br>${addr?.city}, ${addr?.governorate}<br>${addr?.phone}</p>
        </div>
        <div style="background:#2D2B34;padding:24px;border-radius:2px;">
          <p style="font-size:0.7rem;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;color:#B8B5A8;margin:0 0 12px;">What happens next</p>
          <p style="font-size:0.85rem;color:rgba(232,228,216,0.8);line-height:1.7;margin:0;">Your piece is now in production. We will ship via Bosta and send you a tracking link once your order is on its way. Estimated delivery: 5-7 business days.</p>
        </div>
      </div>
      <div style="background:#f8f6f0;padding:20px;text-align:center;"><p style="font-size:0.72rem;color:#B8B5A8;margin:0;">© 2025 Cavero Studio · Cairo, Egypt</p></div>
    </div>
  </body></html>`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: fromEmail, to: order.guest_email, subject: 'Your Cavero order is confirmed \u2726', html }),
    })
    if (!res.ok) console.error('Resend error:', await res.text())
    else console.log('Confirmation email sent to', order.guest_email)
  } catch (err) { console.error('Email send failed:', err) }
}
