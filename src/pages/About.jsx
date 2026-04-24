import { Link } from 'react-router-dom'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import Newsletter from '@/components/Newsletter'
import Footer from '@/components/Footer'

export default function About() {
  useScrollReveal()

  return (
    <>
      <div style={{ background: 'var(--cream)' }}>
        {/* Hero */}
        <div style={{ paddingTop: 'calc(var(--nav-h) + 80px)', paddingBottom: 60 }}>
          <div className="container">
            <p className="t-label reveal" style={{ marginBottom: 16 }}>Our story</p>
            <h1 className="t-hero reveal d1">
              Objects with<br /><em>intention.</em>
            </h1>
          </div>
        </div>

        {/* Split */}
        <div className="container">
          <div className="about-split reveal">
            <div>
              <p className="t-label" style={{ marginBottom: 20 }}>Why Cavero exists</p>
              <h2 className="t-h2" style={{ marginBottom: 24 }}>Tired of objects made for nobody.</h2>
              <p className="t-body" style={{ marginBottom: 20 }}>
                Cavero started in a studio apartment in Zamalek in 2025, with a simple frustration:
                every home object worth buying was either imported, unaffordable, or made in a factory
                somewhere far away for no one in particular.
              </p>
              <p className="t-body" style={{ marginBottom: 20 }}>
                We believe the objects that surround you shape how you feel in a space. So we set out
                to make things that are worth keeping — designed with intention, made by hand, built to belong.
              </p>
              <p className="t-body" style={{ marginBottom: 36 }}>
                Everything is made to order. Nothing exists until you want it to.
              </p>
              <Link to="/shop" className="btn btn-outline">See the collection</Link>
            </div>
            <div className="about-split__img">
              <svg viewBox="0 0 200 250" width="160" fill="none" stroke="rgba(168,149,111,0.3)" strokeWidth="1">
                <path d="M70 30 Q100 20 130 30 Q150 160 140 200 Q120 230 100 230 Q80 230 60 200 Q50 160 70 30Z"/>
                <ellipse cx="100" cy="30" rx="35" ry="12"/>
                <line x1="100" y1="80" x2="100" y2="200" strokeOpacity="0.3"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Values */}
        <section className="section" style={{ background: 'var(--light)' }}>
          <div className="container">
            <div className="section-header section-header--center reveal" style={{ marginBottom: 56 }}>
              <p className="t-label">What we stand for</p>
              <h2 className="t-h1">Three things we never compromise on.</h2>
            </div>
            <div className="about-values reveal d1">
              {[
                { icon: '◇', title: 'Made to order only',   body: 'We don\'t manufacture stock. Every piece is made after you place your order. Zero waste, genuine care — each object made for a specific person.' },
                { icon: '○', title: 'Finished by hand',     body: 'No two Cavero pieces are exactly alike. Minor variations in texture and finish are the honest mark of the hand that made it — a feature, not a flaw.' },
                { icon: '△', title: 'Designed in Cairo',    body: 'We are a Cairo studio. Our aesthetic is shaped by the city\'s geometry, its dust, its light. Globally-minded, locally-made, always.' },
              ].map(v => (
                <div className="value-card" key={v.title}>
                  <div className="value-card__icon" style={{ color: 'var(--bronze)' }}>{v.icon}</div>
                  <h3 className="value-card__title">{v.title}</h3>
                  <p className="t-body">{v.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <div className="stats-bar">
          <div className="container">
            <div className="stats-inner">
              {[['2025', 'Founded'], ['Cairo', 'Studio'], ['500+', 'Orders'], ['Hand', 'Finished']].map(([num, label]) => (
                <div className="stat-item" key={label}>
                  <div className="stat-num">{num}</div>
                  <div className="stat-label">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Newsletter />
        <Footer />
      </div>
    </>
  )
}
