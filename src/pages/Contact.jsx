import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { useCart } from '@/context/CartContext'
import { supabase } from '@/lib/supabase'
import CustomOrderForm from '@/components/CustomOrderForm'
import Footer from '@/components/Footer'
import Toast from '@/components/Toast'

export default function Contact() {
  const { showToast }      = useCart()
  const [searchParams]     = useSearchParams()
  const [showCustom, setShowCustom] = useState(searchParams.get('subject') === 'custom')
  const [customSent, setCustomSent] = useState(false)
  const [form, setForm]    = useState({ name:'', phone:'', email:'', subject: showCustom ? 'custom' : 'general', message:'' })
  const [loading, setLoading] = useState(false)
  const formRef    = useRef(null)
  const messageRef = useRef(null)
  const customRef  = useRef(null)
  useScrollReveal()

  const set = f => e => setForm(prev => ({ ...prev, [f]: e.target.value }))
  const isCustom = form.subject === 'custom'

  useEffect(() => {
    if (searchParams.get('subject') === 'custom') {
      setShowCustom(true)
      setTimeout(() => customRef.current?.scrollIntoView({ behavior:'smooth', block:'start' }), 300)
    }
  }, [])

  useEffect(() => {
    if (isCustom) setShowCustom(true)
  }, [isCustom])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (form.email) {
        const { data: blocked } = await supabase.from('blocked_emails').select('id').eq('email', form.email.toLowerCase().trim()).maybeSingle()
        if (blocked) { showToast('Unable to send message. Please contact us on WhatsApp.'); setLoading(false); return }
      }
      const { error } = await supabase.from('contact_enquiries').insert({ name:form.name, phone:form.phone||null, email:form.email||null, subject:form.subject, message:form.message })
      if (error) throw error
      showToast("Message sent — we'll be in touch soon ✦")
      setForm({ name:'', phone:'', email:'', subject:'general', message:'' })
    } catch {
      showToast('Something went wrong. Please reach out on WhatsApp.')
    } finally {
      setLoading(false)
    }
  }

  function startCustomOrder() {
    setShowCustom(true)
    setTimeout(() => customRef.current?.scrollIntoView({ behavior:'smooth', block:'start' }), 100)
  }

  return (
    <>
      <Toast />
      <div style={{ paddingTop:'calc(var(--nav-h) + 80px)', paddingBottom:80, minHeight:'100vh', background:'var(--cream)' }}>
        <div className="container">
          <p className="t-label reveal" style={{ marginBottom:16 }}>Get in touch</p>
          <h1 className="t-h1 reveal d1" style={{ marginBottom:8 }}>We would love to hear<br />from you.</h1>
          <p className="t-body reveal d2" style={{ maxWidth:500 }}>For questions, orders, or just to say hi — we respond within 24 hours.</p>

          <div className="contact-grid reveal d3" style={{ marginTop:60 }}>
            {/* General enquiry form */}
            <form onSubmit={handleSubmit} ref={formRef}>
              <div className="form-group">
                <label className="form-label">Your name</label>
                <input className="form-input" type="text" value={form.name} onChange={set('name')} placeholder="Your Name" required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone number</label>
                <input className="form-input" type="tel" value={form.phone} onChange={set('phone')} placeholder="+20 1XX XXX XXXX" required />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Email address <span style={{ color:'var(--stone)', fontWeight:400 }}>(optional)</span>
                </label>
                <input className="form-input" type="email" value={form.email} onChange={set('email')} placeholder="hello@example.com" />
                <p style={{ fontSize:'0.72rem', color:'var(--bronze)', marginTop:6, lineHeight:1.6 }}>
                  ✦ Leave your email and you may receive exclusive discount codes for future orders.
                </p>
              </div>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <select className="form-input" value={form.subject} onChange={set('subject')}>
                  <option value="general">General enquiry</option>
                  <option value="order">Existing order</option>
                  <option value="wholesale">Wholesale / gifting</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Leave us a message</label>
                <textarea className="form-textarea" ref={messageRef} value={form.message} onChange={set('message')} placeholder="Tell us what you have in mind..." required />
              </div>
              <button type="submit" className="btn btn-bronze btn-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send message'}
              </button>
            </form>

            {/* Right column */}
            <div>
              <div style={{ paddingTop:48 }}>
                {[
                  ['✉', 'Email',    'caveroegy@gmail.com'],
                  ['💬', 'WhatsApp', 'Available 10am – 8pm (Sun–Thu)'],
                  ['📍', 'Studio',   'Cairo, Egypt'],
                ].map(([icon, label, value]) => (
                  <div className="contact-info__item" key={label}>
                    <div className="contact-info__icon">{icon}</div>
                    <div>
                      <div className="contact-info__label">{label}</div>
                      <div className="contact-info__value">{value}</div>
                    </div>
                  </div>
                ))}

                <div style={{ marginTop:48, padding:32, background:'var(--charcoal)', borderRadius:'var(--r)', color:'var(--cream)' }}>
                  <p className="t-label" style={{ color:'var(--stone)', marginBottom:16 }}>Bespoke orders</p>
                  <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.3rem', fontWeight:400, marginBottom:13, color:'var(--cream)' }}>Something totally one-of-a-kind?</h3>
                  <p style={{ fontSize:'0.875rem', color:'rgba(232,228,216,0.62)', lineHeight:1.8, marginBottom:22 }}>Couple statues, corporate gifts, wedding favours — we work with you from scratch.</p>
                  <button type="button" className="btn btn-bronze btn-sm" onClick={startCustomOrder}>Start a custom order</button>
                </div>
              </div>
            </div>
          </div>

          {/* Custom order section — full width below */}
          {showCustom && (
            <div ref={customRef} style={{ marginTop:80, padding:'60px 0', background:'var(--charcoal)', borderRadius:'var(--r)' }}>
              <div style={{ maxWidth:640, margin:'0 auto', padding:'0 40px' }}>
                <div style={{ textAlign:'center', marginBottom:40 }}>
                  <p className="t-label" style={{ color:'var(--stone)', marginBottom:12 }}>Custom order</p>
                  <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.8rem', fontWeight:300, color:'var(--cream)', marginBottom:12 }}>Tell us what you have in mind</h2>
                  <p style={{ fontSize:'0.9rem', color:'rgba(232,228,216,0.65)', lineHeight:1.8 }}>Your request will be logged as an order. We will reach out with a price quote within 24 hours.</p>
                </div>
                {customSent ? (
                  <div style={{ textAlign:'center', padding:'32px', background:'rgba(232,228,216,0.06)', borderRadius:'var(--r)', border:'1px solid rgba(232,228,216,0.15)' }}>
                    <p style={{ fontSize:'1.1rem', fontFamily:'var(--font-display)', fontWeight:300, color:'var(--cream)', marginBottom:8 }}>Request received ✦</p>
                    <p style={{ color:'rgba(232,228,216,0.65)', fontSize:'0.88rem' }}>We will be in touch within 24 hours.</p>
                  </div>
                ) : (
                  <CustomOrderForm dark={true} onSuccess={() => setCustomSent(true)} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}