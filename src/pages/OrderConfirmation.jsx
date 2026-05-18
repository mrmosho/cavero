import { useSearchParams, Link } from 'react-router-dom'
import { useOrder } from '@/hooks/useOrders'
import { ORDER_STATUS } from '@/lib/constants'
import Footer from '@/components/Footer'

export default function OrderConfirmation() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('id')
  const { order, loading, error } = useOrder(orderId)

  if (loading) return <div style={{ paddingTop: 'calc(var(--nav-h) + 80px)', textAlign: 'center', padding: '160px 24px' }}><p style={{ color: 'var(--stone)' }}>Loading your order...</p></div>
  if (error || !order) return (
    <div style={{ paddingTop: 'calc(var(--nav-h) + 80px)', textAlign: 'center', padding: '160px 24px' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 300, marginBottom: 16 }}>Order not found</h2>
      <Link to="/" className="btn btn-bronze">Back to home</Link>
    </div>
  )

  const status = ORDER_STATUS[order.status] || ORDER_STATUS.pending_payment
  const addr = order.shipping_address || {}
  const items = order.order_items || []

  return (
    <>
      <div style={{ paddingTop: 'calc(var(--nav-h) + 60px)', paddingBottom: 80, background: 'var(--cream)', minHeight: '100vh' }}>
        <div className="container" style={{ maxWidth: 680 }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 20 }}>✦</div>
            <p className="t-label" style={{ marginBottom: 12 }}>Order placed</p>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 300, lineHeight: 1.1, marginBottom: 16 }}>
              Thank you, {order.shipping_address?.name?.split(' ')[0]}.
            </h1>
            <p style={{ fontSize: '1rem', lineHeight: 1.8, color: 'rgba(45,43,52,0.72)', maxWidth: 480, margin: '0 auto' }}>
              Your order has been received. We will be in touch within 24 hours to confirm your order and start production.
            </p>
          </div>
          <div style={{ background: 'var(--charcoal)', color: 'var(--cream)', padding: '24px 32px', borderRadius: 'var(--r)', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--stone)', marginBottom: 6 }}>Order reference</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 300 }}>{order.id.split('-')[0].toUpperCase()}</p>
            </div>
            <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 100, fontSize: '0.72rem', fontWeight: 500, background: 'rgba(168,149,111,0.15)', color: 'var(--amber)' }}>{status.label}</span>
          </div>
          <div style={{ background: 'var(--white)', padding: '28px 32px', borderRadius: 'var(--r)', marginBottom: 16, border: '1px solid rgba(45,43,52,0.08)' }}>
            <p style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--stone)', marginBottom: 20 }}>Items ordered</p>
            {items.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 0', borderBottom: '1px solid rgba(45,43,52,0.07)' }}>
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 400, marginBottom: 3 }}>{item.product_name}</div>
                  {item.variant_name && <div style={{ fontSize: '0.75rem', color: 'var(--stone)' }}>{item.variant_name}</div>}
                  {item.personalisation_note && <div style={{ fontSize: '0.75rem', color: 'var(--stone)', marginTop: 3, fontStyle: 'italic' }}>"{item.personalisation_note}"</div>}
                  <div style={{ fontSize: '0.75rem', color: 'var(--stone)', marginTop: 3 }}>Qty: {item.qty}</div>
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--bronze)', flexShrink: 0, marginLeft: 16 }}>EGP {(item.unit_price * item.qty).toLocaleString()}</div>
              </div>
            ))}
            <div style={{ paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[['Subtotal', `EGP ${order.subtotal?.toLocaleString()}`], ['Shipping', order.shipping === 0 ? 'Free' : `EGP ${order.shipping}`]].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--stone)' }}><span>{l}</span><span>{v}</span></div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 500, paddingTop: 10, borderTop: '1px solid rgba(45,43,52,0.1)', marginTop: 4 }}>
                <span>Total</span><span style={{ color: 'var(--bronze)' }}>EGP {order.total?.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div style={{ background: 'var(--white)', padding: '28px 32px', borderRadius: 'var(--r)', marginBottom: 16, border: '1px solid rgba(45,43,52,0.08)' }}>
            <p style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--stone)', marginBottom: 14 }}>Delivering to</p>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.8 }}>{addr.name}<br />{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}<br />{addr.city}, {addr.governorate}<br />{addr.phone}</p>
          </div>
          <div style={{ padding: '28px 32px', borderRadius: 'var(--r)', border: '1px solid rgba(45,43,52,0.1)', marginBottom: 40 }}>
            <p style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--stone)', marginBottom: 20 }}>What happens next</p>
            {[
              ['Within 24 hours', "We will contact you via WhatsApp or email to confirm your order and discuss any personalisation details."],
              ['Production', 'Your piece enters production in our Cairo studio. 3-5 business days. Payment collected on delivery.'],
              ['Shipping', "We ship via Bosta. You will receive a tracking link once your order is on the way."],
            ].map(([step, desc], i) => (
              <div key={i} style={{ display: 'flex', gap: 16, marginBottom: i < 2 ? 18 : 0 }}>
                <div style={{ width: 28, height: 28, minWidth: 28, borderRadius: '50%', background: 'var(--light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 500 }}>{i + 1}</div>
                <div><div style={{ fontSize: '0.85rem', fontWeight: 500, marginBottom: 4 }}>{step}</div><div style={{ fontSize: '0.82rem', color: 'var(--stone)', lineHeight: 1.7 }}>{desc}</div></div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/shop" className="btn btn-outline">Continue shopping</Link>
            <a href="https://wa.me/201XXXXXXXXX" target="_blank" rel="noreferrer" className="btn btn-bronze">Contact us on WhatsApp</a>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}