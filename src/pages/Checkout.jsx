import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '@/context/CartContext'
import { createOrder } from '@/hooks/useOrders'
import { calculateShipping } from '@/lib/shipping'
import { GOVERNORATES } from '@/lib/constants'
import { supabase } from '@/lib/supabase'
import { sendOrderConfirmationEmail } from '@/lib/email'
import Footer from '@/components/Footer'
import Toast from '@/components/Toast'

const STEPS = ['Delivery', 'Review & Place Order']
const EMPTY = { fullName:'', email:'', phone:'', line1:'', line2:'', city:'', governorate:'Cairo', postalCode:'', orderNotes:'' }

export default function Checkout() {
  const { cart, cartTotal, clearCart } = useCart()
  const navigate = useNavigate()

  const [step,        setStep]        = useState(0)
  const [form,        setForm]        = useState(EMPTY)
  const [errors,      setErrors]      = useState({})
  const [loading,     setLoading]     = useState(false)
  const [serverError, setServerError] = useState(null)

  // Discount
  const [discountInput,   setDiscountInput]   = useState('')
  const [discountOpen,    setDiscountOpen]     = useState(false)
  const [discountLoading, setDiscountLoading]  = useState(false)
  const [discountError,   setDiscountError]    = useState(null)
  const [appliedDiscount, setAppliedDiscount]  = useState(null)
  // appliedDiscount: { code, percent_off, amount, id }

  const shipping        = calculateShipping(cartTotal)
  const discountAmount  = appliedDiscount ? Math.round(cartTotal * appliedDiscount.percent_off / 100) : 0
  const total           = cartTotal - discountAmount + shipping

  const set = f => e => setForm(prev => ({ ...prev, [f]: e.target.value }))

  function validate() {
    const e = {}
    if (!form.fullName.trim()) e.fullName = 'Full name is required'
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email is required'
    if (!form.phone.trim()) e.phone = 'Phone number is required'
    if (!form.line1.trim()) e.line1 = 'Address is required'
    if (!form.city.trim())  e.city  = 'City is required'
    return e
  }

  function nextStep() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({})
    setStep(1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Discount validation ───────────────────────────────────
  async function handleApplyDiscount() {
    const code = discountInput.trim().toUpperCase()
    if (!code) return
    setDiscountLoading(true)
    setDiscountError(null)

    const { data, error } = await supabase
      .from('discount_codes')
      .select('id, code, email, percent_off, expires_at, used')
      .eq('code', code)
      .single()

    setDiscountLoading(false)

    if (error || !data) {
      setDiscountError('Code not found.')
      return
    }
    if (data.used) {
      setDiscountError('This code has already been used.')
      return
    }
    if (new Date(data.expires_at) < new Date()) {
      setDiscountError('This code has expired.')
      return
    }
    // Email check — only validate if user has filled in their email
    if (form.email && data.email !== form.email.toLowerCase().trim()) {
      setDiscountError('This code is not valid for this email address.')
      return
    }

    const amount = Math.round(cartTotal * data.percent_off / 100)
    setAppliedDiscount({ id: data.id, code: data.code, email: data.email, percent_off: data.percent_off, amount })
    setDiscountInput('')
  }

  function removeDiscount() {
    setAppliedDiscount(null)
    setDiscountError(null)
  }

  // ── Place order ───────────────────────────────────────────
  async function handlePlaceOrder() {
    if (!cart.length) return

    // If discount applied, verify email matches now that we have it
    if (appliedDiscount && appliedDiscount.email !== form.email.toLowerCase().trim()) {
      setServerError('The discount code email does not match your order email.')
      return
    }

    setLoading(true)
    setServerError(null)

    // Check if email is blocked
    const { data: blocked } = await supabase
      .from('blocked_emails')
      .select('id')
      .eq('email', form.email.toLowerCase().trim())
      .maybeSingle()
    if (blocked) {
      setLoading(false)
      setServerError('We are unable to process this order. Please contact us on WhatsApp.')
      return
    }

    const shippingAddress = {
      name: form.fullName, phone: form.phone,
      line1: form.line1, line2: form.line2 || null,
      city: form.city, governorate: form.governorate,
      postal_code: form.postalCode || null,
    }

    const { orderId, error } = await createOrder({
      cart,
      customer: { name: form.fullName, email: form.email, phone: form.phone },
      shippingAddress,
      shipping,
      total,
      paymentMethod:   'cod',
      notes:           form.orderNotes || null,
      discountCode:    appliedDiscount?.code    || null,
      discountAmount:  appliedDiscount?.amount  || 0,
    })

    if (error) {
      setLoading(false)
      setServerError('Something went wrong placing your order. Please try again.')
      return
    }

    // Mark discount code as used
    if (appliedDiscount) {
      await supabase
        .from('discount_codes')
        .update({ used: true, used_at: new Date().toISOString(), order_id: orderId })
        .eq('id', appliedDiscount.id)
    }

    // Send confirmation email (stubbed)
    const { data: fullOrder } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single()
    if (fullOrder) await sendOrderConfirmationEmail({ order: fullOrder })

    setLoading(false)
    clearCart()
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

          {/* Steps */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:48 }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:28, height:28, borderRadius:'50%', background:i<=step?'var(--charcoal)':'transparent', border:'1px solid var(--charcoal)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.7rem', fontWeight:500, color:i<=step?'var(--cream)':'var(--charcoal)' }}>{i+1}</div>
                <span style={{ fontSize:'0.72rem', fontWeight:500, letterSpacing:'0.08em', textTransform:'uppercase', color:i===step?'var(--charcoal)':'var(--stone)' }}>{s}</span>
                {i < STEPS.length-1 && <div style={{ width:40, height:1, background:'rgba(45,43,52,0.2)', margin:'0 4px' }} />}
              </div>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:60, alignItems:'start' }}>

            {/* Left */}
            <div>
              {step === 0 && (
                <div>
                  <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.8rem', fontWeight:300, marginBottom:32 }}>Delivery details</h2>
                  <fieldset style={{ border:'none', marginBottom:32 }}>
                    <legend style={{ fontSize:'0.7rem', fontWeight:500, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--stone)', marginBottom:20 }}>Contact</legend>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                      <Field label="Full name" error={errors.fullName}><input className="form-input" type="text" value={form.fullName} onChange={set('fullName')} placeholder=" Your name " /></Field>
                      <Field label="Email address" error={errors.email}><input className="form-input" type="email" value={form.email} onChange={set('email')} placeholder="hello@example.com" /></Field>
                    </div>
                    <div style={{ marginTop:16 }}>
                      <Field label="Phone number" error={errors.phone}><input className="form-input" type="tel" value={form.phone} onChange={set('phone')} placeholder="+20 1XX XXX XXXX" /></Field>
                    </div>
                  </fieldset>
                  <fieldset style={{ border:'none', marginBottom:32 }}>
                    <legend style={{ fontSize:'0.7rem', fontWeight:500, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--stone)', marginBottom:20 }}>Shipping address</legend>
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
                  </fieldset>
                  <fieldset style={{ border:'none', marginBottom:32 }}>
                    <legend style={{ fontSize:'0.7rem', fontWeight:500, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--stone)', marginBottom:20 }}>Order notes (optional)</legend>
                    <textarea className="form-textarea" placeholder="Any delivery instructions or additional notes..." value={form.orderNotes} onChange={set('orderNotes')} style={{ minHeight:80 }} />
                  </fieldset>
                  <button className="btn btn-bronze btn-lg" style={{ width:'100%' }} onClick={nextStep}>Continue to review →</button>
                </div>
              )}

              {step === 1 && (
                <div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:32 }}>
                    <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.8rem', fontWeight:300 }}>Review your order</h2>
                    <button style={{ fontSize:'0.72rem', letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--bronze)', cursor:'pointer', background:'none', border:'none', borderBottom:'1px solid var(--bronze)', paddingBottom:2 }} onClick={() => setStep(0)}>Edit details</button>
                  </div>

                  {/* Delivery summary */}
                  <div style={{ background:'var(--white)', padding:24, borderRadius:'var(--r)', marginBottom:20, border:'1px solid rgba(45,43,52,0.08)' }}>
                    <p style={{ fontSize:'0.7rem', fontWeight:500, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--stone)', marginBottom:14 }}>Delivering to</p>
                    <p style={{ fontWeight:500, marginBottom:4 }}>{form.fullName}</p>
                    <p style={{ fontSize:'0.88rem', color:'var(--stone)', lineHeight:1.7 }}>
                      {form.line1}{form.line2?`, ${form.line2}`:''}<br />
                      {form.city}, {form.governorate}<br />
                      {form.phone} · {form.email}
                    </p>
                  </div>

                  {/* COD notice */}
                  <div style={{ background:'var(--light)', padding:'18px 22px', borderRadius:'var(--r)', marginBottom:20, border:'1px solid rgba(45,43,52,0.08)', display:'flex', gap:14, alignItems:'flex-start' }}>
                    <div style={{ fontSize:'1.2rem', marginTop:2 }}>💵</div>
                    <div>
                      <div style={{ fontSize:'0.9rem', fontWeight:500, marginBottom:4 }}>Cash on delivery</div>
                      <div style={{ fontSize:'0.82rem', color:'var(--stone)', lineHeight:1.6 }}>Pay in cash when your order arrives. No payment required now.</div>
                    </div>
                  </div>

                  {/* Discount code */}
                  <div style={{ marginBottom:24 }}>
                    {!appliedDiscount ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setDiscountOpen(o => !o)}
                          style={{ fontSize:'0.78rem', color:'var(--bronze)', background:'none', border:'none', cursor:'pointer', borderBottom:'1px solid var(--bronze)', paddingBottom:1, fontFamily:'var(--font-body)' }}>
                          {discountOpen ? 'Hide' : 'Have a discount code?'}
                        </button>
                        {discountOpen && (
                          <div style={{ marginTop:12, display:'flex', gap:8 }}>
                            <input
                              type="text"
                              value={discountInput}
                              onChange={e => setDiscountInput(e.target.value.toUpperCase())}
                              placeholder="WELCOME-XXXXXX"
                              className="form-input"
                              style={{ flex:1, textTransform:'uppercase', letterSpacing:'0.05em' }}
                              onKeyDown={e => e.key === 'Enter' && handleApplyDiscount()}
                            />
                            <button
                              type="button"
                              onClick={handleApplyDiscount}
                              disabled={discountLoading}
                              className="btn btn-outline"
                              style={{ whiteSpace:'nowrap' }}>
                              {discountLoading ? '...' : 'Apply'}
                            </button>
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

                  {serverError && (
                    <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'var(--r)', padding:'14px 18px', marginBottom:20, fontSize:'0.88rem', color:'#991B1B' }}>{serverError}</div>
                  )}

                  <button className="btn btn-bronze btn-lg" style={{ width:'100%' }} onClick={handlePlaceOrder} disabled={loading}>
                    {loading ? 'Placing order...' : 'Place order'}
                  </button>
                  <p style={{ fontSize:'0.75rem', color:'var(--stone)', textAlign:'center', marginTop:14, lineHeight:1.7 }}>
                    By placing your order you agree to our terms. Production starts once your order is received.
                  </p>
                </div>
              )}
            </div>

            {/* Right — order summary */}
            <div style={{ position:'sticky', top:'calc(var(--nav-h) + 24px)' }}>
              <div style={{ background:'var(--charcoal)', color:'var(--cream)', padding:36, borderRadius:'var(--r)' }}>
                <div style={{ fontFamily:'var(--font-display)', fontSize:'1.3rem', fontWeight:300, marginBottom:24 }}>Your order</div>
                {cart.map(item => (
                  <div key={item.key} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', paddingBottom:14, marginBottom:14, borderBottom:'1px solid rgba(232,228,216,0.1)' }}>
                    <div>
                      <div style={{ fontSize:'0.85rem', lineHeight:1.3 }}>{item.name}</div>
                      {item.variantName && <div style={{ fontSize:'0.72rem', color:'rgba(232,228,216,0.5)', marginTop:2 }}>{item.variantName}</div>}
                      <div style={{ fontSize:'0.72rem', color:'rgba(232,228,216,0.5)', marginTop:2 }}>Qty: {item.qty}</div>
                    </div>
                    <div style={{ fontSize:'0.85rem', fontWeight:500, color:'var(--amber)', flexShrink:0, marginLeft:16 }}>EGP {(item.price*item.qty).toLocaleString()}</div>
                  </div>
                ))}
                {[
                  ['Subtotal',  `EGP ${cartTotal.toLocaleString()}`],
                  ...(appliedDiscount ? [[`Discount (${appliedDiscount.percent_off}%)`, `− EGP ${discountAmount.toLocaleString()}`]] : []),
                  ['Shipping',  shipping === 0 ? 'Free' : `EGP ${shipping}`],
                ].map(([l, v], i) => (
                  <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:'0.85rem', padding:'8px 0', borderBottom:'1px solid rgba(232,228,216,0.1)', color: l.startsWith('Discount') ? '#86EFAC' : 'rgba(232,228,216,0.7)' }}>
                    <span>{l}</span><span>{v}</span>
                  </div>
                ))}
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'1rem', fontWeight:500, padding:'14px 0', color:'var(--cream)' }}>
                  <span>Total</span><span>EGP {total.toLocaleString()}</span>
                </div>
                <div style={{ marginTop:8, padding:14, background:'rgba(232,228,216,0.06)', borderRadius:'var(--r)', fontSize:'0.75rem', color:'rgba(232,228,216,0.55)', lineHeight:1.7 }}>
                  ✦ Made to order · Ships in 5-7 days · Cash on delivery
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
      <Footer />
    </>
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