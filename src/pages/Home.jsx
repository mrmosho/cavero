import { Link } from 'react-router-dom'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { useProducts } from '@/hooks/useProducts'
import { REVIEWS } from '@/lib/products'
import ProductCard from '@/components/ProductCard'
import Marquee from '@/components/Marquee'
import Newsletter from '@/components/Newsletter'
import Footer from '@/components/Footer'
import Toast from '@/components/Toast'
import WelcomePopup from '@/components/WelcomePopup'

export default function Home() {
  const { products, loading } = useProducts()
  const featured = products.slice(0, 6)
  useScrollReveal([loading])

  return (
    <>
      <Toast />
      <WelcomePopup />

      {/* ── HERO ── */}
      <section className="hero">
        <div style={{ position:'absolute', inset:0 }}>
          <svg viewBox="0 0 1440 900" style={{ width:'100%', height:'100%' }} preserveAspectRatio="xMidYMid slice">
            <defs>
              <radialGradient id="hg1" cx="30%" cy="40%" r="60%"><stop offset="0%" stopColor="#3D3844"/><stop offset="100%" stopColor="#1E1C22"/></radialGradient>
              <radialGradient id="hg2" cx="75%" cy="65%" r="45%"><stop offset="0%" stopColor="#4A4452" stopOpacity={0.8}/><stop offset="100%" stopColor="#1E1C22" stopOpacity={0}/></radialGradient>
            </defs>
            <rect width="1440" height="900" fill="url(#hg1)"/>
            <rect width="1440" height="900" fill="url(#hg2)"/>
            <circle cx="200" cy="200" r="300" fill="none" stroke="rgba(168,149,111,0.08)" strokeWidth="1"/>
            <circle cx="200" cy="200" r="480" fill="none" stroke="rgba(168,149,111,0.05)" strokeWidth="1"/>
            <circle cx="1240" cy="700" r="280" fill="none" stroke="rgba(168,149,111,0.07)" strokeWidth="1"/>
            <g transform="translate(880,80)" opacity="0.07">
              <path d="M60 0 Q80 120 90 240 Q110 360 80 480 Q50 520 40 560 L120 560 Q110 520 80 480 Q110 360 130 240 Q140 120 160 0 Z" fill="rgba(232,228,216,1)"/>
              <ellipse cx="110" cy="0" rx="60" ry="18" fill="rgba(232,228,216,1)"/>
            </g>
            <polygon points="1440,0 1440,200 1240,0" fill="rgba(168,149,111,0.06)"/>
            <rect x="0" y="600" width="1440" height="300" fill="rgba(29,28,34,0.5)"/>
          </svg>
        </div>
        <div className="hero__content">
          <p className="t-label" style={{ color:'rgba(168,149,111,0.9)', marginBottom:24, animation:'fadeIn .8s ease both' }}>Cairo, Egypt · Est. 2025</p>
          <h1 className="t-hero" style={{ color:'var(--cream)', marginBottom:24, animation:'fadeSlideUp .9s .1s var(--ease-out) both' }}>Objects<br /><em>that belong.</em></h1>
          <p className="hero__sub" style={{ animation:'fadeSlideUp .9s .2s var(--ease-out) both' }}>Precision-crafted home objects. Made to order — designed for your space, finished by hand, built to last.</p>
          <div className="hero__cta" style={{ animation:'fadeSlideUp .9s .3s var(--ease-out) both' }}>
            <Link to="/shop" className="btn btn-bronze btn-lg">Shop the collection</Link>
            <Link to="/contact" className="btn btn-outline-cream">Custom order</Link>
          </div>
        </div>
        <div className="hero__scroll"><span>Scroll</span><div className="hero__scroll-line"/></div>
      </section>

      <Marquee />

      {/* ── FEATURED PRODUCTS ── */}
      <section className="section" style={{ background:'var(--cream)' }}>
        <div className="container">
          <div className="section-header reveal">
            <div>
              <p className="t-label section-header__eyebrow">The collection</p>
              <h2 className="t-h1">Made for your space.</h2>
            </div>
            <Link to="/shop" className="section-header__link">View all objects</Link>
          </div>
          {loading ? (
            <div style={{ textAlign:'center', padding:'60px 0', color:'var(--stone)' }}>Loading collection...</div>
          ) : (
            <>
              <div className="grid-3" style={{ gap:'40px 28px' }}>
                {featured.map((p, i) => <ProductCard key={p.slug || p.id} product={p} delayClass={`d${(i % 3) + 1}`} />)}
              </div>
              <div className="text-center mt-64 reveal">
                <Link to="/shop" className="btn btn-outline btn-lg">View all {products.length} objects</Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── STATEMENT ── */}
      <section className="statement">
        <div className="container">
          <div className="statement__inner reveal">
            <p className="t-label" style={{ color:'var(--stone)', marginBottom:32 }}>Our belief</p>
            <p className="statement__text">Most home objects are made for <em>nobody</em> in particular. Cavero pieces are made to order — designed for your space, finished by hand, and built to belong exactly where you put them.</p>
            <div style={{ width:40, height:1, background:'var(--bronze)', margin:'32px auto' }}/>
            <Link to="/about" className="btn btn-outline-cream">About our studio</Link>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <div className="stats-bar">
        <div className="container">
          <div className="stats-inner">
            {[['500+','Orders made'],['5-7','Days to your door'],['20+','Unique pieces'],['4.9★','Average rating']].map(([num,label]) => (
              <div className="stat-item reveal" key={label}><div className="stat-num">{num}</div><div className="stat-label">{label}</div></div>
            ))}
          </div>
        </div>
      </div>

      {/* ── GIFT COLLECTIONS ── */}
      <section className="section" style={{ background:'var(--cream)' }}>
        <div className="container">
          <div className="section-header section-header--center reveal" style={{ marginBottom:48 }}>
            <p className="t-label">Curated for gifting</p>
            <h2 className="t-h1">Made to be given.</h2>
            <p className="t-body" style={{ maxWidth:480, margin:'16px auto 0' }}>Every Cavero piece arrives gift-ready. For anniversaries, new homes, and the moments that matter.</p>
          </div>
          <div className="grid-2 reveal d1" style={{ gap:16 }}>
            <Link to="/gifting" className="gift-card">
              <div className="gift-card__placeholder" style={{ background:'linear-gradient(135deg,#3D3844,#2A2830)' }}>
                <svg viewBox="0 0 80 100" width="60" height="75" fill="none" stroke="rgba(168,149,111,0.5)" strokeWidth="1.5">
                  <circle cx="28" cy="18" r="12"/><circle cx="52" cy="22" r="10"/>
                  <path d="M10 100 Q18 65 28 50 Q36 65 48 100"/><path d="M32 100 Q44 65 52 50 Q62 65 70 100"/>
                </svg>
              </div>
              <div className="gift-card__overlay"/>
              <div className="gift-card__content"><p className="gift-card__title">For couples</p><p className="gift-card__sub">Custom statues · Personalised pieces</p><span className="gift-card__link">Explore →</span></div>
            </Link>
            <div style={{ display:'grid', gridTemplateRows:'1fr 1fr', gap:16 }}>
              {[['For the home','Vases · Planters · Wall art','linear-gradient(135deg,#4A4452,#3D3844)'],
                ['For the desk','Stands · Holders · Trays','linear-gradient(135deg,#2D2B34,#3D3844)']].map(([title,sub,bg]) => (
                <Link key={title} to="/gifting" className="gift-card">
                  <div className="gift-card__placeholder" style={{ background:bg }}>
                    <svg viewBox="0 0 80 80" width="50" height="50" fill="none" stroke="rgba(168,149,111,0.5)" strokeWidth="1.5">
                      <path d="M20 10 Q40 5 60 10 Q70 55 60 70 Q50 78 40 78 Q30 78 20 70 Q10 55 20 10Z"/>
                    </svg>
                  </div>
                  <div className="gift-card__overlay"/>
                  <div className="gift-card__content"><p className="gift-card__title">{title}</p><p className="gift-card__sub">{sub}</p><span className="gift-card__link">Explore →</span></div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PROCESS ── */}
      <section className="process">
        <div className="container">
          <div className="section-header section-header--center reveal" style={{ marginBottom:56 }}>
            <p className="t-label">How it works</p>
            <h2 className="t-h1">Nothing exists<br />until you order it.</h2>
          </div>
          <div className="process__steps reveal d1">
            {[['01','You choose','Browse the collection. Pick your piece, colour, and any personalisation details.'],
              ['02','We craft','Your piece enters production in our Cairo studio. Designed, shaped, and finished by hand.'],
              ['03','We pack','Wrapped in cream tissue, sealed with a Cavero card. Packed like it matters — because it does.'],
              ['04',"It's yours",'Delivered to your door in 5-7 days. Made specifically for you. No two pieces exactly alike.']
            ].map(([num,title,desc]) => (
              <div className="process__step" key={num}><div className="process__num">{num}</div><h3 className="process__title">{title}</h3><p className="process__desc">{desc}</p></div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REVIEWS ── */}
      <section className="section" style={{ background:'var(--cream)' }}>
        <div className="container">
          <div className="section-header reveal">
            <div><p className="t-label section-header__eyebrow">What people say</p><h2 className="t-h2">Real orders. Real reactions.</h2></div>
          </div>
          <div className="grid-3 reveal d1">
            {REVIEWS.map((r, i) => (
              <div className="review-card" key={i}>
                <div className="review-stars">{'★'.repeat(r.stars)}</div>
                <p className="review-text">{r.text}</p>
                <p className="review-author">{r.author} · <span className="review-product">{r.product}</span></p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INSTAGRAM ── */}
      <section style={{ background:'var(--light)', padding:'60px 0' }}>
        <div className="container">
          <div className="text-center mb-32 reveal">
            <p className="t-label" style={{ marginBottom:8 }}>Follow along</p>
            <a href="https://instagram.com/caveroegy" target="_blank" rel="noreferrer" style={{ fontFamily:'var(--font-display)', fontSize:'1.6rem', fontWeight:300, color:'var(--charcoal)' }}>@cavero.studio</a>
          </div>
          <div className="insta-grid reveal d1">
            {[['◇','var(--light)'],['○','linear-gradient(135deg,#DDD9CE,#C8C4BA)'],['△','linear-gradient(135deg,#C8C4BA,#DDD9CE)'],
              ['◇','var(--light)'],['○','linear-gradient(135deg,#DDD9CE,#C8C4BA)'],['△','linear-gradient(135deg,#C8C4BA,#DDD9CE)']].map(([sym,bg],i) => (
              <div className="insta-item" key={i}><div className="insta-item__placeholder" style={{ background:bg }}>{sym}</div><div className="insta-item__overlay">View →</div></div>
            ))}
          </div>
          <div className="text-center mt-32 reveal">
            <a href="https://instagram.com/caveroegy" target="_blank" rel="noreferrer" className="btn btn-outline btn-sm btn-pill">Follow @cavero.studio</a>
          </div>
        </div>
      </section>

      <Newsletter />
      <Footer />
    </>
  )
}