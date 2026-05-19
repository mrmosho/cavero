import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AdminNav from '@/components/AdminNav'

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let suffix = ''
  for (let i = 0; i < 6; i++) suffix += chars[Math.floor(Math.random() * chars.length)]
  return 'CAVERO-' + suffix
}

export default function AdminDiscountCodes() {
  const [codes,   setCodes]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('all')
  const [creating, setCreating] = useState(false)
  const [newCode, setNewCode]  = useState({ email:'', percent_off:'10', hours:'24' })
  const [showForm, setShowForm] = useState(false)
  const [error, setError]      = useState(null)

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
    if (code.used)                              return { label:'Used',    color:'#6B8F5E' }
    if (new Date(code.expires_at) < new Date()) return { label:'Expired', color:'#8B1A1A' }
    return { label:'Active', color:'#A8956F' }
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!newCode.email.trim()) { setError('Email is required'); return }
    setCreating(true)
    setError(null)

    const code      = generateCode()
    const hours     = parseInt(newCode.hours) || 24
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()

    const { error: err } = await supabase.from('discount_codes').insert({
      code,
      email:       newCode.email.toLowerCase().trim(),
      percent_off: parseInt(newCode.percent_off) || 10,
      expires_at:  expiresAt,
    })

    setCreating(false)
    if (err) { setError(err.message); return }
    setNewCode({ email:'', percent_off:'10', hours:'24' })
    setShowForm(false)
    load()
  }

  async function deactivate(codeId) {
    if (!confirm('Deactivate this code? It will expire immediately.')) return
    await supabase.from('discount_codes').update({ expires_at: new Date().toISOString() }).eq('id', codeId)
    load()
  }

  function exportToCSV() {
    const headers = ['Code','Email','Discount','Status','Claimed','Expires','Used At']
    const rows = codes.map(c => {
      const status = getStatus(c)
      return [c.code, c.email, `${c.percent_off}%`, status.label, new Date(c.created_at).toLocaleDateString('en-EG'), new Date(c.expires_at).toLocaleDateString('en-EG'), c.used_at ? new Date(c.used_at).toLocaleDateString('en-EG') : '']
    })
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type:'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `cavero-discount-codes-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = codes.filter(c => {
    if (filter === 'active')  return !c.used && new Date(c.expires_at) > new Date()
    if (filter === 'used')    return c.used
    if (filter === 'expired') return !c.used && new Date(c.expires_at) < new Date()
    return true
  })

  const inp = { width:'100%', padding:'11px 14px', border:'1px solid rgba(45,43,52,0.2)', borderRadius:'var(--r)', fontSize:'0.9rem', color:'var(--charcoal)', background:'#fff', outline:'none', fontFamily:'var(--font-body)' }
  const lbl = { display:'block', fontSize:'0.68rem', fontWeight:500, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--stone)', marginBottom:7 }

  return (
    <div style={{ minHeight:'100vh', background:'#F8F6F0' }}>
      <AdminNav />
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'40px 32px' }}>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:32 }}>
          <div>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:'2rem', fontWeight:300 }}>Discount Codes</h1>
            <p style={{ color:'var(--stone)', fontSize:'0.85rem', marginTop:4 }}>{codes.length} total codes</p>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={exportToCSV} style={{ padding:'10px 20px', borderRadius:'var(--r)', fontSize:'0.72rem', fontWeight:500, letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer', border:'1px solid rgba(45,43,52,0.2)', background:'transparent', color:'var(--charcoal)', fontFamily:'var(--font-body)' }}>
              ↓ Export CSV
            </button>
            <button onClick={() => setShowForm(f => !f)} className="btn btn-bronze">
              {showForm ? '× Cancel' : '+ Generate code'}
            </button>
          </div>
        </div>

        {/* Generate form */}
        {showForm && (
          <div style={{ background:'#fff', borderRadius:'var(--r)', border:'1px solid rgba(45,43,52,0.08)', padding:28, marginBottom:24 }}>
            <p style={{ fontSize:'0.65rem', fontWeight:500, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--stone)', marginBottom:20 }}>Generate a code manually</p>
            {error && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'var(--r)', padding:'12px 16px', marginBottom:16, fontSize:'0.85rem', color:'#991B1B' }}>{error}</div>}
            <form onSubmit={handleCreate}>
              <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr auto', gap:16, alignItems:'flex-end' }}>
                <div><label style={lbl}>Customer email</label><input style={inp} type="email" value={newCode.email} onChange={e => setNewCode(p => ({ ...p, email:e.target.value }))} placeholder="customer@example.com" required /></div>
                <div><label style={lbl}>Discount %</label><input style={inp} type="number" min="1" max="100" value={newCode.percent_off} onChange={e => setNewCode(p => ({ ...p, percent_off:e.target.value }))} /></div>
                <div><label style={lbl}>Valid for (hours)</label><input style={inp} type="number" min="1" value={newCode.hours} onChange={e => setNewCode(p => ({ ...p, hours:e.target.value }))} /></div>
                <button type="submit" className="btn btn-bronze" disabled={creating} style={{ whiteSpace:'nowrap' }}>{creating ? 'Creating...' : 'Create'}</button>
              </div>
            </form>
          </div>
        )}

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:28 }}>
          {[
            { label:'Total',   value: codes.length },
            { label:'Active',  value: codes.filter(c => !c.used && new Date(c.expires_at) > new Date()).length },
            { label:'Used',    value: codes.filter(c => c.used).length },
            { label:'Expired', value: codes.filter(c => !c.used && new Date(c.expires_at) < new Date()).length },
          ].map(s => (
            <div key={s.label} style={{ background:'#fff', padding:'18px 22px', borderRadius:'var(--r)', border:'1px solid rgba(45,43,52,0.08)' }}>
              <p style={{ fontSize:'0.65rem', fontWeight:500, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--stone)', marginBottom:6 }}>{s.label}</p>
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
                  {['Code','Email','Discount','Claimed','Expires','Status',''].map(h => (
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
                      <td style={{ padding:'14px 20px', fontSize:'0.78rem', color:'var(--stone)' }}>{new Date(c.created_at).toLocaleDateString('en-EG', { day:'numeric', month:'short' })}</td>
                      <td style={{ padding:'14px 20px', fontSize:'0.78rem', color:'var(--stone)' }}>
                        {new Date(c.expires_at).toLocaleDateString('en-EG', { day:'numeric', month:'short' })}{' '}
                        {new Date(c.expires_at).toLocaleTimeString('en-EG', { hour:'2-digit', minute:'2-digit' })}
                      </td>
                      <td style={{ padding:'14px 20px' }}>
                        <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:100, fontSize:'0.65rem', fontWeight:500, background:`${status.color}18`, color:status.color }}>{status.label}</span>
                      </td>
                      <td style={{ padding:'14px 20px' }}>
                        {status.label === 'Active' && (
                          <button onClick={() => deactivate(c.id)} style={{ fontSize:'0.7rem', color:'#8B1A1A', background:'none', border:'none', cursor:'pointer', borderBottom:'1px solid #8B1A1A', paddingBottom:1 }}>
                            Deactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}