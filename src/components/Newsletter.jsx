import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/context/CartContext'

export default function Newsletter() {
  const { showToast } = useCart()
  const [email,     setEmail]     = useState('')
  const [loading,   setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || loading) return
    setLoading(true)

    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({ email, source: 'website' })

      if (error && error.code === '23505') {
        // Unique constraint — already subscribed
        showToast('You\'re already on the list ✦')
      } else if (error) {
        throw error
      } else {
        showToast('You\'re on the list — thank you ✦')
      }
      setEmail('')
    } catch (err) {
      console.error('Newsletter subscribe error:', err)
      showToast('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="newsletter">
      <div className="container">
        <div className="newsletter__inner reveal">
          <p className="t-label" style={{ color: 'var(--stone)', marginBottom: 16 }}>Stay close</p>
          <h2 className="t-h2" style={{ color: 'var(--cream)' }}>
            Be first to see<br />new pieces.
          </h2>
          <form className="newsletter__form" onSubmit={handleSubmit}>
            <input
              className="newsletter__input"
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <button className="newsletter__submit" type="submit" disabled={loading}>
              {loading ? '...' : 'Subscribe'}
            </button>
          </form>
          <p className="newsletter__note">No spam. Just new drops and seasonal gift guides.</p>
        </div>
      </div>
    </div>
  )
}
