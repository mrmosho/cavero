import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '@/context/CartContext'
import { createOrder } from '@/hooks/useOrders'
import { calculateShipping } from '@/lib/shipping'
import { PAYMENT_METHODS, GOVERNORATES } from '@/lib/constants'
import ProductIllustration from '@/components/illustrations/ProductIllustration'
import Footer from '@/components/Footer'
import Toast from '@/components/Toast'

const STEPS = ['Delivery', 'Review & Pay']
const EMPTY = { fullName:'', email:'', phone:'', line1:'', line2:'', city:'', governorate:'Cairo', postalCode:'', orderNotes:'', paymentMethod:'manual' }

export default function Checkout() {
  const { cart, cartTotal, clearCart } = useCart()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState(null)
  const shipping = calculateShipping(cartTotal)
  const total = cartTotal + shipping
  const set = f => e => setForm(prev => ({ ...prev, [f]: e.target.value }))

  function validateStep0() {
    const e = {}
    if (!form.fullName.trim()) e.fullName = 'Full name is required'
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email is required'
    if (!form.phone.trim()) e.phone = 'Phone number is required'
    if (!form.line1.trim()) e.line1 = 'Address is required'
    if (!form.city.trim()) e.city = 'City is required'
    return e
  }

  function nextStep() {
    const e = validateStep0()
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({})
    setStep(1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handlePlaceOrder() {
    if (!cart.length) return
    setLoading(true)
    setServerError(null)
    const shippingAddress = { name:form.fullName, phone:form.phone, line1:form.line1, line2:form.line2||null, city:form.city, governorate:form.governorate, postal_code:form.postalCode||null }
    const { orderId, error } = await createOrder({ cart, customer:{ name:form.fullName, email:form.email, phone:form.phone }, shippingAddress, shipping, total, paymentMethod:form.paymentMethod, notes:form.orderNotes||null })
    setLoading(false)
    if (error) { setServerError('Something went wrong placing your order. Please try again.'); return }
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
            <div>
              {step === 0 && (
                <div>
                  <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.8rem', fontWeight:300, marginBottom:32 }}>Delivery details</h2>
                  <fieldset style={{ border:'none', marginBottom:32 }}>
                    <legend style={{ fontSize:'0.7rem', fontWeight:500, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--stone)', marginBottom:20 }}>Contact</legend>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                      <Field label="Full name" error={errors.fullName}><input className="form-input" type="text" value={form.fullName} onChange={set('fullName')} placeholder="Mariam Hassan" /></Field>
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
                    <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.8rem', fontWeight:300 }}>Review & place order</h2>
                    <button style={{ fontSize:'0.72rem', letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--bronze)', borderBottom:'1px solid var(--bronze)', cursor:'pointer', background:'none', border:'none', borderBottom:'1px solid var(--bronze)', paddingBottom:2 }} onClick={() => setStep(0)}>Edit details</button>
                  </div>
                  <div style={{ background:'var(--white)', padding:24, borderRadius:'var(--r)', marginBottom:24, border:'1px solid rgba(45,43,52,0.08)' }}>
                    <p style={{ fontSize:'0.7rem', fontWeight:500, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--stone)', marginBottom:14 }}>Delivering to</p>
                    <p style={{ fontWeight:500, marginBottom:4 }}>{form.fullName}</p>
                    <p style={{ fontSize:'0.88rem', color:'var(--stone)', lineHeight:1.7 }}>
                      {form.line1}{form.line2 ? `, ${form.line2}` : ''}<br />
                      {form.city}, {form.governorate}<br />
                      {form.phone} · {form.email}
                    </p>
                  </div>
                  <div style={{ marginBottom:32 }}>
                    <p style={{ fontSize:'0.7rem', fontWeight:500, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--stone)', marginBottom:14 }}>Payment method</p>
                    {PAYMENT_METHODS.map(pm => (
                      <label key={pm.id} style={{ display:'flex', alignItems:'flex-start', gap:14, padding:'18px 20px', border:`1px solid ${form.paymentMethod===pm.id?'var(--bronze)':'rgba(45,43,52,0.15)'}`, borderRadius:'var(--r)', cursor:'pointer', background:form.paymentMethod===pm.id?'rgba(168,149,111,0.05)':'var(--white)', marginBottom:10 }}>
                        <input type="radio" name="paymentMethod" value={pm.id} checked={form.paymentMethod===pm.id} onChange={set('paymentMethod')} style={{ marginTop:2, accentColor:'var(--bronze)' }} />
                        <div><div style={{ fontSize:'0.9rem', fontWeight:500, marginBottom:4 }}>{pm.label}</div><div style={{ fontSize:'0.8rem', color:'var(--stone)', lineHeight:1.5 }}>{pm.description}</div></div>
                      </label>
                    ))}
                  </div>
                  {serverError && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'var(--r)', padding:'14px 18px', marginBottom:20, fontSize:'0.88rem', color:'#991B1B' }}>{serverError}</div>}
                  <button className="btn btn-bronze btn-lg" style={{ width:'100%' }} onClick={handlePlaceOrder} disabled={loading}>{loading ? 'Placing order...' : 'Place order'}</button>
                  <p style={{ fontSize:'0.75rem', color:'var(--stone)', textAlign:'center', marginTop:14, lineHeight:1.7 }}>By placing your order you agree to our terms. We will contact you to confirm payment and production start.</p>
                </div>
              )}
            </div>
            <div style={{ position:'sticky', top:'calc(var(--nav-h) + 24px)' }}>
              <div style={{ background:'var(--charcoal)', color:'var(--cream)', padding:36, borderRadius:'var(--r)' }}>
                <div style={{ fontFamily:'var(--font-display)', fontSize:'1.3rem', fontWeight:300, marginBottom:24 }}>Your order</div>
                {cart.map(item => (
                  <div key={item.key} style={{ display:'grid', gridTemplateColumns:'48px 1fr auto', gap:12, alignItems:'center', paddingBottom:14, marginBottom:14, borderBottom:'1px solid rgba(232,228,216,0.1)' }}>
                    <div style={{ aspectRatio:'1', background:'rgba(232,228,216,0.08)', borderRadius:'var(--r)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <ProductIllustration slug={item.slug} style={{ width:32, height:32 }} />
                    </div>
                    <div>
                      <div style={{ fontSize:'0.82rem', lineHeight:1.3 }}>{item.name}</div>
                      {item.variantName && <div style={{ fontSize:'0.72rem', color:'rgba(232,228,216,0.5)', marginTop:2 }}>{item.variantName}</div>}
                      <div style={{ fontSize:'0.72rem', color:'rgba(232,228,216,0.5)', marginTop:2 }}>Qty: {item.qty}</div>
                    </div>
                    <div style={{ fontSize:'0.82rem', fontWeight:500, color:'var(--amber)' }}>EGP {(item.price*item.qty).toLocaleString()}</div>
                  </div>
                ))}
                {[['Subtotal',`EGP ${cartTotal.toLocaleString()}`],['Shipping',shipping===0?'Free':`EGP ${shipping}`]].map(([l,v]) => (
                  <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:'0.85rem', padding:'8px 0', borderBottom:'1px solid rgba(232,228,216,0.1)', color:'rgba(232,228,216,0.7)' }}><span>{l}</span><span>{v}</span></div>
                ))}
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'1rem', fontWeight:500, padding:'14px 0', color:'var(--cream)' }}><span>Total</span><span>EGP {total.toLocaleString()}</span></div>
                <div style={{ marginTop:16, padding:14, background:'rgba(232,228,216,0.06)', borderRadius:'var(--r)', fontSize:'0.75rem', color:'rgba(232,228,216,0.55)', lineHeight:1.7 }}>
                  ✦ Made to order · Production starts after order confirmation · Ships in 5-7 days via Bosta
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
