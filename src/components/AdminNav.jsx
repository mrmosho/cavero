import { Link, useLocation } from 'react-router-dom'
import { useAdmin } from '@/context/AdminContext'

const LINKS = [
  { to: '/admin',          label: 'Dashboard' },
  { to: '/admin/orders',   label: 'Orders' },
  { to: '/admin/products',       label: 'Products' },
  { to: '/admin/discount-codes',  label: 'Discounts' },
  { to: '/admin/finance',          label: 'Finance' },
  { to: '/admin/contacts',          label: 'Messages' },
  { to: '/admin/blocklist',         label: 'Block List' },
]

export default function AdminNav() {
  const { logout, user } = useAdmin()
  const { pathname } = useLocation()

  return (
    <nav style={{ background: 'var(--dark)', borderBottom: '1px solid rgba(232,228,216,0.08)', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 300, color: 'var(--cream)', letterSpacing: '0.12em' }}>Cavero</span>
        <span style={{ fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--stone)', borderLeft: '1px solid rgba(232,228,216,0.15)', paddingLeft: 16 }}>Admin</span>
        <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
          {LINKS.map(l => (
            <Link key={l.to} to={l.to}
              style={{ fontSize: '0.72rem', fontWeight: 400, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '6px 14px', borderRadius: 'var(--r)', color: pathname === l.to ? 'var(--cream)' : 'var(--stone)', background: pathname === l.to ? 'rgba(232,228,216,0.1)' : 'transparent', transition: 'all 0.2s', textDecoration: 'none' }}>
              {l.label}
            </Link>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {user && (
          <span style={{ fontSize: '0.72rem', color: 'var(--stone)' }}>{user.email}</span>
        )}
        <Link to="/" target="_blank" style={{ fontSize: '0.72rem', color: 'var(--stone)', letterSpacing: '0.06em', textDecoration: 'none' }}>View store ↗</Link>
        <button onClick={logout} style={{ fontSize: '0.72rem', color: 'var(--stone)', background: 'none', border: '1px solid rgba(232,228,216,0.15)', borderRadius: 'var(--r)', cursor: 'pointer', letterSpacing: '0.06em', padding: '5px 12px', fontFamily: 'var(--font-body)', transition: 'border-color .2s' }}>Sign out</button>
      </div>
    </nav>
  )
}