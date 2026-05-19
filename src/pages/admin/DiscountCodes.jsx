import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AdminNav from '@/components/AdminNav'

export default function AdminDiscountCodes() {
  const [codes,   setCodes]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('all') // all | active | used | expired

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false })
    setCodes(data || [])
    setLoading(false)
  }

  function getStatus(code) {
    if (code.used)                                  return { label:'Used',    color:'#6B8F5E' }
    if (new Date(code.expires_at) < new Date())     return { label:'Expired', color:'#8B1A1A' }
    return { label:'Active', color:'#A8956F' }
  }

  const filtered = codes.filter(c => {
    if (filter === 'all')     return true
    if (filter === 'active')  return !c.used && new Date(c.expires_at) > new Date()
    if (filter === 'used')    return c.used
    if (filter === 'expired') return !c.used && new Date(c.expires_at) < new Date()
    return true
  })

  const activeCount  = codes.filter(c => !c.used && new Date(c.expires_at) > new Date()).length
  const usedCount    = codes.filter(c => c.used).length
  const totalSavings = codes.filter(c => c.used).reduce((s, c) => s + (c.percent_off || 0), 0)

  return (
    <div style={{ minHeight:'100vh', background:'#F8F6F0' }}>
      <AdminNav />
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'40px 32px' }}>

        <div style={{ marginBottom:36 }}>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:'2rem', fontWeight:300 }}>Discount Codes</h1>
          <p style={{ color:'var(--stone)', fontSize:'0.85rem', marginTop:4 }}>Welcome popup codes — auto-generated per email</p>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:32 }}>
          {[
            { label:'Total codes',   value: codes.length },
            { label:'Active codes',  value: activeCount },
            { label:'Codes used',    value: usedCount },
          ].map(s => (
            <div key={s.label} style={{ background:'#fff', padding:'20px 24px', borderRadius:'var(--r)', border:'1px solid rgba(45,43,52,0.08)' }}>
              <p style={{ fontSize:'0.68rem', fontWeight:500, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--stone)', marginBottom:8 }}>{s.label}</p>
              <p style={{ fontFamily:'var(--font-display)', fontSize:'1.8rem', fontWeight:300 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display:'flex', gap:8, marginBottom:20 }}>
          {['all','active','used','expired'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding:'7px 16px', borderRadius:100, fontSize:'0.7rem', cursor:'pointer', border:'1px solid', fontFamily:'var(--font-body)', textTransform:'capitalize', borderColor:filter===f?'var(--charcoal)':'rgba(45,43,52,0.2)', background:filter===f?'var(--charcoal)':'transparent', color:filter===f?'var(--cream)':'var(--charcoal)' }}>
              {f}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ background:'#fff', borderRadius:'var(--r)', border:'1px solid rgba(45,43,52,0.08)', overflow:'hidden' }}>
          {loading ? <p style={{ padding:32, color:'var(--stone)' }}>Loading...</p> :
           filtered.length === 0 ? <p style={{ padding:32, color:'var(--stone)', textAlign:'center' }}>No codes found.</p> : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid rgba(45,43,52,0.08)', background:'#FAFAF8' }}>
                  {['Code','Email','Discount','Claimed','Expires','Status'].map(h => (
                    <th key={h} style={{ padding:'12px 20px', textAlign:'left', fontSize:'0.65rem', fontWeight:500, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--stone)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const status = getStatus(c)
                  return (
                    <tr key={c.id} style={{ borderBottom:'1px solid rgba(45,43,52,0.05)' }}>
                      <td style={{ padding:'14px 20px', fontFamily:'monospace', fontSize:'0.82rem', fontWeight:600, letterSpacing:'0.05em' }}>{c.code}</td>
                      <td style={{ padding:'14px 20px', fontSize:'0.82rem', color:'var(--stone)' }}>{c.email}</td>
                      <td style={{ padding:'14px 20px', fontSize:'0.85rem', fontWeight:500, color:'var(--bronze)' }}>{c.percent_off}% off</td>
                      <td style={{ padding:'14px 20px', fontSize:'0.78rem', color:'var(--stone)' }}>
                        {new Date(c.created_at).toLocaleDateString('en-EG', { day:'numeric', month:'short' })}
                      </td>
                      <td style={{ padding:'14px 20px', fontSize:'0.78rem', color:'var(--stone)' }}>
                        {new Date(c.expires_at).toLocaleDateString('en-EG', { day:'numeric', month:'short' })}
                        {' '}
                        {new Date(c.expires_at).toLocaleTimeString('en-EG', { hour:'2-digit', minute:'2-digit' })}
                      </td>
                      <td style={{ padding:'14px 20px' }}>
                        <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:100, fontSize:'0.65rem', fontWeight:500, background:`${status.color}18`, color:status.color }}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        <p style={{ marginTop:16, fontSize:'0.72rem', color:'var(--stone)', lineHeight:1.7 }}>
          Codes are generated automatically when customers claim the welcome popup offer. Each code is tied to one email address and expires 24 hours after being claimed.
        </p>
      </div>
    </div>
  )
}