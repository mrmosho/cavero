import { Link } from 'react-router-dom'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { PRODUCTS } from '@/lib/products'
import ProductCard from '@/components/ProductCard'
import Newsletter from '@/components/Newsletter'
import Footer from '@/components/Footer'
import Toast from '@/components/Toast'

const SECTIONS = [
  { title: 'For Couples',    sub: 'Custom statues · Named pieces · Anniversary gifts', slugs: ['duo-statue'] },
  { title: 'For the Home',   sub: 'Vases · Planters · Sculptural objects',             slugs: ['lune-vase', 'wave-vase', 'ridge-planter'] },
  { title: 'For the Desk',   sub: 'Stands · Holders · Weighted objects',               slugs: ['arch-stand', 'facet-holder'] },
  { title: 'Under EGP 300',  sub: 'Beautiful things at every price point',             slugs: ['facet-holder', 'column-candle'] },
]

export default function Gifting() {
  useScrollReveal()

  return (
    <>
      <Toast />

      <div style={{ background: 'var(--cream)' }}>
        {/* Hero */}
        <div style={{ paddingTop: 'calc(var(--nav-h) + 80px)', paddingBottom: 80, textAlign: 'center' }}>
          <div className="container">
            <p className="t-label reveal" style={{ marginBottom: 16 }}>Curated for gifting</p>
            <h1 className="t-hero reveal d1" style={{ marginBottom: 24 }}>Made to be given.</h1>
            <p className="t-body reveal d2" style={{ maxWidth: 520, margin: '0 auto 48px' }}>
              Every piece arrives gift-ready in cream tissue and a Cavero card. For anniversaries,
              new homes, and the moments that matter.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }} className="reveal d3">
              <Link to="/shop"    className="btn btn-bronze btn-lg">Shop all objects</Link>
              <Link to="/contact" className="btn btn-outline">Custom order</Link>
            </div>
          </div>
        </div>

        {/* Sections */}
        {SECTIONS.map((section, si) => {
          const products = PRODUCTS.filter(p => section.slugs.includes(p.slug))
          return (
            <section key={section.title} className="section" style={{ background: si % 2 === 0 ? 'var(--cream)' : 'var(--light)' }}>
              <div className="container">
                <div className="section-header reveal">
                  <div>
                    <h2 className="t-h2">{section.title}</h2>
                    <p className="t-label" style={{ marginTop: 8 }}>{section.sub}</p>
                  </div>
                  <Link to="/shop" className="section-header__link">View all</Link>
                </div>
                <div className="grid-3 reveal d1">
                  {products.map((p, i) => (
                    <ProductCard key={p.slug} product={p} delayClass={`d${i + 1}`} />
                  ))}
                </div>
              </div>
            </section>
          )
        })}

        {/* Custom gifting CTA */}
        <section className="statement">
          <div className="container">
            <div className="statement__inner reveal">
              <p className="t-label" style={{ color: 'var(--stone)', marginBottom: 24 }}>Bespoke gifting</p>
              <p className="statement__text">
                For corporate gifting, wedding favours, or a gift so personal it can only exist for
                <em> one person</em> — we take custom orders with full creative collaboration.
              </p>
              <div style={{ width: 40, height: 1, background: 'var(--bronze)', margin: '32px auto' }} />
              <Link to="/contact" className="btn btn-outline-cream btn-lg">Enquire about custom</Link>
            </div>
          </div>
        </section>

        <Newsletter />
        <Footer />
      </div>
    </>
  )
}
