import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { useCart } from '@/context/CartContext'
import { supabase } from '@/lib/supabase'
import Footer from '@/components/Footer'
import Toast from '@/components/Toast'

export default function Contact() {
  const { showToast } = useCart()
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState({ name:'', phone:'', email:'', subject: searchParams.get('subject') || 'general', message:'' })

  // If URL has ?subject=custom, scroll to form and focus message
  useEffect(() => {
    if (searchParams.get('subject') === 'custom') {
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior:'smooth', block:'start' })
        setTimeout(() => messageRef.current?.focus(), 500)
      }, 300)
    }
  }, [])
  const [loading, setLoading] = useState(false)
  const formRef    = useRef(null)
  const messageRef = useRef(null)
  useScrollReveal()

  const set = f => e => setForm(prev => ({ ...prev, [f]: e.target.value }))
  const isCustom = form.subject === 'custom'

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
    setForm(f => ({ ...f, subject:'custom' }))
    formRef.current?.scrollIntoView({ behavior:'smooth', block:'start' })
    setTimeout(() => messageRef.current?.focus(), 500)
  }

  return (
    <>
      <Toast />
      <div style={{ paddingTop:'calc(var(--nav-h) + 80px)', paddingBottom:80, minHeight:'100vh', background:'var(--cream)' }}>
        <div className="container">
          <p className="t-label reveal" style={{ marginBottom:16 }}>Get in touch</p>
          <h1 className="t-h1 reveal d1" style={{ marginBottom:8 }}>We would love to hear<br />from you.</h1>
          <p className="t-body reveal d2" style={{ maxWidth:500 }}>For custom orders, questions, or just to say hi — we respond within 24 hours.</p>

          <div className="contact-grid reveal d3" style={{ marginTop:60 }}>
            <form onSubmit={handleSubmit} ref={formRef}>

              {/* Custom order banner — shown when subject is custom */}
              {isCustom && (
                <div style={{ background:'var(--charcoal)', color:'var(--cream)', borderRadius:'var(--r)', padding:'20px 24px', marginBottom:28, display:'flex', gap:16, alignItems:'flex-start', animation:'fadeSlideUp 0.4s var(--ease-out) both' }}>
                  <div style={{ fontSize:'1.4rem', flexShrink:0, marginTop:2 }}>✦</div>
                  <div>
                    <p style={{ fontFamily:'var(--font-display)', fontSize:'1.1rem', fontWeight:400, marginBottom:6, color:'var(--cream)' }}>You are starting a custom order</p>
                    <p style={{ fontSize:'0.82rem', color:'rgba(232,228,216,0.72)', lineHeight:1.7 }}>
                      Please fill in your name and phone number so we can reach you, then describe your custom order in detail below — what you want, colours, size, occasion, and any personal touches.
                    </p>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Your name</label>
                <input className="form-input" type="text" value={form.name} onChange={set('name')} placeholder="Your Name" required />
              </div>

              <div className="form-group">
                <label className="form-label">Phone number</label>
                <input className="form-input" type="tel" value={form.phone} onChange={set('phone')} placeholder="+20 1XX XXX XXXX" required />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span>Email address <span style={{ color:'var(--stone)', fontWeight:400 }}>(optional)</span></span>
                </label>
                <input className="form-input" type="email" value={form.email} onChange={set('email')} placeholder="hello@example.com" />
                <p style={{ fontSize:'0.72rem', color:'var(--bronze)', marginTop:6, lineHeight:1.6 }}>
                  ✦ Leave your email and you may receive exclusive discount codes for future orders.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Subject</label>
                <select className="form-input" value={form.subject} onChange={set('subject')}
                  style={{ borderColor: isCustom ? 'var(--bronze)' : undefined }}>
                  <option value="general">General enquiry</option>
                  <option value="custom">Custom order</option>
                  <option value="order">Existing order</option>
                  <option value="wholesale">Wholesale / gifting</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {isCustom ? (
                    <span style={{ color:'var(--charcoal)', display:'flex', alignItems:'center', gap:8 }}>
                      Describe your custom order
                      <span style={{ background:'var(--bronze)', color:'#fff', fontSize:'0.6rem', fontWeight:500, letterSpacing:'0.08em', textTransform:'uppercase', padding:'2px 8px', borderRadius:100 }}>Custom</span>
                    </span>
                  ) : 'Leave us a message'}
                </label>
                <textarea
                  className="form-textarea"
                  ref={messageRef}
                  value={form.message}
                  onChange={set('message')}
                  placeholder={isCustom
                    ? "Describe your custom order in detail — what you want, colours, size, occasion, names or text to include, and any references or inspiration..."
                    : "Tell us what you have in mind..."}
                  style={{
                    minHeight: isCustom ? 160 : 120,
                    borderColor: isCustom ? 'var(--bronze)' : undefined,
                    transition: 'min-height 0.3s, border-color 0.2s',
                  }}
                  required
                />
                {isCustom && (
                  <p style={{ fontSize:'0.72rem', color:'var(--stone)', marginTop:6, lineHeight:1.6 }}>
                    The more detail you give us, the better we can bring your vision to life.
                  </p>
                )}
              </div>

              <button type="submit" className="btn btn-bronze btn-full" disabled={loading}>
                {loading ? 'Sending...' : isCustom ? 'Send custom order request' : 'Send message'}
              </button>
            </form>

            <div className="contact-info" style={{ paddingTop:48 }}>
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
      </div>
      <Footer />
    </>
  )
}