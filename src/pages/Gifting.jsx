import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { useProducts } from '@/hooks/useProducts'
import ProductCard from '@/components/ProductCard'
import CustomOrderForm from '@/components/CustomOrderForm'
import Newsletter from '@/components/Newsletter'
import Footer from '@/components/Footer'
import Toast from '@/components/Toast'

export default function Gifting() {
  const { products } = useProducts()
  const [sent, setSent] = useState(false)
  const formRef = useRef(null)
  useScrollReveal([products.length])

  const giftProducts    = products.filter(p => p.category === 'gifts')
  const specialProducts = products.filter(p => p.category === 'specials')

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior:'smooth', block:'start' })
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

        {/* Couples & Gifts */}
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
                  <ProductCard key={p.slug||p.id} product={p} delayClass={`d${(i%3)+1}`} />
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
                  <ProductCard key={p.slug||p.id} product={p} delayClass={`d${(i%3)+1}`} />
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
                    Your custom order has been logged. We will reach out within 24 hours with a price quote.
                  </p>
                  <button className="btn btn-bronze" onClick={() => setSent(false)}>Send another request</button>
                </div>
              ) : (
                <div className="reveal d1">
                  <CustomOrderForm dark={true} onSuccess={() => setSent(true)} />
                </div>
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