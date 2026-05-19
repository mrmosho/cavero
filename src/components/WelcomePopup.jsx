import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { sendDiscountEmail } from '@/lib/email'

const SESSION_KEY = 'cavero_popup_seen'

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'WELCOME-'
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export default function WelcomePopup() {
  const [visible,  setVisible]  = useState(false)
  const [email,    setEmail]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [claimed,  setClaimed]  = useState(null) // { code, expiresAt }
  const [error,    setError]    = useState(null)

  useEffect(() => {
    // Only show once per session
    if (sessionStorage.getItem(SESSION_KEY)) return
    const timer = setTimeout(() => setVisible(true), 5000)
    return () => clearTimeout(timer)
  }, [])

  function dismiss() {
    sessionStorage.setItem(SESSION_KEY, '1')
    setVisible(false)
  }

  async function handleClaim(e) {
    e.preventDefault()
    if (!email || loading) return
    setLoading(true)
    setError(null)

    const normalizedEmail = email.toLowerCase().trim()

    // Check if this email already has a code
    const { data: existing } = await supabase
      .from('discount_codes')
      .select('code, expires_at, used')
      .eq('email', normalizedEmail)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (existing && !existing.used && new Date(existing.expires_at) > new Date()) {
      // Return their existing valid code
      setClaimed({ code: existing.code, expiresAt: existing.expires_at })
      setLoading(false)
      return
    }

    // Generate a new code
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

    // Send email (stubbed until Resend is configured)
    await sendDiscountEmail({ to: normalizedEmail, code, expiresAt })

    setClaimed({ code, expiresAt })
    sessionStorage.setItem(SESSION_KEY, '1')
    setLoading(false)
  }

  if (!visible) return null

  return (
    <>
      {/* Overlay */}
      <div
        onClick={dismiss}
        style={{ position:'fixed', inset:0, background:'rgba(29,28,34,0.7)', zIndex:1200, backdropFilter:'blur(4px)' }}
      />

      {/* Modal */}
      <div style={{
        position:'fixed', top:'50%', left:'50%',
        transform:'translate(-50%,-50%)',
        width:'100%', maxWidth:480,
        background:'var(--cream)', borderRadius:'var(--r)',
        zIndex:1201, overflow:'hidden',
        animation:'fadeSlideUp 0.5s var(--ease-out) both',
        margin:'0 16px',
      }}>
        {/* Close */}
        <button
          onClick={dismiss}
          style={{ position:'absolute', top:16, right:16, background:'none', border:'none', cursor:'pointer', fontSize:'1.4rem', color:'var(--stone)', lineHeight:1, zIndex:1 }}>
          ×
        </button>

        {/* Header */}
        <div style={{ background:'var(--charcoal)', padding:'40px 40px 32px', textAlign:'center' }}>
          <p style={{ fontSize:'0.68rem', fontWeight:500, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--stone)', marginBottom:12 }}>
            Welcome to Cavero
          </p>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:'2.2rem', fontWeight:300, color:'var(--cream)', lineHeight:1.1, margin:'0 0 12px' }}>
            Get 10% off<br />your first order.
          </h2>
          <p style={{ fontSize:'0.85rem', color:'rgba(232,228,216,0.65)', lineHeight:1.7, margin:0 }}>
            Enter your email and we will send you a discount code. Valid for 24 hours.
          </p>
        </div>

        {/* Body */}
        <div style={{ padding:'32px 40px 36px' }}>
          {!claimed ? (
            <form onSubmit={handleClaim}>
              <div style={{ display:'flex', gap:0, border:'1px solid rgba(45,43,52,0.2)', borderRadius:'var(--r)', overflow:'hidden', marginBottom:12 }}>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Your email address"
                  required
                  autoFocus
                  style={{ flex:1, padding:'14px 16px', border:'none', outline:'none', fontSize:'0.9rem', fontFamily:'var(--font-body)', background:'#fff', color:'var(--charcoal)' }}
                />
                <button
                  type="submit"
                  disabled={loading}
                  style={{ padding:'14px 22px', background:'var(--bronze)', color:'#fff', border:'none', fontSize:'0.72rem', fontWeight:500, letterSpacing:'0.1em', textTransform:'uppercase', cursor:loading?'default':'pointer', fontFamily:'var(--font-body)', whiteSpace:'nowrap', opacity:loading?0.7:1 }}>
                  {loading ? '...' : 'Claim'}
                </button>
              </div>
              {error && <p style={{ fontSize:'0.75rem', color:'#991B1B', marginBottom:8 }}>{error}</p>}
              <p style={{ fontSize:'0.72rem', color:'var(--stone)', lineHeight:1.6 }}>
                One use only · Expires in 24 hours · Cannot be combined with other offers
              </p>
              <button
                type="button"
                onClick={dismiss}
                style={{ display:'block', marginTop:16, fontSize:'0.72rem', color:'var(--stone)', background:'none', border:'none', cursor:'pointer', textDecoration:'underline', fontFamily:'var(--font-body)' }}>
                No thanks, I'll pay full price
              </button>
            </form>
          ) : (
            <div style={{ textAlign:'center' }}>
              <p style={{ fontSize:'0.72rem', fontWeight:500, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--stone)', marginBottom:12 }}>
                Your discount code
              </p>
              <div style={{ background:'var(--charcoal)', padding:'20px', borderRadius:'var(--r)', marginBottom:16 }}>
                <p style={{ fontFamily:'monospace', fontSize:'1.6rem', fontWeight:700, color:'var(--cream)', letterSpacing:'0.1em', margin:0 }}>
                  {claimed.code}
                </p>
                <p style={{ fontSize:'0.72rem', color:'var(--stone)', marginTop:6 }}>
                  Expires {new Date(claimed.expiresAt).toLocaleDateString('en-EG', { day:'numeric', month:'long' })} at {new Date(claimed.expiresAt).toLocaleTimeString('en-EG', { hour:'2-digit', minute:'2-digit' })}
                </p>
              </div>
              <p style={{ fontSize:'0.8rem', color:'var(--stone)', marginBottom:20, lineHeight:1.6 }}>
                Enter this code at checkout to get 10% off your order.
              </p>
              <button
                onClick={dismiss}
                className="btn btn-bronze btn-full">
                Shop now
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}