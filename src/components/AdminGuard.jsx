import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAdmin } from '@/context/AdminContext'

export default function AdminGuard({ children }) {
  const { authed, loading } = useAdmin()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (loading) return
    if (!authed && location.pathname !== '/admin/login') {
      navigate('/admin/login', { replace: true })
    }
  }, [authed, loading, location.pathname, navigate])

  // Still checking session
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--charcoal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--stone)', fontSize: '0.82rem', letterSpacing: '0.08em' }}>Loading...</p>
      </div>
    )
  }

  // Not authed — render nothing (redirect fires in useEffect)
  if (!authed && location.pathname !== '/admin/login') return null

  return children
}