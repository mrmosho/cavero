import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { sendDiscountEmail } from '@/lib/email'

// localStorage so it never shows again on this device
const STORAGE_KEY = 'cavero_welcome_seen'

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let suffix = ''
  for (let i = 0; i < 6; i++) suffix += chars[Math.floor(Math.random() * chars.length)]
  return 'WELCOME-' + suffix
}

export default function WelcomePopup() {
  const [visible, setVisible] = useState(false)
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [claimed, setClaimed] = useState(null)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    // Never show again on this device once dismissed or claimed
    if (localStorage.getItem(STORAGE_KEY)) return
    const timer = setTimeout(() => setVisible(true), 5000)
    return () => clearTimeout(timer)
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  async function handleClaim(e) {
    e.preventDefault()
    if (!email || loading) return
    setLoading(true)
    setError(null)

    const normalizedEmail = email.toLowerCase().trim()

    // Check if this email has EVER had a code — used or not
    const { data: existing } = await supabase
      .from('discount_codes')
      .select('code, expires_at, used')
      .eq('email', normalizedEmail)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existing) {
      if (existing.used) {
        // Code already used — don't give another one
        setError('This email has already used a welcome discount.')
        setLoading(false)
        return
      }
      if (new Date(existing.expires_at) > new Date()) {
        // Still valid — show the existing code
        setClaimed({ code: existing.code, expiresAt: existing.expires_at })
        localStorage.setItem(STORAGE_KEY, '1')
        setLoading(false)
        return
      }
      // Expired and unused — don't give another one
      setError('This email has already claimed a welcome discount.')
      setLoading(false)
      return
    }

    // Brand new email — generate code
    const code      = generateCode()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const { error: dbErr } = await supabase
      .from('discount_codes')
      .insert({ code, email: normalizedEmail, percent_off: 10, expires_at: expiresAt })

    if (dbErr) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    await sendDiscountEmail({ to: normalizedEmail, code, expiresAt })
    setClaimed({ code, expiresAt })
    localStorage.setItem(STORAGE_KEY, '1')
    setLoading(false)
  }

  if (!visible) return null

  return (
    <>
      {/* Subtle overlay — doesn't block the whole site */}
      <div
        onClick={dismiss}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(29,28,34,0.45)',
          zIndex: 1200,
        }}
      />

      {/* Modal — properly centered */}
      <div style={{
        position:  'fixed',
        top:       '50%',
        left:      '50%',
        transform: 'translate(-50%, -50%)',
        width:     'calc(100% - 48px)',
        maxWidth:  460,
        background: 'var(--cream)',
        borderRadius: 'var(--r)',
        zIndex:    1201,
        overflow:  'hidden',
        boxShadow: '0 24px 80px rgba(29,28,34,0.25)',
        animation: 'fadeSlideUp 0.4s var(--ease-out) both',
      }}>
        {/* Close */}
        <button
          onClick={dismiss}
          style={{ position:'absolute', top:14, right:16, background:'none', border:'none', cursor:'pointer', fontSize:'1.4rem', color:'var(--stone)', lineHeight:1, zIndex:1, padding:4 }}>
          ×
        </button>

        {/* Header */}
        <div style={{ background:'var(--charcoal)', padding:'36px 40px 28px', textAlign:'center' }}>
          <p style={{ fontSize:'0.65rem', fontWeight:500, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--stone)', marginBottom:10 }}>
            Welcome to Cavero
          </p>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:'2rem', fontWeight:300, color:'var(--cream)', lineHeight:1.1, margin:'0 0 10px' }}>
            Get 10% off<br />your first order.
          </h2>
          <p style={{ fontSize:'0.82rem', color:'rgba(232,228,216,0.6)', lineHeight:1.7, margin:0 }}>
            Enter your email for a discount code. Valid for 24 hours, one use only.
          </p>
        </div>

        {/* Body */}
        <div style={{ padding:'28px 40px 32px' }}>
          {!claimed ? (
            <form onSubmit={handleClaim}>
              <div style={{ display:'flex', border:'1px solid rgba(45,43,52,0.2)', borderRadius:'var(--r)', overflow:'hidden', marginBottom:10 }}>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Your email address"
                  required
                  autoFocus
                  style={{ flex:1, padding:'13px 14px', border:'none', outline:'none', fontSize:'0.88rem', fontFamily:'var(--font-body)', background:'#fff', color:'var(--charcoal)' }}
                />
                <button
                  type="submit"
                  disabled={loading}
                  style={{ padding:'13px 20px', background:'var(--bronze)', color:'#fff', border:'none', fontSize:'0.7rem', fontWeight:500, letterSpacing:'0.1em', textTransform:'uppercase', cursor:loading?'default':'pointer', fontFamily:'var(--font-body)', whiteSpace:'nowrap', opacity:loading?0.7:1 }}>
                  {loading ? '...' : 'Claim'}
                </button>
              </div>
              {error && <p style={{ fontSize:'0.75rem', color:'#991B1B', marginBottom:8 }}>{error}</p>}
              <p style={{ fontSize:'0.7rem', color:'var(--stone)', lineHeight:1.6 }}>
                One use only · 24 hour expiry · One code per email address
              </p>
              <button
                type="button"
                onClick={dismiss}
                style={{ display:'block', marginTop:14, fontSize:'0.72rem', color:'var(--stone)', background:'none', border:'none', cursor:'pointer', textDecoration:'underline', fontFamily:'var(--font-body)' }}>
                No thanks
              </button>
            </form>
          ) : (
            <div style={{ textAlign:'center' }}>
              <p style={{ fontSize:'0.68rem', fontWeight:500, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--stone)', marginBottom:10 }}>Your discount code</p>
              <div style={{ background:'var(--charcoal)', padding:'18px 20px', borderRadius:'var(--r)', marginBottom:14 }}>
                <p style={{ fontFamily:'monospace', fontSize:'1.5rem', fontWeight:700, color:'var(--cream)', letterSpacing:'0.1em', margin:0 }}>{claimed.code}</p>
                <p style={{ fontSize:'0.7rem', color:'var(--stone)', marginTop:5 }}>
                  Expires {new Date(claimed.expiresAt).toLocaleDateString('en-EG', { day:'numeric', month:'long' })} at {new Date(claimed.expiresAt).toLocaleTimeString('en-EG', { hour:'2-digit', minute:'2-digit' })}
                </p>
              </div>
              <p style={{ fontSize:'0.78rem', color:'var(--stone)', marginBottom:18, lineHeight:1.6 }}>
                Enter this code at checkout for 10% off.
              </p>
              <button onClick={dismiss} className="btn btn-bronze btn-full">Shop now</button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}