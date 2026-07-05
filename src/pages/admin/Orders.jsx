import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import AdminNav from '@/components/AdminNav'

const STATUS_COLORS = {
  pending_payment: '#A8956F',
  in_production:   '#C4873A',
  ready_to_ship:   '#2D2B34',
  shipped:         '#2D2B34',
  completed:       '#6B8F5E',
  cancelled:       '#8B1A1A',
}

export default function AdminOrders() {
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [status,  setStatus]  = useState('all')
  const [type,    setType]    = useState('all') // all | standard | custom
  const navigate = useNavigate()

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('id, guest_name, guest_email, guest_phone, status, total, created_at, order_type, custom_description, stl_file_url, order_items(product_name, qty)')
      .order('created_at', { ascending: false })
    setOrders(data || [])
    setLoading(false)
  }

  const filtered = orders.filter(o => {
    const matchSearch = !search.trim() ||
      o.guest_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.guest_email?.toLowerCase().includes(search.toLowerCase()) ||
      o.id?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = status === 'all' || o.status === status
    const matchType   = type   === 'all' || (type === 'custom' ? o.order_type === 'custom' : o.order_type !== 'custom')
    return matchSearch && matchStatus && matchType
  })

  const customCount = orders.filter(o => o.order_type === 'custom').length

  function exportToExcel() {
    const headers = ['Ref','Name','Email','Phone','Items','Total','Status','Type','Date','Custom Description','STL File']
    const rows = filtered.map(o => [
      '#' + o.id.slice(0,8).toUpperCase(),
      o.guest_name, o.guest_email || '', o.guest_phone || '',
      o.order_type === 'custom' ? 'Custom order' : (o.order_items||[]).map(i => `${i.product_name} x${i.qty}`).join(', '),
      o.total, o.status, o.order_type || 'standard',
      new Date(o.created_at).toLocaleDateString('en-EG'),
      o.custom_description || '',
      o.stl_file_url || '',
    ])
    const csv = [headers,...rows].map(r => r.map(v => `"${String(v||'').replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF'+csv], { type:'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `cavero-orders-${new Date().toISOString().split('T')[0]}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ minHeight:'100vh', background:'#F8F6F0' }}>
      <AdminNav />
      <div className="admin-page-content" style={{ maxWidth:1200, margin:'0 auto', padding:'40px 32px' }}>

        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:32 }}>
          <div>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:'2rem', fontWeight:300 }}>Orders</h1>
            <p style={{ color:'var(--stone)', fontSize:'0.85rem', marginTop:4 }}>
              {orders.length} total · {customCount} custom
            </p>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={load} style={{ padding:'10px 16px', border:'1px solid rgba(45,43,52,0.2)', borderRadius:'var(--r)', fontSize:'0.7rem', cursor:'pointer', background:'transparent', fontFamily:'var(--font-body)', letterSpacing:'0.08em', textTransform:'uppercase' }}>↻ Refresh</button>
            <button onClick={exportToExcel} style={{ padding:'10px 20px', borderRadius:'var(--r)', fontSize:'0.72rem', fontWeight:500, letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer', border:'none', background:'var(--charcoal)', color:'var(--cream)', fontFamily:'var(--font-body)' }}>↓ Export to Excel</button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display:'flex', gap:12, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
          <input
            type="text"
            placeholder="Search name, email, order ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding:'9px 14px', border:'1px solid rgba(45,43,52,0.15)', borderRadius:'var(--r)', fontSize:'0.85rem', fontFamily:'var(--font-body)', outline:'none', width:260 }}
          />

          {/* Type filter */}
          <div style={{ display:'flex', gap:6 }}>
            {[
              { key:'all',      label:'All orders' },
              { key:'standard', label:'Standard' },
              { key:'custom',   label:`✦ Custom (${customCount})` },
            ].map(f => (
              <button key={f.key} onClick={() => setType(f.key)}
                style={{ padding:'7px 14px', borderRadius:100, fontSize:'0.7rem', cursor:'pointer', border:'1px solid', fontFamily:'var(--font-body)', borderColor:type===f.key?'var(--bronze)':'rgba(45,43,52,0.2)', background:type===f.key?'rgba(168,149,111,0.1)':'transparent', color:type===f.key?'var(--bronze)':'var(--charcoal)' }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status filter */}
        <div style={{ display:'flex', gap:6, marginBottom:24, flexWrap:'wrap' }}>
          {['all','pending_payment','in_production','ready_to_ship','shipped','completed','cancelled'].map(s => (
            <button key={s} onClick={() => setStatus(s)}
              style={{ padding:'5px 12px', borderRadius:100, fontSize:'0.68rem', cursor:'pointer', border:'1px solid', fontFamily:'var(--font-body)', borderColor:status===s?'var(--charcoal)':'rgba(45,43,52,0.15)', background:status===s?'var(--charcoal)':'transparent', color:status===s?'var(--cream)':'var(--stone)', textTransform:'capitalize' }}>
              {s === 'all' ? 'All statuses' : s.replace(/_/g,' ')}
            </button>
          ))}
        </div>

        {/* Orders table */}
        {loading ? <p style={{ color:'var(--stone)' }}>Loading...</p> : (
          <div className="admin-table-wrap" style={{ background:'#fff', borderRadius:'var(--r)', border:'1px solid rgba(45,43,52,0.08)', overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid rgba(45,43,52,0.08)', background:'#FAFAF8' }}>
                  {['Ref','Customer','Items','Date','Total','Status',''].map(h => (
                    <th key={h} style={{ padding:'12px 20px', textAlign:'left', fontSize:'0.65rem', fontWeight:500, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--stone)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id} style={{ borderBottom:'1px solid rgba(45,43,52,0.05)', cursor:'pointer' }} onClick={() => navigate(`/admin/orders/${o.id}`)}>
                    <td style={{ padding:'14px 20px', fontSize:'0.78rem', fontFamily:'monospace', color:'var(--stone)' }}>
                      #{o.id.slice(0,8).toUpperCase()}
                    </td>
                    <td style={{ padding:'14px 20px' }}>
                      <div style={{ fontSize:'0.88rem', fontWeight:500 }}>{o.guest_name}</div>
                      <div style={{ fontSize:'0.72rem', color:'var(--stone)' }}>{o.guest_email || o.guest_phone}</div>
                    </td>
                    <td style={{ padding:'14px 20px', fontSize:'0.82rem', color:'var(--charcoal)', maxWidth:220 }}>
                      {o.order_type === 'custom' ? (
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <span style={{ background:'rgba(168,149,111,0.15)', color:'var(--bronze)', fontSize:'0.65rem', fontWeight:500, padding:'2px 8px', borderRadius:100, whiteSpace:'nowrap' }}>✦ Custom</span>
                          {o.stl_file_url && <span style={{ fontSize:'0.65rem', color:'var(--stone)' }}>+ STL</span>}
                          <span style={{ fontSize:'0.78rem', color:'var(--stone)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:120 }}>{o.custom_description?.slice(0,40)}...</span>
                        </div>
                      ) : (
                        (o.order_items||[]).map(i => `${i.product_name} ×${i.qty}`).join(', ')
                      )}
                    </td>
                    <td style={{ padding:'14px 20px', fontSize:'0.78rem', color:'var(--stone)', whiteSpace:'nowrap' }}>
                      {new Date(o.created_at).toLocaleDateString('en-EG', { day:'numeric', month:'short', year:'numeric' })}
                    </td>
                    <td style={{ padding:'14px 20px', fontSize:'0.88rem', fontWeight:500, color: o.order_type === 'custom' ? 'var(--stone)' : 'var(--bronze)', whiteSpace:'nowrap' }}>
                      {o.order_type === 'custom' ? 'TBD' : `EGP ${o.total?.toLocaleString()}`}
                    </td>
                    <td style={{ padding:'14px 20px' }}>
                      <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:100, fontSize:'0.65rem', fontWeight:500, background:`${STATUS_COLORS[o.status]}18`, color:STATUS_COLORS[o.status], whiteSpace:'nowrap', textTransform:'capitalize' }}>
                        {o.status?.replace(/_/g,' ')}
                      </span>
                    </td>
                    <td style={{ padding:'14px 20px', fontSize:'0.78rem', color:'var(--bronze)' }}>View →</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{ padding:'48px', textAlign:'center', color:'var(--stone)' }}>No orders found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}