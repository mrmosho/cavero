import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export default function AdminSetPassword() {
    const navigate = useNavigate()
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const [sessionOk, setSessionOk] = useState(false)

    useEffect(() => {
        // Confirm there is an active session (from the invite token)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                navigate('/admin/login', { replace: true })
            } else {
                setSessionOk(true)
            }
        })
    }, [navigate])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)

        if (password.length < 8) {
            setError('Password must be at least 8 characters.')
            return
        }
        if (password !== confirm) {
            setError('Passwords do not match.')
            return
        }

        setLoading(true)
        const { error } = await supabase.auth.updateUser({ password })
        setLoading(false)

        if (error) {
            setError(error.message)
        } else {
            navigate('/admin', { replace: true })
        }
    }

    if (!sessionOk) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--charcoal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'var(--stone)', fontSize: '0.82rem' }}>Verifying invite...</p>
            </div>
        )
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--charcoal)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div style={{ width: '100%', maxWidth: 380 }}>

                <div style={{ textAlign: 'center', marginBottom: 48 }}>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 300, color: 'var(--cream)', letterSpacing: '0.15em' }}>Cavero</h1>
                    <p style={{ fontSize: '0.68rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--stone)', marginTop: 8 }}>Set your password</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--stone)', marginBottom: 8 }}>New password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            autoFocus
                            placeholder="At least 8 characters"
                            style={{ width: '100%', padding: '13px 16px', background: 'rgba(232,228,216,0.08)', border: '1px solid rgba(232,228,216,0.15)', borderRadius: 'var(--r)', color: 'var(--cream)', fontSize: '0.95rem', outline: 'none', fontFamily: 'var(--font-body)' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--stone)', marginBottom: 8 }}>Confirm password</label>
                        <input
                            type="password"
                            value={confirm}
                            onChange={e => setConfirm(e.target.value)}
                            required
                            placeholder="Repeat password"
                            style={{ width: '100%', padding: '13px 16px', background: 'rgba(232,228,216,0.08)', border: `1px solid ${error ? '#EF4444' : 'rgba(232,228,216,0.15)'}`, borderRadius: 'var(--r)', color: 'var(--cream)', fontSize: '0.95rem', outline: 'none', fontFamily: 'var(--font-body)' }}
                        />
                    </div>

                    {error && <p style={{ fontSize: '0.78rem', color: '#EF4444', margin: 0 }}>{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{ marginTop: 8, padding: '14px', background: 'var(--bronze)', color: '#fff', border: 'none', borderRadius: 'var(--r)', fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: loading ? 'default' : 'pointer', fontFamily: 'var(--font-body)', opacity: loading ? 0.7 : 1 }}>
                        {loading ? 'Saving...' : 'Set password & sign in'}
                    </button>
                </form>
            </div>
        </div>
    )
}