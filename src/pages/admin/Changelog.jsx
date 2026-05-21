import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAdmin } from '@/context/AdminContext'
import AdminNav from '@/components/AdminNav'

const OWNER_EMAIL = 'omarhusam1711@gmail.com'

const ACTION_COLORS = {
  'Created':       '#6B8F5E',
  'Updated':       '#A8956F',
  'Deleted':       '#8B1A1A',
  'Changed':       '#2D2B34',
  'Generated':     '#6B8F5E',
  'Blocked':       '#8B1A1A',
}

function getActionColor(action) {
  const word = Object.keys(ACTION_COLORS).find(k => action.startsWith(k))
  return word ? ACTION_COLORS[word] : '#B8B5A8'
}

const TARGET_ICONS = {
  order:          '📦',
  product:        '◇',
  discount_code:  '🏷',
  category:       '◈',
  blocked_email:  '⊘',
}

export default function AdminChangelog() {
  const { user }       = useAdmin()
  const navigate       = useNavigate()
  const [logs,    setLogs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('all')
  const [search,  setSearch]  = useState('')

  // Redirect if not owner
  useEffect(() => {
    if (user && user.email !== OWNER_EMAIL) {
      navigate('/admin', { replace: true })
    }
  }, [user, navigate])

  useEffect(() => {
    if (!user || user.email !== OWNER_EMAIL) return
    load()
  }, [user])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)
    setLogs(data || [])
    setLoading(false)
  }

  // Get unique admin emails for filter
  const admins = [...new Set(logs.map(l => l.user_email))]

  const filtered = logs.filter(l => {
    const matchFilter = filter === 'all' || l.user_email === filter
    const matchSearch = !search.trim() ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.target_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.user_email.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  // Group by date
  const grouped = filtered.reduce((acc, log) => {
    const date = new Date(log.created_at).toLocaleDateString('en-EG', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
    if (!acc[date]) acc[date] = []
    acc[date].push(log)
    return acc
  }, {})

  if (!user || user.email !== OWNER_EMAIL) return null

  return (
    <div style={{ minHeight:'100vh', background:'#F8F6F0' }}>
      <AdminNav />
      <div style={{ maxWidth:1000, margin:'0 auto', padding:'40px 32px' }}>

        <div style={{ marginBottom:32 }}>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:'2rem', fontWeight:300 }}>Changelog</h1>
          <p style={{ color:'var(--stone)', fontSize:'0.85rem', marginTop:4 }}>Every admin action — who did what and when</p>
        </div>

        {/* Filters */}
        <div style={{ display:'flex', gap:12, marginBottom:24, alignItems:'center', flexWrap:'wrap' }}>
          <input
            type="text"
            placeholder="Search actions, products, names..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding:'9px 14px', border:'1px solid rgba(45,43,52,0.15)', borderRadius:'var(--r)', fontSize:'0.85rem', fontFamily:'var(--font-body)', outline:'none', width:280 }}
          />
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <button onClick={() => setFilter('all')}
              style={{ padding:'7px 16px', borderRadius:100, fontSize:'0.7rem', cursor:'pointer', border:'1px solid', fontFamily:'var(--font-body)', borderColor:filter==='all'?'var(--charcoal)':'rgba(45,43,52,0.2)', background:filter==='all'?'var(--charcoal)':'transparent', color:filter==='all'?'var(--cream)':'var(--charcoal)' }}>
              All ({logs.length})
            </button>
            {admins.map(email => (
              <button key={email} onClick={() => setFilter(email)}
                style={{ padding:'7px 16px', borderRadius:100, fontSize:'0.7rem', cursor:'pointer', border:'1px solid', fontFamily:'var(--font-body)', borderColor:filter===email?'var(--charcoal)':'rgba(45,43,52,0.2)', background:filter===email?'var(--charcoal)':'transparent', color:filter===email?'var(--cream)':'var(--charcoal)' }}>
                {email.split('@')[0]} ({logs.filter(l => l.user_email === email).length})
              </button>
            ))}
          </div>
          <button onClick={load} style={{ marginLeft:'auto', padding:'9px 16px', border:'1px solid rgba(45,43,52,0.2)', borderRadius:'var(--r)', fontSize:'0.72rem', cursor:'pointer', background:'transparent', fontFamily:'var(--font-body)' }}>
            ↻ Refresh
          </button>
        </div>

        {loading ? (
          <p style={{ color:'var(--stone)' }}>Loading...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 24px', color:'var(--stone)' }}>
            <p style={{ fontFamily:'var(--font-display)', fontSize:'1.5rem', fontWeight:300, marginBottom:8 }}>No actions yet</p>
            <p style={{ fontSize:'0.85rem' }}>Admin actions will appear here as your team uses the dashboard.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, dateLogs]) => (
            <div key={date} style={{ marginBottom:32 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                <span style={{ fontSize:'0.7rem', fontWeight:500, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--stone)' }}>{date}</span>
                <div style={{ flex:1, height:1, background:'rgba(45,43,52,0.08)' }} />
                <span style={{ fontSize:'0.7rem', color:'var(--stone)' }}>{dateLogs.length} action{dateLogs.length !== 1 ? 's' : ''}</span>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {dateLogs.map(log => (
                  <div key={log.id} style={{ background:'#fff', borderRadius:'var(--r)', border:'1px solid rgba(45,43,52,0.07)', padding:'16px 20px', display:'grid', gridTemplateColumns:'auto 1fr auto', gap:16, alignItems:'start' }}>

                    {/* Icon */}
                    <div style={{ width:36, height:36, borderRadius:'50%', background:`${getActionColor(log.action)}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem', flexShrink:0 }}>
                      {TARGET_ICONS[log.target_type] || '◈'}
                    </div>

                    {/* Content */}
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                        <span style={{ fontSize:'0.85rem', fontWeight:500, color: getActionColor(log.action) }}>{log.action}</span>
                        {log.target_name && (
                          <span style={{ fontSize:'0.82rem', color:'var(--charcoal)' }}>— {log.target_name}</span>
                        )}
                      </div>
                      <div style={{ fontSize:'0.75rem', color:'var(--stone)', display:'flex', gap:12, flexWrap:'wrap' }}>
                        <span style={{ fontWeight:500, color:'var(--charcoal)' }}>{log.user_email.split('@')[0]}</span>
                        <span>{log.user_email}</span>
                        {log.target_type && <span style={{ textTransform:'capitalize' }}>{log.target_type.replace('_', ' ')}</span>}
                      </div>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div style={{ marginTop:6, padding:'6px 10px', background:'#F8F6F0', borderRadius:'var(--r)', fontSize:'0.72rem', color:'var(--stone)', fontFamily:'monospace' }}>
                          {Object.entries(log.details).map(([k, v]) => (
                            <span key={k} style={{ marginRight:16 }}>
                              <span style={{ color:'var(--charcoal)' }}>{k}:</span> {String(v)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Time */}
                    <div style={{ fontSize:'0.72rem', color:'var(--stone)', whiteSpace:'nowrap', marginTop:2 }}>
                      {new Date(log.created_at).toLocaleTimeString('en-EG', { hour:'2-digit', minute:'2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}