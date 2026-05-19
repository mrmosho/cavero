import { useState, useRef } from 'react'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { useCart } from '@/context/CartContext'
import { supabase } from '@/lib/supabase'
import Footer from '@/components/Footer'
import Toast from '@/components/Toast'

export default function Contact() {
  const { showToast } = useCart()
  const [form, setForm] = useState({ name:'', email:'', subject:'general', message:'' })
  const [loading, setLoading] = useState(false)
  const formRef = useRef(null)
  const messageRef = useRef(null)
  useScrollReveal()

  const set = f => e => setForm(prev => ({ ...prev, [f]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.from('contact_enquiries').insert({ name:form.name, email:form.email, subject:form.subject, message:form.message })
      if (error) throw error
      showToast("Message sent — we'll be in touch soon ✦")
      setForm({ name:'', email:'', subject:'general', message:'' })
    } catch { showToast('Something went wrong. Please email us directly.') }
    finally { setLoading(false) }
  }

  function startCustomOrder() {
    setForm(f => ({ ...f, subject:'custom' }))
    // Scroll to form and focus message field
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
              <div className="form-group"><label className="form-label">Your name</label><input className="form-input" type="text" value={form.name} onChange={set('name')} placeholder="Your Name" required /></div>
              <div className="form-group"><label className="form-label">Email address</label><input className="form-input" type="email" value={form.email} onChange={set('email')} placeholder="hello@example.com" required /></div>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <select className="form-input" value={form.subject} onChange={set('subject')}>
                  <option value="general">General enquiry</option>
                  <option value="custom">Custom order</option>
                  <option value="order">Existing order</option>
                  <option value="wholesale">Wholesale / gifting</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea
                  className="form-textarea"
                  ref={messageRef}
                  value={form.message}
                  onChange={set('message')}
                  placeholder="Tell us what you have in mind..."
                  required
                />
              </div>
              <button type="submit" className="btn btn-bronze btn-full" disabled={loading}>{loading ? 'Sending...' : 'Send message'}</button>
            </form>
            <div className="contact-info" style={{ paddingTop:48 }}>
              {[['✉','Email','caveroegy@gmail.com'],['💬','WhatsApp','Available 10am – 8pm (Sun–Thu)'],['📍','Studio','Cairo, Egypt']].map(([icon,label,value]) => (
                <div className="contact-info__item" key={label}>
                  <div className="contact-info__icon">{icon}</div>
                  <div><div className="contact-info__label">{label}</div><div className="contact-info__value">{value}</div></div>
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