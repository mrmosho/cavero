/**
 * Email sending via Resend — STUBBED
 *
 * To activate:
 * 1. Sign up at resend.com
 * 2. Add a sending domain (Settings → Domains)
 * 3. Create an API key
 * 4. Add to .env.local:
 *      VITE_RESEND_API_KEY=re_xxxxxxxxxxxx
 *      VITE_RESEND_FROM_EMAIL=orders@yourdomain.com
 * 5. Set RESEND_READY = true below
 *
 * Both functions are called from:
 *   - WelcomePopup.jsx  → sendDiscountEmail()
 *   - Checkout.jsx      → sendOrderConfirmationEmail()
 */

export const RESEND_READY = false

const FROM = import.meta.env.VITE_RESEND_FROM_EMAIL || 'orders@caveroegy.com'
const KEY  = import.meta.env.VITE_RESEND_API_KEY

async function sendEmail({ to, subject, html }) {
  if (!RESEND_READY || !KEY) {
    console.log('[Email stub] Would send to:', to, '| Subject:', subject)
    return { ok: true, stub: true }
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  })
  return { ok: res.ok, stub: false }
}

// ── Welcome discount email ─────────────────────────────────
export async function sendDiscountEmail({ to, code, expiresAt }) {
  const expiry = new Date(expiresAt).toLocaleDateString('en-EG', { day: 'numeric', month: 'long', year: 'numeric' })
  const html = `
    <!DOCTYPE html><html><body style="font-family:sans-serif;background:#f8f6f0;margin:0;padding:40px 20px;">
    <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:4px;overflow:hidden;">
      <div style="background:#2D2B34;padding:40px;text-align:center;">
        <h1 style="font-family:Georgia,serif;color:#E8E4D8;font-weight:300;font-size:2rem;margin:0;letter-spacing:0.15em;">Cavero</h1>
      </div>
      <div style="padding:40px;">
        <h2 style="font-family:Georgia,serif;font-size:1.5rem;font-weight:300;color:#2D2B34;margin:0 0 16px;">Your 10% discount is waiting.</h2>
        <p style="font-size:0.9rem;color:#B8B5A8;line-height:1.7;margin:0 0 32px;">Use this code at checkout to get 10% off your first order.</p>
        <div style="background:#F8F6F0;border:2px dashed #A8956F;border-radius:4px;padding:24px;text-align:center;margin-bottom:32px;">
          <p style="font-size:0.7rem;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:#B8B5A8;margin:0 0 8px;">Your discount code</p>
          <p style="font-family:monospace;font-size:1.6rem;font-weight:700;color:#2D2B34;letter-spacing:0.1em;margin:0;">${code}</p>
          <p style="font-size:0.75rem;color:#B8B5A8;margin:8px 0 0;">Valid until ${expiry}</p>
        </div>
        <a href="${import.meta.env.VITE_APP_URL || 'https://caveroegy.com'}/shop"
          style="display:block;text-align:center;padding:15px;background:#A8956F;color:#fff;text-decoration:none;border-radius:2px;font-size:0.75rem;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;">
          Shop the collection
        </a>
      </div>
      <div style="background:#F8F6F0;padding:20px;text-align:center;">
        <p style="font-size:0.72rem;color:#B8B5A8;margin:0;">© 2025 Cavero Studio · Cairo, Egypt</p>
      </div>
    </div>
    </body></html>
  `
  return sendEmail({ to, subject: 'Your Cavero discount code ✦', html })
}

// ── Order confirmation email ───────────────────────────────
export async function sendOrderConfirmationEmail({ order }) {
  if (!order?.guest_email) return

  const items    = order.order_items || []
  const addr     = order.shipping_address || {}
  const itemsHtml = items.map(i => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f0ede6;font-size:0.88rem;">
        ${i.product_name}${i.variant_name ? ` (${i.variant_name})` : ''}
        ${i.personalisation_note ? `<br><span style="color:#B8B5A8;font-size:0.78rem;">"${i.personalisation_note}"</span>` : ''}
      </td>
      <td style="padding:8px 0;border-bottom:1px solid #f0ede6;text-align:center;font-size:0.88rem;">×${i.qty}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f0ede6;text-align:right;font-size:0.88rem;color:#A8956F;">EGP ${(i.unit_price * i.qty).toLocaleString()}</td>
    </tr>`).join('')

  const discountRow = order.discount_amount > 0
    ? `<div style="display:flex;justify-content:space-between;font-size:0.85rem;color:#6B8F5E;padding:6px 0;">
        <span>Discount (${order.discount_code})</span><span>− EGP ${order.discount_amount.toLocaleString()}</span>
       </div>` : ''

  const html = `
    <!DOCTYPE html><html><body style="font-family:sans-serif;background:#f8f6f0;margin:0;padding:40px 20px;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:4px;overflow:hidden;">
      <div style="background:#2D2B34;padding:40px;text-align:center;">
        <h1 style="font-family:Georgia,serif;color:#E8E4D8;font-weight:300;font-size:2rem;margin:0;letter-spacing:0.15em;">Cavero</h1>
        <p style="color:rgba(232,228,216,0.6);font-size:0.75rem;letter-spacing:0.1em;text-transform:uppercase;margin:8px 0 0;">Studio-crafted objects · Cairo</p>
      </div>
      <div style="padding:40px;">
        <p style="font-family:Georgia,serif;font-size:1.5rem;font-weight:300;color:#2D2B34;margin:0 0 8px;">Thank you, ${addr.name?.split(' ')[0] || ''}.</p>
        <p style="color:#B8B5A8;font-size:0.9rem;margin:0 0 32px;">Your order has been placed. We will contact you within 24 hours to confirm and start production.</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <thead><tr>
            <th style="text-align:left;font-size:0.68rem;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;color:#B8B5A8;padding-bottom:10px;">Item</th>
            <th style="text-align:center;font-size:0.68rem;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;color:#B8B5A8;padding-bottom:10px;">Qty</th>
            <th style="text-align:right;font-size:0.68rem;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;color:#B8B5A8;padding-bottom:10px;">Price</th>
          </tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div style="background:#f8f6f0;padding:20px;border-radius:2px;margin-bottom:28px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:0.85rem;color:#B8B5A8;"><span>Subtotal</span><span>EGP ${order.subtotal?.toLocaleString()}</span></div>
          ${discountRow}
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:0.85rem;color:#B8B5A8;"><span>Shipping</span><span>${order.shipping === 0 ? 'Free' : `EGP ${order.shipping}`}</span></div>
          <div style="display:flex;justify-content:space-between;border-top:1px solid #e8e4d8;padding-top:12px;margin-top:6px;font-weight:500;"><span>Total</span><span style="color:#A8956F;">EGP ${order.total?.toLocaleString()}</span></div>
        </div>
        <div style="margin-bottom:28px;">
          <p style="font-size:0.7rem;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;color:#B8B5A8;margin-bottom:10px;">Delivering to</p>
          <p style="font-size:0.9rem;line-height:1.7;color:#2D2B34;margin:0;">
            ${addr.name}<br>${addr.line1}${addr.line2 ? ', ' + addr.line2 : ''}<br>
            ${addr.city}, ${addr.governorate}<br>${addr.phone}
          </p>
        </div>
        <div style="background:#2D2B34;padding:24px;border-radius:2px;">
          <p style="font-size:0.7rem;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;color:#B8B5A8;margin:0 0 10px;">What happens next</p>
          <p style="font-size:0.85rem;color:rgba(232,228,216,0.8);line-height:1.7;margin:0;">We will contact you via WhatsApp or email within 24 hours. Your piece enters production and ships in 5-7 business days via Bosta.</p>
        </div>
      </div>
      <div style="background:#f8f6f0;padding:20px;text-align:center;">
        <p style="font-size:0.72rem;color:#B8B5A8;margin:0;">© 2025 Cavero Studio · Cairo, Egypt · <a href="https://wa.me/201055115993" style="color:#A8956F;">WhatsApp us</a></p>
      </div>
    </div>
    </body></html>
  `
  return sendEmail({ to: order.guest_email, subject: 'Your Cavero order is confirmed ✦', html })
}