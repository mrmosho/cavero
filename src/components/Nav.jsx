import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useCart } from '@/context/CartContext'
import { useNavScroll } from '@/hooks/useNavScroll'
import CartDrawer from './CartDrawer'

const NAV_LINKS = [
  { label:'Home',    to:'/' },
  { label:'Shop',    to:'/shop' },
  { label:'Gifting', to:'/gifting' },
  { label:'About',   to:'/about' },
  { label:'Contact', to:'/contact' },
]

export default function Nav({ dark = false }) {
  const { cartCount, drawerOpen, setDrawerOpen } = useCart()
  const [menuOpen,   setMenuOpen]   = useState(false)
  const [cartFlash,  setCartFlash]  = useState(false)
  const prevCount = useRef(cartCount)

  useEffect(() => {
    if (cartCount > prevCount.current) {
      setCartFlash(true)
      setTimeout(() => setCartFlash(false), 500)
    }
    prevCount.current = cartCount
  }, [cartCount])
  const scrolled   = useNavScroll()
  const { pathname } = useLocation()

  // On the homepage:
  //   - not scrolled → transparent over dark hero, cream text
  //   - scrolled     → cream background, charcoal text
  // On all other pages:
  //   - always cream background, charcoal text
  const isHero     = dark && !scrolled
  const textColor  = isHero ? 'var(--cream)' : 'var(--charcoal)'
  const navBg      = isHero
    ? 'transparent'
    : 'rgba(232,228,216,0.96)'
  const navShadow  = scrolled || !dark
    ? '0 1px 0 rgba(45,43,52,0.08)'
    : 'none'
  const navBlur    = scrolled || !dark ? 'blur(12px)' : 'none'

  return (
    <>
      <nav
        id="nav"
        style={{
          position:       'fixed',
          top:            0,
          left:           0,
          right:          0,
          zIndex:         900,
          height:         'var(--nav-h)',
          display:        'flex',
          alignItems:     'center',
          background:     navBg,
          backdropFilter: navBlur,
          boxShadow:      navShadow,
          transition:     'background 0.4s var(--ease-out), box-shadow 0.4s, backdrop-filter 0.4s',
        }}
      >
        <div className="nav__inner">
          <Link to="/" className="nav__logo" style={{ color: textColor }}>Cavero</Link>

          <div className="nav__links">
            {NAV_LINKS.map(({ label, to }) => (
              <Link
                key={to}
                to={to}
                className={`nav__link${pathname === to ? ' active' : ''}`}
                style={{ color: textColor }}
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="nav__actions">
            <button className={`nav__icon${cartFlash ? ' cart-icon-flash' : ''}`} style={{ color: textColor }} onClick={() => setDrawerOpen(true)} aria-label="Open cart">
              <svg className="icon" viewBox="0 0 24 24">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              {cartCount > 0 && <span className={`nav__cart-count${cartFlash ? ' cart-count-pop' : ''}`}>{cartCount}</span>}
            </button>
            <button className="nav__hamburger" style={{ color: textColor }} onClick={() => setMenuOpen(true)} aria-label="Open menu">
              <span/><span/><span/>
            </button>
          </div>
        </div>
      </nav>

      {menuOpen && (
        <>
          <div className="overlay" style={{ zIndex:999 }} onClick={() => setMenuOpen(false)}/>
          <div className="mobile-menu" style={{ animation:'menuIn 0.5s var(--ease-out) both' }}>
            <span className="mobile-menu__close" onClick={() => setMenuOpen(false)}>×</span>
            {NAV_LINKS.map(({ label, to }) => (
              <Link key={to} to={to} className="mobile-menu__link" onClick={() => setMenuOpen(false)}>{label}</Link>
            ))}
            <div style={{ marginTop:48 }}>
              <Link to="/contact" className="btn btn-outline-cream btn-sm" onClick={() => setMenuOpen(false)}>Custom Order</Link>
            </div>
          </div>
        </>
      )}

      {drawerOpen && <CartDrawer/>}
    </>
  )
}