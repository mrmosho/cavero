import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdmin } from '@/context/AdminContext'

export default function AdminLogin() {
  const { login, authed } = useAdmin()
  const navigate = useNavigate()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState(null)
  const [loading,  setLoading]  = useState(false)

  // Already logged in — go straight to dashboard
  useEffect(() => {
    if (authed) navigate('/admin', { replace: true })
  }, [authed, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await login(email, password)
    setLoading(false)
    if (error) {
      // Don't expose specific error — just show generic message
      setError('Incorrect email or password.')
      setPassword('')
    } else {
      navigate('/admin', { replace: true })
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--charcoal)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <img src="/logo_reverse.png" alt="Cavero" style={{ height: 40, width: 'auto', margin: '0 auto' }} />
          <p style={{ fontSize: '0.68rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--stone)', marginTop: 8 }}>Admin</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--stone)', marginBottom: 8 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              autoComplete="email"
              placeholder="you@example.com"
              style={{ width: '100%', padding: '13px 16px', background: 'rgba(232,228,216,0.08)', border: '1px solid rgba(232,228,216,0.15)', borderRadius: 'var(--r)', color: 'var(--cream)', fontSize: '0.95rem', outline: 'none', fontFamily: 'var(--font-body)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--stone)', marginBottom: 8 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              style={{ width: '100%', padding: '13px 16px', background: 'rgba(232,228,216,0.08)', border: `1px solid ${error ? '#EF4444' : 'rgba(232,228,216,0.15)'}`, borderRadius: 'var(--r)', color: 'var(--cream)', fontSize: '0.95rem', outline: 'none', fontFamily: 'var(--font-body)' }}
            />
          </div>

          {error && (
            <p style={{ fontSize: '0.78rem', color: '#EF4444', margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ marginTop: 8, padding: '14px', background: 'var(--bronze)', color: '#fff', border: 'none', borderRadius: 'var(--r)', fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: loading ? 'default' : 'pointer', fontFamily: 'var(--font-body)', opacity: loading ? 0.7 : 1, transition: 'opacity .2s' }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--stone)', marginTop: 32, lineHeight: 1.7 }}>
          Access is by invitation only.<br />Contact the account owner if you need access.
        </p>
      </div>
    </div>
  )
}