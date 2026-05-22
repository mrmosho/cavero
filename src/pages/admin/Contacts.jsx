import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AdminNav from '@/components/AdminNav'
import { logAction } from '@/lib/audit'
import { useAdmin } from '@/context/AdminContext'

const FLAGS = {
  important: { label:'Important', color:'#C4873A', icon:'★' },
  follow_up: { label:'Follow up', color:'#2D2B34', icon:'↩' },
  spam:      { label:'Spam',      color:'#8B1A1A', icon:'⊘' },
}

const SUBJECTS = {
  general:   'General',
  custom:    'Custom order',
  order:     'Existing order',
  wholesale: 'Wholesale',
}

export default function AdminContacts() {
  const [messages,  setMessages]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [filter,    setFilter]    = useState('all')
  const [selected,  setSelected]  = useState(null)
  const [blocking,  setBlocking]  = useState(null)
  const { user }               = useAdmin()
  const [blockNote, setBlockNote] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('contact_enquiries')
      .select('*')
      .order('created_at', { ascending: false })
    setMessages(data || [])
    setLoading(false)
  }

  async function markRead(id, read) {
    await supabase.from('contact_enquiries').update({ read }).eq('id', id)
    setMessages(prev => prev.map(m => m.id === id ? { ...m, read } : m))
  }

  async function setFlag(id, flag) {
    const newFlag = flag
    await supabase.from('contact_enquiries').update({ flag: newFlag }).eq('id', id)
    const msg = messages.find(m => m.id === id)
    if (newFlag) await logAction({ userEmail: user?.email, action: `Flagged message as ${newFlag}`, targetType:'contact', targetId: id, targetName: msg?.name })
    else await logAction({ userEmail: user?.email, action: 'Removed flag from message', targetType:'contact', targetId: id, targetName: msg?.name })
    setMessages(prev => prev.map(m => m.id === id ? { ...m, flag: newFlag } : m))
    if (selected?.id === id) setSelected(prev => ({ ...prev, flag: newFlag }))
  }

  async function markReplied(id) {
    await supabase.from('contact_enquiries').update({ replied: true }).eq('id', id)
    const msg = messages.find(m => m.id === id)
    await logAction({ userEmail: user?.email, action: 'Marked message as replied', targetType:'contact', targetId: id, targetName: msg?.name })
    setMessages(prev => prev.map(m => m.id === id ? { ...m, replied: true } : m))
    if (selected?.id === id) setSelected(prev => ({ ...prev, replied: true }))
  }

  async function deleteMessage(id) {
    if (!confirm('Delete this message?')) return
    const msg = messages.find(m => m.id === id)
    await supabase.from('contact_enquiries').delete().eq('id', id)
    await logAction({ userEmail: user?.email, action: 'Deleted contact message', targetType:'contact', targetId: id, targetName: msg?.name, details: { email: msg?.email, subject: msg?.subject } })
    setMessages(prev => prev.filter(m => m.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  async function blockEmail(email) {
    if (!email) { alert('No email to block.'); return }
    const { error } = await supabase.from('blocked_emails').insert({
      email: email.toLowerCase().trim(),
      reason: blockNote || null,
      blocked_by: 'admin',
    })
    if (error && error.code === '23505') {
      alert('This email is already blocked.')
    } else if (error) {
      alert('Failed to block: ' + error.message)
    } else {
      await logAction({ userEmail: user?.email, action: 'Blocked email from contact message', targetType:'blocked_email', targetName: email, details: { reason: blockNote || null } })
      alert(`${email} has been blocked.`)
      setBlocking(null)
      setBlockNote('')
    }
  }

  const filtered = messages.filter(m => {
    if (filter === 'unread')    return !m.read
    if (filter === 'flagged')   return !!m.flag
    if (filter === 'follow_up') return m.flag === 'follow_up'
    if (filter === 'important') return m.flag === 'important'
    if (filter === 'spam')      return m.flag === 'spam'
    if (filter === 'replied')   return m.replied
    return true
  })

  const unreadCount = messages.filter(m => !m.read).length

  const rowStyle = (m) => ({
    display: 'grid',
    gridTemplateColumns: '8px 1fr auto',
    gap: 16,
    padding: '14px 20px',
    borderBottom: '1px solid rgba(45,43,52,0.06)',
    cursor: 'pointer',
    background: selected?.id === m.id ? 'rgba(168,149,111,0.06)' : m.read ? '#fff' : '#FFFDF8',
    transition: 'background .15s',
    alignItems: 'start',
  })

  return (
    <div style={{ minHeight:'100vh', background:'#F8F6F0' }}>
      <AdminNav />
      <div className="admin-page-content" style={{ maxWidth:1200, margin:'0 auto', padding:'40px 32px' }}>

        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:32 }}>
          <div>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:'2rem', fontWeight:300 }}>Contact Messages</h1>
            <p style={{ color:'var(--stone)', fontSize:'0.85rem', marginTop:4 }}>
              {messages.length} total · {unreadCount} unread
            </p>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
          {[
            { key:'all',       label:'All' },
            { key:'unread',    label:`Unread (${unreadCount})` },
            { key:'important', label:'★ Important' },
            { key:'follow_up', label:'↩ Follow up' },
            { key:'spam',      label:'⊘ Spam' },
            { key:'replied',   label:'Replied' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{ padding:'7px 16px', borderRadius:100, fontSize:'0.7rem', cursor:'pointer', border:'1px solid', fontFamily:'var(--font-body)', borderColor:filter===f.key?'var(--charcoal)':'rgba(45,43,52,0.2)', background:filter===f.key?'var(--charcoal)':'transparent', color:filter===f.key?'var(--cream)':'var(--charcoal)' }}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="admin-contacts-grid" style={{ display:'grid', gridTemplateColumns: selected ? '1fr 420px' : '1fr', gap:20 }}>

          {/* Message list */}
          <div style={{ background:'#fff', borderRadius:'var(--r)', border:'1px solid rgba(45,43,52,0.08)', overflow:'hidden' }}>
            {loading ? (
              <p style={{ padding:32, color:'var(--stone)' }}>Loading...</p>
            ) : filtered.length === 0 ? (
              <p style={{ padding:32, color:'var(--stone)', textAlign:'center' }}>No messages found.</p>
            ) : filtered.map(m => (
              <div key={m.id} style={rowStyle(m)} onClick={() => { setSelected(m); if (!m.read) markRead(m.id, true) }}>
                {/* Unread dot */}
                <div style={{ width:8, height:8, borderRadius:'50%', background:m.read?'transparent':'var(--bronze)', marginTop:6, flexShrink:0 }} />

                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                    <span style={{ fontSize:'0.88rem', fontWeight: m.read ? 400 : 600 }}>{m.name}</span>
                    {m.flag && (
                      <span style={{ fontSize:'0.65rem', fontWeight:500, padding:'1px 7px', borderRadius:100, background:`${FLAGS[m.flag]?.color}18`, color:FLAGS[m.flag]?.color }}>
                        {FLAGS[m.flag]?.icon} {FLAGS[m.flag]?.label}
                      </span>
                    )}
                    {m.replied && <span style={{ fontSize:'0.65rem', color:'#6B8F5E', fontWeight:500 }}>✓ Replied</span>}
                  </div>
                  <div style={{ fontSize:'0.78rem', color:'var(--stone)', marginBottom:3 }}>
                    {SUBJECTS[m.subject] || m.subject}
                    {m.phone && <span> · {m.phone}</span>}
                    {m.email && <span> · {m.email}</span>}
                  </div>
                  <div style={{ fontSize:'0.78rem', color:'var(--charcoal)', opacity:0.7 }}>
                    {m.message?.slice(0, 80)}{m.message?.length > 80 ? '...' : ''}
                  </div>
                </div>

                <div style={{ fontSize:'0.72rem', color:'var(--stone)', whiteSpace:'nowrap', marginTop:2 }}>
                  {new Date(m.created_at).toLocaleDateString('en-EG', { day:'numeric', month:'short' })}
                </div>
              </div>
            ))}
          </div>

          {/* Message detail */}
          {selected && (
            <div className="admin-contact-detail" style={{ background:'#fff', borderRadius:'var(--r)', border:'1px solid rgba(45,43,52,0.08)', padding:28, height:'fit-content', position:'sticky', top:'calc(var(--nav-h) + 24px)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
                <div>
                  <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.3rem', fontWeight:300, marginBottom:4 }}>{selected.name}</h3>
                  <p style={{ fontSize:'0.78rem', color:'var(--stone)' }}>{SUBJECTS[selected.subject] || selected.subject}</p>
                  <p style={{ fontSize:'0.72rem', color:'var(--stone)', marginTop:2 }}>
                    {new Date(selected.created_at).toLocaleString('en-EG', { day:'numeric', month:'long', hour:'2-digit', minute:'2-digit' })}
                  </p>
                </div>
                <button onClick={() => setSelected(null)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1.3rem', color:'var(--stone)' }}>×</button>
              </div>

              {/* Contact info */}
              <div style={{ background:'#F8F6F0', borderRadius:'var(--r)', padding:'14px 16px', marginBottom:20 }}>
                {selected.phone && <div style={{ fontSize:'0.85rem', marginBottom:4 }}>📞 {selected.phone}</div>}
                {selected.email && <div style={{ fontSize:'0.85rem' }}>✉ {selected.email}</div>}
                {!selected.phone && !selected.email && <div style={{ fontSize:'0.82rem', color:'var(--stone)' }}>No contact info provided</div>}
              </div>

              {/* Message */}
              <div style={{ marginBottom:24 }}>
                <p style={{ fontSize:'0.65rem', fontWeight:500, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--stone)', marginBottom:10 }}>Message</p>
                <p style={{ fontSize:'0.9rem', lineHeight:1.8, color:'var(--charcoal)', whiteSpace:'pre-wrap' }}>{selected.message}</p>
              </div>

              {/* Flag */}
              <div style={{ marginBottom:20 }}>
                <p style={{ fontSize:'0.65rem', fontWeight:500, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--stone)', marginBottom:10 }}>Flag</p>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {Object.entries(FLAGS).map(([key, val]) => (
                    <button key={key} onClick={() => setFlag(selected.id, selected.flag === key ? null : key)}
                      style={{ padding:'5px 12px', borderRadius:100, fontSize:'0.72rem', cursor:'pointer', border:'1px solid', fontFamily:'var(--font-body)', borderColor:selected.flag===key?val.color:'rgba(45,43,52,0.2)', background:selected.flag===key?`${val.color}15`:'transparent', color:selected.flag===key?val.color:'var(--charcoal)' }}>
                      {val.icon} {val.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {selected.phone && (
                  <a
                    href={`https://wa.me/${selected.phone.replace(/[^0-9]/g,'')}?text=Hi%20${encodeURIComponent(selected.name)}%2C%20thanks%20for%20reaching%20out%20to%20Cavero!%20`}
                    target="_blank" rel="noreferrer"
                    className="btn btn-bronze btn-sm btn-full"
                    style={{ textAlign:'center', display:'block' }}
                    onClick={() => markReplied(selected.id)}>
                    💬 Reply on WhatsApp
                  </a>
                )}
                {selected.email && (
                  <a
                    href={`mailto:${selected.email}?subject=Re: Your message to Cavero&body=Hi ${selected.name},%0A%0A`}
                    className="btn btn-outline btn-sm btn-full"
                    style={{ textAlign:'center', display:'block' }}
                    onClick={() => markReplied(selected.id)}>
                    ✉ Reply by email
                  </a>
                )}
                {!selected.replied && (
                  <button onClick={() => markReplied(selected.id)} className="btn btn-outline btn-sm btn-full">
                    ✓ Mark as replied
                  </button>
                )}

                {/* Block email */}
                {selected.email && (
                  blocking === selected.id ? (
                    <div style={{ border:'1px solid #FECACA', borderRadius:'var(--r)', padding:12, background:'#FEF2F2' }}>
                      <p style={{ fontSize:'0.72rem', color:'#991B1B', marginBottom:8 }}>Block {selected.email}?</p>
                      <input
                        type="text"
                        placeholder="Reason (optional)"
                        value={blockNote}
                        onChange={e => setBlockNote(e.target.value)}
                        style={{ width:'100%', padding:'8px 10px', border:'1px solid #FECACA', borderRadius:'var(--r)', fontSize:'0.82rem', marginBottom:8, fontFamily:'var(--font-body)', outline:'none' }}
                      />
                      <div style={{ display:'flex', gap:8 }}>
                        <button onClick={() => blockEmail(selected.email)} style={{ flex:1, padding:'8px', background:'#8B1A1A', color:'#fff', border:'none', borderRadius:'var(--r)', fontSize:'0.72rem', cursor:'pointer', fontFamily:'var(--font-body)' }}>Confirm block</button>
                        <button onClick={() => { setBlocking(null); setBlockNote('') }} style={{ flex:1, padding:'8px', background:'transparent', border:'1px solid rgba(45,43,52,0.2)', borderRadius:'var(--r)', fontSize:'0.72rem', cursor:'pointer', fontFamily:'var(--font-body)' }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setBlocking(selected.id)}
                      style={{ padding:'8px', background:'transparent', border:'1px solid #FECACA', borderRadius:'var(--r)', fontSize:'0.72rem', cursor:'pointer', color:'#991B1B', fontFamily:'var(--font-body)' }}>
                      ⊘ Block this email
                    </button>
                  )
                )}

                <button onClick={() => deleteMessage(selected.id)}
                  style={{ padding:'8px', background:'transparent', border:'1px solid rgba(45,43,52,0.15)', borderRadius:'var(--r)', fontSize:'0.72rem', cursor:'pointer', color:'var(--stone)', fontFamily:'var(--font-body)' }}>
                  Delete message
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}