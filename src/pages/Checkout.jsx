import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '@/context/CartContext'
import { createOrder } from '@/hooks/useOrders'
import { calculateShipping } from '@/lib/shipping'
import { GOVERNORATES } from '@/lib/constants'
import { supabase } from '@/lib/supabase'
import { sendOrderConfirmationEmail } from '@/lib/email'
import ProductIllustration from '@/components/illustrations/ProductIllustration'
import Footer from '@/components/Footer'
import Toast from '@/components/Toast'
import { pixelInitiateCheckout, pixelPurchase } from '@/lib/pixel'


const EMPTY = { fullName:'', email:'', phone:'', line1:'', line2:'', city:'', governorate:'Cairo', postalCode:'', orderNotes:'' }

export default function Checkout() {
  const { cart, cartTotal, clearCart } = useCart()
  const navigate = useNavigate()

  const [form,        setForm]        = useState(EMPTY)
  const [errors,      setErrors]      = useState({})
  const [loading,     setLoading]     = useState(false)
  const [serverError, setServerError] = useState(null)

  // Discount
  const [discountInput,   setDiscountInput]  = useState('')
  const [discountOpen,    setDiscountOpen]   = useState(false)
  const [discountLoading, setDiscountLoading]= useState(false)
  const [discountError,   setDiscountError]  = useState(null)
  const [appliedDiscount, setAppliedDiscount]= useState(null)

  const shipping       = calculateShipping(cartTotal)
  const discountAmount = appliedDiscount ? Math.round(cartTotal * appliedDiscount.percent_off / 100) : 0
  const total          = cartTotal - discountAmount + shipping

  const set = f => e => setForm(prev => ({ ...prev, [f]: e.target.value }))

  function validate() {
    const e = {}
    if (!form.fullName.trim()) e.fullName = 'Required'
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required'
    if (!form.phone.trim())  e.phone  = 'Required'
    if (!form.line1.trim())  e.line1  = 'Required'
    if (!form.city.trim())   e.city   = 'Required'
    return e
  }

  async function handleApplyDiscount() {
    const code = discountInput.trim().toUpperCase()
    if (!code) return
    setDiscountLoading(true)
    setDiscountError(null)
    const { data, error } = await supabase.from('discount_codes').select('id,code,email,percent_off,expires_at,used').eq('code', code).single()
    setDiscountLoading(false)
    if (error || !data)                                   { setDiscountError('Code not found.'); return }
    if (data.used)                                        { setDiscountError('This code has already been used.'); return }
    if (new Date(data.expires_at) < new Date())           { setDiscountError('This code has expired.'); return }
    if (form.email && data.email !== form.email.toLowerCase().trim()) { setDiscountError('This code is not valid for this email address.'); return }
    const amount = Math.round(cartTotal * data.percent_off / 100)
    setAppliedDiscount({ id:data.id, code:data.code, email:data.email, percent_off:data.percent_off, amount })
    setDiscountInput('')
  }

  function removeDiscount() { setAppliedDiscount(null); setDiscountError(null) }

  async function handlePlaceOrder() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); window.scrollTo({ top:0, behavior:'smooth' }); return }
    if (!cart.length) return
    if (appliedDiscount && appliedDiscount.email !== form.email.toLowerCase().trim()) {
      setServerError('The discount code email does not match your order email.')
      return
    }
    setLoading(true)
    pixelInitiateCheckout({ cart, total })

    setServerError(null)

    // Check blocklist
    const { data: blocked } = await supabase.from('blocked_emails').select('id').eq('email', form.email.toLowerCase().trim()).maybeSingle()
    if (blocked) { setLoading(false); setServerError('We are unable to process this order. Please contact us on WhatsApp.'); return }

    const shippingAddress = { name:form.fullName, phone:form.phone, line1:form.line1, line2:form.line2||null, city:form.city, governorate:form.governorate, postal_code:form.postalCode||null }
    const { orderId, error } = await createOrder({ cart, customer:{ name:form.fullName, email:form.email, phone:form.phone }, shippingAddress, shipping, total, paymentMethod:'cod', notes:form.orderNotes||null, discountCode:appliedDiscount?.code||null, discountAmount:appliedDiscount?.amount||0 })

    if (error) { setLoading(false); setServerError('Something went wrong placing your order. Please try again.'); return }

    if (appliedDiscount) {
      await supabase.from('discount_codes').update({ used:true, used_at:new Date().toISOString(), order_id:orderId }).eq('id', appliedDiscount.id)
    }
    const { data: fullOrder } = await supabase.from('orders').select('*, order_items(*)').eq('id', orderId).single()
    if (fullOrder) await sendOrderConfirmationEmail({ order: fullOrder })

    setLoading(false)
    clearCart()
    pixelPurchase({ orderId, total, cart })
    navigate(`/order-confirmation?id=${orderId}`)
  }

  if (!cart.length) return (
    <div style={{ paddingTop:'calc(var(--nav-h) + 80px)', textAlign:'center', padding:'160px 24px' }}>
      <h2 style={{ fontFamily:'var(--font-display)', fontSize:'2rem', fontWeight:300, marginBottom:16 }}>Your cart is empty</h2>
      <Link to="/shop" className="btn btn-bronze">Shop the collection</Link>
    </div>
  )

  return (
    <>
      <Toast />
      <div style={{ paddingTop:'calc(var(--nav-h) + 40px)', paddingBottom:80, background:'var(--cream)', minHeight:'100vh' }}>
        <div className="container">
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:'2rem', fontWeight:300, marginBottom:40 }}>Checkout</h1>

          <div className="checkout-layout" style={{ display:'grid', gridTemplateColumns:'1fr 400px', gap:60, alignItems:'start' }}>

            {/* ── LEFT — form ── */}
            <div>
              {serverError && (
                <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'var(--r)', padding:'14px 18px', marginBottom:24, fontSize:'0.88rem', color:'#991B1B' }}>{serverError}</div>
              )}

              {/* Contact */}
              <Section title="Contact">
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                  <Field label="Full name" error={errors.fullName}><input className="form-input" type="text" value={form.fullName} onChange={set('fullName')} placeholder="Your Name" /></Field>
                  <Field label="Email address" error={errors.email}><input className="form-input" type="email" value={form.email} onChange={set('email')} placeholder="hello@example.com" /></Field>
                </div>
                <Field label="Phone number" error={errors.phone}><input className="form-input" type="tel" value={form.phone} onChange={set('phone')} placeholder="+20 1XX XXX XXXX" /></Field>
              </Section>

              {/* Shipping */}
              <Section title="Shipping address">
                <div style={{ display:'grid', gap:16 }}>
                  <Field label="Address line 1" error={errors.line1}><input className="form-input" type="text" value={form.line1} onChange={set('line1')} placeholder="Street, building, apartment" /></Field>
                  <Field label="Address line 2 (optional)"><input className="form-input" type="text" value={form.line2} onChange={set('line2')} placeholder="Floor, landmark, etc." /></Field>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                    <Field label="City" error={errors.city}><input className="form-input" type="text" value={form.city} onChange={set('city')} placeholder="Cairo" /></Field>
                    <Field label="Governorate">
                      <select className="form-input" value={form.governorate} onChange={set('governorate')}>
                        {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </Field>
                  </div>
                  <Field label="Postal code (optional)"><input className="form-input" type="text" value={form.postalCode} onChange={set('postalCode')} placeholder="11511" /></Field>
                </div>
              </Section>

              {/* Notes */}
              <Section title="Order notes (optional)">
                <textarea className="form-textarea" placeholder="Any delivery instructions or additional notes..." value={form.orderNotes} onChange={set('orderNotes')} style={{ minHeight:80 }} />
              </Section>

              {/* Payment */}
              <Section title="Payment">
                <div style={{ display:'flex', gap:14, alignItems:'flex-start', padding:'18px 22px', background:'var(--light)', border:'1px solid rgba(45,43,52,0.08)', borderRadius:'var(--r)' }}>
                  <div style={{ fontSize:'1.2rem', marginTop:2 }}>💵</div>
                  <div>
                    <div style={{ fontSize:'0.9rem', fontWeight:500, marginBottom:4 }}>Cash on delivery</div>
                    <div style={{ fontSize:'0.82rem', color:'var(--stone)', lineHeight:1.6 }}>Pay in cash when your order arrives. No payment required now.</div>
                  </div>
                </div>
              </Section>

              {/* Discount code */}
              <div style={{ marginBottom:32 }}>
                {!appliedDiscount ? (
                  <>
                    <button type="button" onClick={() => setDiscountOpen(o => !o)}
                      style={{ fontSize:'0.78rem', color:'var(--bronze)', background:'none', border:'none', cursor:'pointer', borderBottom:'1px solid var(--bronze)', paddingBottom:1, fontFamily:'var(--font-body)' }}>
                      {discountOpen ? 'Hide' : 'Have a discount code?'}
                    </button>
                    {discountOpen && (
                      <div style={{ marginTop:12, display:'flex', gap:8 }}>
                        <input type="text" value={discountInput} onChange={e => setDiscountInput(e.target.value.toUpperCase())} placeholder="WELCOME-XXXXXX" className="form-input" style={{ flex:1, textTransform:'uppercase', letterSpacing:'0.05em' }} onKeyDown={e => e.key==='Enter' && handleApplyDiscount()} />
                        <button type="button" onClick={handleApplyDiscount} disabled={discountLoading} className="btn btn-outline" style={{ whiteSpace:'nowrap' }}>{discountLoading ? '...' : 'Apply'}</button>
                      </div>
                    )}
                    {discountError && <p style={{ fontSize:'0.75rem', color:'#991B1B', marginTop:6 }}>{discountError}</p>}
                  </>
                ) : (
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(107,143,94,0.08)', border:'1px solid rgba(107,143,94,0.3)', borderRadius:'var(--r)', padding:'12px 16px' }}>
                    <div>
                      <span style={{ fontSize:'0.78rem', fontWeight:500, color:'#16A34A' }}>✓ {appliedDiscount.code}</span>
                      <span style={{ fontSize:'0.78rem', color:'var(--stone)', marginLeft:10 }}>−EGP {appliedDiscount.amount.toLocaleString()} ({appliedDiscount.percent_off}% off)</span>
                    </div>
                    <button type="button" onClick={removeDiscount} style={{ fontSize:'0.78rem', color:'var(--stone)', background:'none', border:'none', cursor:'pointer' }}>Remove</button>
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT — order summary + place order ── */}
            <div className="checkout-order-summary" style={{ position:'sticky', top:'calc(var(--nav-h) + 24px)' }}>
              <div style={{ background:'var(--charcoal)', color:'var(--cream)', padding:32, borderRadius:'var(--r)', marginBottom:16 }}>
                <div style={{ fontFamily:'var(--font-display)', fontSize:'1.3rem', fontWeight:300, marginBottom:20 }}>Your order</div>

                {/* Items */}
                {cart.map(item => (
                  <div key={item.key} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', paddingBottom:14, marginBottom:14, borderBottom:'1px solid rgba(232,228,216,0.1)' }}>
                    <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                      <div style={{ width:40, height:40, background:'rgba(232,228,216,0.08)', borderRadius:'var(--r)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <ProductIllustration slug={item.slug} style={{ width:24, height:24 }} />
                      </div>
                      <div>
                        <div style={{ fontSize:'0.82rem', lineHeight:1.3 }}>{item.name}</div>
                        {item.variantName && <div style={{ fontSize:'0.7rem', color:'rgba(232,228,216,0.5)', marginTop:2 }}>{item.variantName}</div>}
                        <div style={{ fontSize:'0.7rem', color:'rgba(232,228,216,0.5)', marginTop:1 }}>Qty: {item.qty}</div>
                      </div>
                    </div>
                    <div style={{ fontSize:'0.82rem', fontWeight:500, color:'var(--amber)', flexShrink:0, marginLeft:12 }}>EGP {(item.price*item.qty).toLocaleString()}</div>
                  </div>
                ))}

                {/* Totals */}
                {[
                  ['Subtotal', `EGP ${cartTotal.toLocaleString()}`],
                  ...(appliedDiscount ? [[`Discount (${appliedDiscount.percent_off}%)`, `− EGP ${discountAmount.toLocaleString()}`]] : []),
                  ['Shipping', shipping===0 ? 'Free' : `EGP ${shipping}`],
                ].map(([l, v]) => (
                  <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:'0.85rem', padding:'7px 0', borderBottom:'1px solid rgba(232,228,216,0.08)', color:l.startsWith('Discount')?'#86EFAC':'rgba(232,228,216,0.7)' }}>
                    <span>{l}</span><span>{v}</span>
                  </div>
                ))}
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'1rem', fontWeight:500, padding:'14px 0 0', color:'var(--cream)' }}>
                  <span>Total</span><span>EGP {total.toLocaleString()}</span>
                </div>
              </div>

              {/* Place order button — dark charcoal */}
              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                style={{ width:'100%', padding:'18px', background:'var(--charcoal)', color:'var(--cream)', border:'none', borderRadius:'var(--r)', fontSize:'0.78rem', fontWeight:500, letterSpacing:'0.12em', textTransform:'uppercase', cursor:loading?'default':'pointer', fontFamily:'var(--font-body)', opacity:loading?0.7:1, transition:'background .2s' }}
                onMouseEnter={e => { if (!loading) e.target.style.background='#1a1820' }}
                onMouseLeave={e => { e.target.style.background='var(--charcoal)' }}>
                {loading ? 'Placing order...' : 'Place order'}
              </button>

              <p style={{ fontSize:'0.72rem', color:'var(--stone)', textAlign:'center', marginTop:12, lineHeight:1.7 }}>
                By placing your order you agree to our terms.<br/>Production starts once your order is received.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom:32 }}>
      <h3 style={{ fontSize:'0.7rem', fontWeight:500, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--stone)', marginBottom:18, paddingBottom:10, borderBottom:'1px solid rgba(45,43,52,0.1)' }}>{title}</h3>
      {children}
    </div>
  )
}

function Field({ label, error, children }) {
  return (
    <div className="form-group" style={{ marginBottom:0 }}>
      <label className="form-label">{label}</label>
      {children}
      {error && <p style={{ fontSize:'0.72rem', color:'#991B1B', marginTop:5 }}>{error}</p>}
    </div>
  )
}