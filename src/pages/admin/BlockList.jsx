import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AdminNav from '@/components/AdminNav'

export default function AdminBlockList() {
  const [blocked,  setBlocked]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [newEmail, setNewEmail]  = useState('')
  const [newReason,setNewReason] = useState('')
  const [adding,   setAdding]   = useState(false)
  const [showForm, setShowForm]  = useState(false)
  const [error,    setError]    = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('blocked_emails')
      .select('*')
      .order('created_at', { ascending: false })
    setBlocked(data || [])
    setLoading(false)
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!newEmail.trim()) return
    setAdding(true)
    setError(null)
    const { error: err } = await supabase.from('blocked_emails').insert({
      email:      newEmail.toLowerCase().trim(),
      reason:     newReason || null,
      blocked_by: 'admin',
    })
    setAdding(false)
    if (err?.code === '23505') { setError('This email is already blocked.'); return }
    if (err) { setError(err.message); return }
    setNewEmail('')
    setNewReason('')
    setShowForm(false)
    load()
  }

  async function unblock(id, email) {
    if (!confirm(`Unblock ${email}?`)) return
    await supabase.from('blocked_emails').delete().eq('id', id)
    setBlocked(prev => prev.filter(b => b.id !== id))
  }

  const inp = { width:'100%', padding:'11px 14px', border:'1px solid rgba(45,43,52,0.2)', borderRadius:'var(--r)', fontSize:'0.9rem', color:'var(--charcoal)', background:'#fff', outline:'none', fontFamily:'var(--font-body)' }
  const lbl = { display:'block', fontSize:'0.68rem', fontWeight:500, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--stone)', marginBottom:7 }

  return (
    <div style={{ minHeight:'100vh', background:'#F8F6F0' }}>
      <AdminNav />
      <div style={{ maxWidth:900, margin:'0 auto', padding:'40px 32px' }}>

        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:32 }}>
          <div>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:'2rem', fontWeight:300 }}>Block List</h1>
            <p style={{ color:'var(--stone)', fontSize:'0.85rem', marginTop:4 }}>
              {blocked.length} blocked emails · Cannot place orders or submit contact messages
            </p>
          </div>
          <button onClick={() => setShowForm(f => !f)} className="btn btn-bronze">
            {showForm ? '× Cancel' : '+ Block email'}
          </button>
        </div>

        {/* Add form */}
        {showForm && (
          <div style={{ background:'#fff', borderRadius:'var(--r)', border:'1px solid rgba(45,43,52,0.08)', padding:28, marginBottom:24 }}>
            <p style={{ fontSize:'0.65rem', fontWeight:500, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--stone)', marginBottom:20 }}>Block an email address</p>
            {error && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'var(--r)', padding:'12px 16px', marginBottom:16, fontSize:'0.85rem', color:'#991B1B' }}>{error}</div>}
            <form onSubmit={handleAdd}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:16, alignItems:'flex-end' }}>
                <div><label style={lbl}>Email address</label><input style={inp} type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="spam@example.com" required /></div>
                <div><label style={lbl}>Reason (optional)</label><input style={inp} type="text" value={newReason} onChange={e => setNewReason(e.target.value)} placeholder="e.g. Spam, fraudulent order" /></div>
                <button type="submit" className="btn btn-bronze" disabled={adding}>{adding ? 'Blocking...' : 'Block'}</button>
              </div>
            </form>
          </div>
        )}

        {/* List */}
        <div style={{ background:'#fff', borderRadius:'var(--r)', border:'1px solid rgba(45,43,52,0.08)', overflow:'hidden' }}>
          {loading ? (
            <p style={{ padding:32, color:'var(--stone)' }}>Loading...</p>
          ) : blocked.length === 0 ? (
            <p style={{ padding:32, color:'var(--stone)', textAlign:'center' }}>No blocked emails.</p>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid rgba(45,43,52,0.08)', background:'#FAFAF8' }}>
                  {['Email','Reason','Blocked on',''].map(h => (
                    <th key={h} style={{ padding:'12px 20px', textAlign:'left', fontSize:'0.65rem', fontWeight:500, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--stone)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {blocked.map(b => (
                  <tr key={b.id} style={{ borderBottom:'1px solid rgba(45,43,52,0.05)' }}>
                    <td style={{ padding:'14px 20px', fontSize:'0.88rem', fontFamily:'monospace' }}>{b.email}</td>
                    <td style={{ padding:'14px 20px', fontSize:'0.82rem', color:'var(--stone)' }}>{b.reason || '—'}</td>
                    <td style={{ padding:'14px 20px', fontSize:'0.78rem', color:'var(--stone)' }}>
                      {new Date(b.created_at).toLocaleDateString('en-EG', { day:'numeric', month:'short', year:'numeric' })}
                    </td>
                    <td style={{ padding:'14px 20px' }}>
                      <button onClick={() => unblock(b.id, b.email)}
                        style={{ fontSize:'0.72rem', color:'#6B8F5E', background:'none', border:'none', borderBottom:'1px solid #6B8F5E', cursor:'pointer', paddingBottom:1 }}>
                        Unblock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p style={{ marginTop:16, fontSize:'0.72rem', color:'var(--stone)', lineHeight:1.7 }}>
          Blocked emails cannot submit contact messages or place orders. Block applies to email only — phone-only contacts are not affected.
        </p>
      </div>
    </div>
  )
}