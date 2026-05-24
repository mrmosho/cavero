import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { useProducts } from '@/hooks/useProducts'
import { useCart } from '@/context/CartContext'
import { supabase } from '@/lib/supabase'
import ProductCard from '@/components/ProductCard'
import Newsletter from '@/components/Newsletter'
import Footer from '@/components/Footer'
import Toast from '@/components/Toast'

export default function Gifting() {
  const { products } = useProducts()
  const { showToast } = useCart()
  const [form, setForm] = useState({ name:'', phone:'', email:'', message:'' })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const formRef    = useRef(null)
  const messageRef = useRef(null)
  useScrollReveal([products.length])

  // All gifts category products — no limit
  const giftProducts    = products.filter(p => p.category === 'gifts')
  const specialProducts = products.filter(p => p.category === 'specials')

  const set = f => e => setForm(prev => ({ ...prev, [f]: e.target.value }))

  async function handleCustomOrder(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.from('contact_enquiries').insert({
        name:    form.name,
        phone:   form.phone || null,
        email:   form.email || null,
        subject: 'custom',
        message: form.message,
      })
      if (error) throw error
      setSent(true)
      showToast("Custom order request sent ✦ We'll be in touch soon")
    } catch {
      showToast('Something went wrong. Please reach out on WhatsApp.')
    } finally {
      setLoading(false)
    }
  }

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior:'smooth', block:'start' })
    setTimeout(() => messageRef.current?.focus(), 500)
  }

  return (
    <>
      <Toast />
      <div style={{ background:'var(--cream)' }}>

        {/* Hero */}
        <div style={{ paddingTop:'calc(var(--nav-h) + 80px)', paddingBottom:80, textAlign:'center' }}>
          <div className="container">
            <p className="t-label reveal" style={{ marginBottom:16 }}>Curated for gifting</p>
            <h1 className="t-hero reveal d1" style={{ marginBottom:24 }}>Made to be given.</h1>
            <p className="t-body reveal d2" style={{ maxWidth:520, margin:'0 auto 48px' }}>Every piece arrives gift-ready in cream tissue and a Cavero card.</p>
            <div style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap' }} className="reveal d3">
              <Link to="/shop" className="btn btn-bronze btn-lg">Shop all objects</Link>
              <button className="btn btn-outline" onClick={scrollToForm}>Custom order</button>
            </div>
          </div>
        </div>

        {/* Couples & Gifts — ALL products, no limit */}
        {giftProducts.length > 0 && (
          <section className="section" style={{ background:'var(--cream)' }}>
            <div className="container">
              <div className="section-header reveal">
                <div>
                  <p className="t-label section-header__eyebrow">Couples & Gifts</p>
                  <h2 className="t-h2">For the people you love.</h2>
                </div>
                <Link to="/shop?cat=gifts" className="section-header__link">View all</Link>
              </div>
              <div className="grid-3 reveal d1">
                {giftProducts.map((p, i) => (
                  <ProductCard key={p.slug || p.id} product={p} delayClass={`d${(i%3)+1}`} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Name Tags & Specials */}
        {specialProducts.length > 0 && (
          <section className="section" style={{ background:'var(--light)' }}>
            <div className="container">
              <div className="section-header reveal">
                <div>
                  <p className="t-label section-header__eyebrow">Name Tags & Specials</p>
                  <h2 className="t-h2">Personal touches.</h2>
                </div>
                <Link to="/shop?cat=specials" className="section-header__link">View all</Link>
              </div>
              <div className="grid-3 reveal d1">
                {specialProducts.map((p, i) => (
                  <ProductCard key={p.slug || p.id} product={p} delayClass={`d${(i%3)+1}`} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Custom Order Form */}
        <section className="section" style={{ background:'var(--charcoal)' }} ref={formRef}>
          <div className="container">
            <div style={{ maxWidth:640, margin:'0 auto' }}>
              <div className="reveal" style={{ textAlign:'center', marginBottom:48 }}>
                <p className="t-label" style={{ color:'var(--stone)', marginBottom:16 }}>Bespoke gifting</p>
                <h2 className="t-h1" style={{ color:'var(--cream)', marginBottom:16 }}>Something one-of-a-kind?</h2>
                <p style={{ fontSize:'0.95rem', color:'rgba(232,228,216,0.65)', lineHeight:1.8 }}>
                  Couple statues, corporate gifts, wedding favours — we work with you from scratch. Tell us what you have in mind.
                </p>
              </div>

              {sent ? (
                <div className="reveal" style={{ textAlign:'center', padding:'48px 32px', background:'rgba(232,228,216,0.06)', borderRadius:'var(--r)', border:'1px solid rgba(232,228,216,0.15)' }}>
                  <div style={{ fontSize:'2rem', marginBottom:16 }}>✦</div>
                  <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.5rem', fontWeight:300, color:'var(--cream)', marginBottom:12 }}>Request received</h3>
                  <p style={{ fontSize:'0.9rem', color:'rgba(232,228,216,0.65)', lineHeight:1.7, marginBottom:28 }}>
                    We will reach out within 24 hours to discuss your custom order.
                  </p>
                  <button className="btn btn-bronze" onClick={() => setSent(false)}>Send another request</button>
                </div>
              ) : (
                <form onSubmit={handleCustomOrder} className="reveal d1">
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                    <div>
                      <label style={{ display:'block', fontSize:'0.68rem', fontWeight:500, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--stone)', marginBottom:7 }}>Your name</label>
                      <input value={form.name} onChange={set('name')} placeholder="Your Name" required
                        style={{ width:'100%', padding:'13px 14px', background:'rgba(232,228,216,0.08)', border:'1px solid rgba(232,228,216,0.15)', borderRadius:'var(--r)', color:'var(--cream)', fontSize:'0.9rem', outline:'none', fontFamily:'var(--font-body)' }} />
                    </div>
                    <div>
                      <label style={{ display:'block', fontSize:'0.68rem', fontWeight:500, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--stone)', marginBottom:7 }}>Phone number</label>
                      <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+20 1XX XXX XXXX" required
                        style={{ width:'100%', padding:'13px 14px', background:'rgba(232,228,216,0.08)', border:'1px solid rgba(232,228,216,0.15)', borderRadius:'var(--r)', color:'var(--cream)', fontSize:'0.9rem', outline:'none', fontFamily:'var(--font-body)' }} />
                    </div>
                  </div>
                  <div style={{ marginBottom:16 }}>
                    <label style={{ display:'block', fontSize:'0.68rem', fontWeight:500, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--stone)', marginBottom:7 }}>
                      Email <span style={{ color:'rgba(232,228,216,0.35)', fontWeight:300, textTransform:'none', letterSpacing:0 }}>(optional — get exclusive discounts)</span>
                    </label>
                    <input type="email" value={form.email} onChange={set('email')} placeholder="hello@example.com"
                      style={{ width:'100%', padding:'13px 14px', background:'rgba(232,228,216,0.08)', border:'1px solid rgba(232,228,216,0.15)', borderRadius:'var(--r)', color:'var(--cream)', fontSize:'0.9rem', outline:'none', fontFamily:'var(--font-body)' }} />
                  </div>
                  <div style={{ marginBottom:24 }}>
                    <label style={{ display:'block', fontSize:'0.68rem', fontWeight:500, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--stone)', marginBottom:7 }}>Describe your custom order</label>
                    <textarea ref={messageRef} value={form.message} onChange={set('message')} required
                      placeholder="Tell us what you want — type of piece, occasion, names or text to include, colours, size, any references or inspiration..."
                      style={{ width:'100%', minHeight:160, padding:'13px 14px', background:'rgba(232,228,216,0.08)', border:'1px solid rgba(232,228,216,0.15)', borderRadius:'var(--r)', color:'var(--cream)', fontSize:'0.9rem', outline:'none', fontFamily:'var(--font-body)', resize:'vertical' }} />
                    <p style={{ fontSize:'0.72rem', color:'rgba(232,228,216,0.4)', marginTop:6 }}>The more detail the better — we will get back to you within 24 hours.</p>
                  </div>
                  <button type="submit" className="btn btn-bronze btn-lg btn-full" disabled={loading}>
                    {loading ? 'Sending...' : 'Send custom order request'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        <Newsletter />
        <Footer />
      </div>
    </>
  )
}