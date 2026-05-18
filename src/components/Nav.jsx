import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useCart } from '@/context/CartContext'
import { useNavScroll } from '@/hooks/useNavScroll'
import CartDrawer from './CartDrawer'
const NAV_LINKS = [{ label:'Home', to:'/' },{ label:'Shop', to:'/shop' },{ label:'Gifting', to:'/gifting' },{ label:'About', to:'/about' },{ label:'Contact', to:'/contact' }]
export default function Nav({ dark = false }) {
  const { cartCount, drawerOpen, setDrawerOpen } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const scrolled = useNavScroll()
  const { pathname } = useLocation()
  const textColor = dark && !scrolled ? 'var(--cream)' : 'var(--charcoal)'
  const navClass = ['nav', dark ? 'nav-dark' : '', scrolled ? 'nav-scrolled' : ''].filter(Boolean).join(' ')
  return (
    <>
      <nav className={navClass} id="nav">
        <div className="nav__inner">
          <Link to="/" className="nav__logo" style={{ color:textColor }}>Cavero</Link>
          <div className="nav__links">
            {NAV_LINKS.map(({ label, to }) => (
              <Link key={to} to={to} className={`nav__link${pathname === to ? ' active' : ''}`} style={{ color:textColor }}>{label}</Link>
            ))}
          </div>
          <div className="nav__actions">
            <button className="nav__icon" style={{ color:textColor }} onClick={() => setDrawerOpen(true)} aria-label="Open cart">
              <svg className="icon" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
              {cartCount > 0 && <span className="nav__cart-count">{cartCount}</span>}
            </button>
            <button className="nav__hamburger" style={{ color:textColor }} onClick={() => setMenuOpen(true)} aria-label="Open menu">
              <span/><span/><span/>
            </button>
          </div>
        </div>
      </nav>
      {menuOpen && (
        <>
          <div className="overlay" style={{ zIndex:999 }} onClick={() => setMenuOpen(false)}/>
          <div className="mobile-menu" style={{ animation:'menuIn 0.5s var(--ease-out) both' }}>
            <span className="mobile-menu__close" onClick={() => setMenuOpen(false)}>\u00d7</span>
            {NAV_LINKS.map(({ label, to }) => <Link key={to} to={to} className="mobile-menu__link" onClick={() => setMenuOpen(false)}>{label}</Link>)}
            <div style={{ marginTop:48 }}><Link to="/contact" className="btn btn-outline-cream btn-sm" onClick={() => setMenuOpen(false)}>Custom Order</Link></div>
          </div>
        </>
      )}
      {drawerOpen && <CartDrawer/>}
    </>
  )
}
