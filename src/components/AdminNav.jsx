import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAdmin } from '@/context/AdminContext'

// Primary links — always visible in desktop nav
const PRIMARY = [
  { to: '/admin',                label: 'Dashboard',  icon: '◈' },
  { to: '/admin/orders',         label: 'Orders',     icon: '📦' },
  { to: '/admin/products',       label: 'Products',   icon: '◇' },
  { to: '/admin/finance',        label: 'Finance',    icon: '₤' },
  { to: '/admin/contacts',       label: 'Messages',   icon: '✉' },
]

// Secondary links — in "More" dropdown on desktop, same drawer on mobile
const SECONDARY = [
  { to: '/admin/categories',     label: 'Categories', icon: '◉' },
  { to: '/admin/discount-codes', label: 'Discounts',  icon: '🏷' },
  { to: '/admin/blocklist',      label: 'Block List', icon: '⊘' },
]

const OWNER_EMAIL = 'omarhusam1711@gmail.com'

export default function AdminNav() {
  const { logout, user }         = useAdmin()
  const { pathname }             = useLocation()
  const [menuOpen,  setMenuOpen] = useState(false)
  const [moreOpen,  setMoreOpen] = useState(false)
  const moreRef                  = useRef(null)

  const secondaryLinks = [...SECONDARY, ...(user?.email === OWNER_EMAIL ? [{ to:'/admin/changelog', label:'Changelog', icon:'📋' }] : [])]
  const allLinks       = [...PRIMARY, ...secondaryLinks]
  const currentPage    = allLinks.find(l => l.to === pathname)?.label || 'Admin'
  const inMore         = secondaryLinks.some(l => l.to === pathname)

  // Close More dropdown when clicking outside
  useEffect(() => {
    function handle(e) { if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false) }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const linkStyle = (active) => ({
    fontSize: '0.7rem', fontWeight: 400, letterSpacing: '0.08em', textTransform: 'uppercase',
    padding: '6px 12px', borderRadius: 'var(--r)', textDecoration: 'none', whiteSpace: 'nowrap', transition: 'all 0.15s',
    color:      active ? 'var(--cream)'              : 'var(--stone)',
    background: active ? 'rgba(232,228,216,0.1)'     : 'transparent',
  })

  return (
    <>
      <nav style={{ background:'var(--dark)', borderBottom:'1px solid rgba(232,228,216,0.08)', padding:'0 24px', display:'flex', alignItems:'center', justifyContent:'space-between', height:52, position:'sticky', top:0, zIndex:100 }}>

        {/* Left — logo + links */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <img src="/logo_reverse.png" alt="Cavero" style={{ height:22, width:'auto', marginRight:8, display:'block' }} />
          <span style={{ fontSize:'0.6rem', letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--stone)', borderLeft:'1px solid rgba(232,228,216,0.15)', paddingLeft:12, marginRight:8 }}>Admin</span>

          {/* Primary links — desktop */}
          <div className="admin-desktop-links" style={{ display:'flex', gap:2 }}>
            {PRIMARY.map(l => (
              <Link key={l.to} to={l.to} style={linkStyle(pathname === l.to)}>{l.label}</Link>
            ))}

            {/* More dropdown */}
            <div ref={moreRef} style={{ position:'relative' }}>
              <button
                onClick={() => setMoreOpen(o => !o)}
                style={{ ...linkStyle(inMore || moreOpen), border:'none', cursor:'pointer', fontFamily:'var(--font-body)', display:'flex', alignItems:'center', gap:5 }}>
                More
                <span style={{ fontSize:'0.6rem', opacity:0.6, transform: moreOpen ? 'rotate(180deg)' : 'none', transition:'transform .2s', display:'inline-block' }}>▼</span>
              </button>
              {moreOpen && (
                <div style={{ position:'absolute', top:'calc(100% + 8px)', left:0, background:'var(--dark)', border:'1px solid rgba(232,228,216,0.12)', borderRadius:'var(--r)', minWidth:160, boxShadow:'0 8px 32px rgba(0,0,0,0.4)', zIndex:200, overflow:'hidden' }}>
                  {secondaryLinks.map(l => (
                    <Link key={l.to} to={l.to} onClick={() => setMoreOpen(false)}
                      style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 16px', fontSize:'0.78rem', letterSpacing:'0.04em', color:pathname===l.to?'var(--cream)':'rgba(232,228,216,0.65)', background:pathname===l.to?'rgba(232,228,216,0.08)':'transparent', borderLeft:pathname===l.to?'2px solid var(--bronze)':'2px solid transparent', transition:'all .15s', textDecoration:'none' }}>
                      <span style={{ fontSize:'0.85rem', width:18, textAlign:'center' }}>{l.icon}</span>
                      {l.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mobile: current page name */}
          <span className="admin-mobile-label" style={{ display:'none', fontSize:'0.75rem', fontWeight:500, color:'var(--cream)', letterSpacing:'0.08em', textTransform:'uppercase' }}>
            {currentPage}
          </span>
        </div>

        {/* Right */}
        <div style={{ display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
          <span className="admin-nav-email" style={{ fontSize:'0.7rem', color:'var(--stone)', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.email}</span>
          <Link to="/" target="_blank" className="admin-store-link" style={{ fontSize:'0.7rem', color:'var(--stone)', textDecoration:'none' }}>Store ↗</Link>
          <button onClick={logout} className="admin-signout-btn" style={{ fontSize:'0.7rem', color:'var(--stone)', background:'none', border:'1px solid rgba(232,228,216,0.15)', borderRadius:'var(--r)', cursor:'pointer', padding:'4px 10px', fontFamily:'var(--font-body)' }}>Sign out</button>

          {/* Hamburger — mobile only */}
          <button className="admin-hamburger" onClick={() => setMenuOpen(true)}
            style={{ display:'none', flexDirection:'column', gap:5, background:'none', border:'none', cursor:'pointer', padding:4 }}>
            <span style={{ display:'block', width:20, height:1.5, background:'var(--cream)' }} />
            <span style={{ display:'block', width:20, height:1.5, background:'var(--cream)' }} />
            <span style={{ display:'block', width:20, height:1.5, background:'var(--cream)' }} />
          </button>
        </div>
      </nav>

      {/* ── Mobile drawer ── */}
      {menuOpen && (
        <>
          <div onClick={() => setMenuOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:999 }} />
          <div style={{ position:'fixed', top:0, right:0, bottom:0, width:260, background:'var(--dark)', zIndex:1000, display:'flex', flexDirection:'column', animation:'menuIn 0.4s var(--ease-out) both' }}>
            <div style={{ padding:'18px 20px', borderBottom:'1px solid rgba(232,228,216,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <img src="/logo_reverse.png" alt="Cavero" style={{ height:20, width:'auto', display:'block' }} />
              <button onClick={() => setMenuOpen(false)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1.3rem', color:'var(--stone)', lineHeight:1 }}>×</button>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:'8px 0' }}>
              {allLinks.map(l => (
                <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)}
                  style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 20px', fontSize:'0.85rem', color:pathname===l.to?'var(--cream)':'rgba(232,228,216,0.6)', background:pathname===l.to?'rgba(232,228,216,0.08)':'transparent', borderLeft:pathname===l.to?'2px solid var(--bronze)':'2px solid transparent', transition:'all .15s', textDecoration:'none' }}>
                  <span style={{ fontSize:'0.9rem', width:20, textAlign:'center' }}>{l.icon}</span>
                  {l.label}
                </Link>
              ))}
            </div>
            <div style={{ padding:'14px 20px', borderTop:'1px solid rgba(232,228,216,0.08)' }}>
              {user && <p style={{ fontSize:'0.7rem', color:'var(--stone)', marginBottom:10, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.email}</p>}
              <div style={{ display:'flex', gap:8 }}>
                <Link to="/" target="_blank" style={{ flex:1, textAlign:'center', padding:'8px', border:'1px solid rgba(232,228,216,0.15)', borderRadius:'var(--r)', fontSize:'0.7rem', color:'var(--stone)', textDecoration:'none' }}>Store ↗</Link>
                <button onClick={() => { logout(); setMenuOpen(false) }} style={{ flex:1, padding:'8px', background:'rgba(139,26,26,0.3)', border:'1px solid rgba(139,26,26,0.4)', borderRadius:'var(--r)', fontSize:'0.7rem', color:'#FCA5A5', cursor:'pointer', fontFamily:'var(--font-body)' }}>Sign out</button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}