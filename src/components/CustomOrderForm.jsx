import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

const GOVERNORATES = ['Cairo','Giza','Alexandria','Qalyubia','Sharqia','Dakahlia','Beheira','Monufia','Gharbia','Kafr el-Sheikh','Damietta','Port Said','Ismailia','Suez','North Sinai','South Sinai','Matruh','Faiyum','Beni Suef','Minya','Asyut','Sohag','Qena','Luxor','Aswan','Red Sea','New Valley']

export default function CustomOrderForm({ onSuccess, dark = false }) {
  const navigate   = useNavigate()
  const fileRef    = useRef(null)
  const [form, setForm] = useState({ name:'', phone:'', email:'', description:'', line1:'', city:'', governorate:'Cairo' })
  const [files,    setFiles]    = useState([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))

  const inputStyle = dark ? {
    width:'100%', padding:'13px 14px', background:'rgba(232,228,216,0.08)',
    border:'1px solid rgba(232,228,216,0.15)', borderRadius:'var(--r)',
    color:'var(--cream)', fontSize:'0.9rem', outline:'none', fontFamily:'var(--font-body)'
  } : {
    width:'100%', padding:'13px 14px', background:'#fff',
    border:'1px solid rgba(45,43,52,0.2)', borderRadius:'var(--r)',
    color:'var(--charcoal)', fontSize:'0.9rem', outline:'none', fontFamily:'var(--font-body)'
  }

  const labelStyle = {
    display:'block', fontSize:'0.68rem', fontWeight:500,
    letterSpacing:'0.1em', textTransform:'uppercase',
    color: dark ? 'var(--stone)' : 'var(--charcoal)', marginBottom:7
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.phone || !form.description) {
      setError('Please fill in your name, phone, and order description.')
      return
    }
    setLoading(true)
    setError(null)

    let stlUrl = null

    // Upload all files, store URLs as comma-separated string
    if (files.length > 0) {
      const urls = []
      for (const file of files) {
        const ext      = file.name.split('.').pop().toLowerCase()
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadErr } = await supabase.storage.from('stl-files').upload(filename, file)
        if (uploadErr) { setError('File upload failed: ' + uploadErr.message); setLoading(false); return }
        const { data: { publicUrl } } = supabase.storage.from('stl-files').getPublicUrl(filename)
        urls.push(publicUrl)
      }
      stlUrl = urls.join(',')
    }

    // Create order
    const shippingAddress = { name: form.name, phone: form.phone, line1: form.line1 || 'TBD', city: form.city || 'Cairo', governorate: form.governorate }

    const { data: order, error: orderErr } = await supabase.from('orders').insert({
      guest_name:          form.name,
      guest_email:         form.email || null,
      guest_phone:         form.phone,
      status:              'pending_payment',
      order_type:          'custom',
      custom_description:  form.description,
      stl_file_url:        stlUrl,
      subtotal:            0,
      shipping:            0,
      total:               0,
      shipping_address:    shippingAddress,
      payment_method:      'cod',
      notes:               `Custom order — price TBD after review`,
    }).select().single()

    setLoading(false)

    if (orderErr) { setError('Something went wrong. Please try again.'); return }

    if (onSuccess) {
      onSuccess(order)
    } else {
      navigate(`/order-confirmation?id=${order.id}`)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'var(--r)', padding:'12px 16px', marginBottom:20, fontSize:'0.85rem', color:'#991B1B' }}>
          {error}
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <div>
          <label style={labelStyle}>Your name</label>
          <input style={inputStyle} value={form.name} onChange={set('name')} placeholder="Your Name" required />
        </div>
        <div>
          <label style={labelStyle}>Phone number</label>
          <input style={{ ...inputStyle }} type="tel" value={form.phone} onChange={set('phone')} placeholder="+20 1XX XXX XXXX" required />
        </div>
      </div>

      <div style={{ marginBottom:16 }}>
        <label style={labelStyle}>
          Email <span style={{ color: dark ? 'rgba(232,228,216,0.4)' : 'var(--stone)', fontWeight:300, textTransform:'none', letterSpacing:0, fontSize:'0.72rem' }}>(optional — get exclusive discounts)</span>
        </label>
        <input style={inputStyle} type="email" value={form.email} onChange={set('email')} placeholder="hello@example.com" />
      </div>

      <div style={{ marginBottom:16 }}>
        <label style={labelStyle}>Describe your custom order</label>
        <textarea
          value={form.description}
          onChange={set('description')}
          required
          placeholder="Tell us what you want — type of piece, occasion, names or text to include, colours, size, any references or inspiration..."
          style={{ ...inputStyle, minHeight:160, resize:'vertical' }}
        />
        <p style={{ fontSize:'0.72rem', color: dark ? 'rgba(232,228,216,0.4)' : 'var(--stone)', marginTop:6 }}>
          The more detail the better. We will contact you with a price quote within 24 hours.
        </p>
      </div>

      {/* STL file upload */}
      <div style={{ marginBottom:16 }}>
        <label style={labelStyle}>
          3D file / STL <span style={{ color: dark ? 'rgba(232,228,216,0.4)' : 'var(--stone)', fontWeight:300, textTransform:'none', letterSpacing:0, fontSize:'0.72rem' }}>(optional)</span>
        </label>
        <div
          onClick={() => fileRef.current?.click()}
          style={{ border:`2px dashed ${dark ? 'rgba(232,228,216,0.2)' : 'rgba(45,43,52,0.2)'}`, borderRadius:'var(--r)', padding:'20px', textAlign:'center', cursor:'pointer', transition:'border-color .2s', background: dark ? 'rgba(232,228,216,0.04)' : '#FAFAF8' }}
          onMouseEnter={e => e.currentTarget.style.borderColor='var(--bronze)'}
          onMouseLeave={e => e.currentTarget.style.borderColor= dark ? 'rgba(232,228,216,0.2)' : 'rgba(45,43,52,0.2)'}>
          <input ref={fileRef} type="file" accept=".stl,.obj,.step,.stp,.3mf" multiple onChange={e => setFiles(Array.from(e.target.files))} style={{ display:'none' }} />
          {files.length > 0 ? (
            <div>
              {files.map((f, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                  <p style={{ fontSize:'0.82rem', color:'var(--bronze)', margin:0 }}>✓ {f.name}</p>
                  <p style={{ fontSize:'0.72rem', color: dark ? 'var(--stone)' : 'var(--stone)', margin:0, marginLeft:8 }}>{(f.size/1024/1024).toFixed(1)} MB</p>
                </div>
              ))}
              <p style={{ fontSize:'0.7rem', color: dark ? 'rgba(232,228,216,0.4)' : 'var(--stone)', marginTop:6 }}>{files.length} file{files.length!==1?'s':''} selected · Click to add more</p>
            </div>
          ) : (
            <div>
              <p style={{ fontSize:'0.85rem', color: dark ? 'rgba(232,228,216,0.5)' : 'var(--stone)', marginBottom:4 }}>Click to upload your 3D file</p>
              <p style={{ fontSize:'0.72rem', color: dark ? 'rgba(232,228,216,0.3)' : 'var(--stone)' }}>STL, OBJ, STEP, 3MF · Max 50MB</p>
            </div>
          )}
        </div>
        {files.length > 0 && (
          <button type="button" onClick={() => setFiles([])}
            style={{ fontSize:'0.72rem', color: dark ? 'var(--stone)' : 'var(--stone)', background:'none', border:'none', cursor:'pointer', marginTop:6, textDecoration:'underline', fontFamily:'var(--font-body)' }}>
            Remove all files
          </button>
        )}
      </div>

      {/* Delivery address — optional, can be confirmed later */}
      <details style={{ marginBottom:24 }}>
        <summary style={{ fontSize:'0.72rem', fontWeight:500, letterSpacing:'0.08em', textTransform:'uppercase', color: dark ? 'var(--stone)' : 'var(--stone)', cursor:'pointer', marginBottom:12 }}>
          Add delivery address (optional — we can confirm later)
        </summary>
        <div style={{ display:'grid', gap:12, marginTop:12 }}>
          <div>
            <label style={labelStyle}>Address</label>
            <input style={inputStyle} value={form.line1} onChange={set('line1')} placeholder="Street, building, apartment" />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={labelStyle}>City</label>
              <input style={inputStyle} value={form.city} onChange={set('city')} placeholder="Cairo" />
            </div>
            <div>
              <label style={labelStyle}>Governorate</label>
              <select value={form.governorate} onChange={set('governorate')} style={inputStyle}>
                {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
        </div>
      </details>

      <button type="submit" disabled={loading}
        style={{ width:'100%', padding:'15px', background:'var(--bronze)', color:'#fff', border:'none', borderRadius:'var(--r)', fontSize:'0.78rem', fontWeight:500, letterSpacing:'0.1em', textTransform:'uppercase', cursor:loading?'default':'pointer', fontFamily:'var(--font-body)', opacity:loading?0.7:1 }}>
        {loading ? 'Submitting...' : 'Send custom order request'}
      </button>

      <p style={{ fontSize:'0.72rem', color: dark ? 'rgba(232,228,216,0.4)' : 'var(--stone)', textAlign:'center', marginTop:10, lineHeight:1.6 }}>
        No payment now. We will review your request and send a price quote within 24 hours.
      </p>
    </form>
  )
}