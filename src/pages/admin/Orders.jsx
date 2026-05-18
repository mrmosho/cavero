import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { ORDER_STATUS } from '@/lib/constants'
import AdminNav from '@/components/AdminNav'
import { StatusBadge } from './Dashboard'

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      setLoading(true)
      let query = supabase.from('orders').select('id,guest_name,guest_email,guest_phone,total,status,created_at,payment_method').order('created_at', { ascending: false })
      if (filter !== 'all') query = query.eq('status', filter)
      const { data } = await query
      setOrders(data || [])
      setLoading(false)
    }
    load()
  }, [filter])

  return (
    <div style={{ minHeight:'100vh', background:'#F8F6F0' }}>
      <AdminNav />
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'40px 32px' }}>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:32 }}>
          <div>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:'2rem', fontWeight:300 }}>Orders</h1>
            <p style={{ color:'var(--stone)', fontSize:'0.85rem', marginTop:4 }}>{orders.length} orders</p>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, marginBottom:24, flexWrap:'wrap' }}>
          {[{ key:'all', label:'All' }, ...Object.entries(ORDER_STATUS).map(([k,v]) => ({ key:k, label:v.label }))].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{ padding:'7px 16px', borderRadius:100, fontSize:'0.7rem', cursor:'pointer', border:'1px solid', fontFamily:'var(--font-body)', borderColor:filter===f.key?'var(--charcoal)':'rgba(45,43,52,0.2)', background:filter===f.key?'var(--charcoal)':'transparent', color:filter===f.key?'var(--cream)':'var(--charcoal)' }}>
              {f.label}
            </button>
          ))}
        </div>
        <div style={{ background:'#fff', borderRadius:'var(--r)', border:'1px solid rgba(45,43,52,0.08)', overflow:'hidden' }}>
          {loading ? <p style={{ padding:32, color:'var(--stone)' }}>Loading...</p> : orders.length === 0 ? <p style={{ padding:32, color:'var(--stone)', textAlign:'center' }}>No orders found.</p> : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid rgba(45,43,52,0.08)' }}>
                  {['Customer','Date','Total','Payment','Status',''].map(h => (
                    <th key={h} style={{ padding:'12px 20px', textAlign:'left', fontSize:'0.65rem', fontWeight:500, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--stone)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} style={{ borderBottom:'1px solid rgba(45,43,52,0.05)' }}>
                    <td style={{ padding:'14px 20px' }}>
                      <div style={{ fontSize:'0.88rem' }}>{o.guest_name}</div>
                      <div style={{ fontSize:'0.72rem', color:'var(--stone)' }}>{o.guest_email}</div>
                      <div style={{ fontSize:'0.72rem', color:'var(--stone)' }}>{o.guest_phone}</div>
                    </td>
                    <td style={{ padding:'14px 20px', fontSize:'0.82rem', color:'var(--stone)' }}>{new Date(o.created_at).toLocaleDateString('en-EG')}</td>
                    <td style={{ padding:'14px 20px', fontSize:'0.9rem', fontWeight:500, color:'var(--bronze)' }}>EGP {o.total.toLocaleString()}</td>
                    <td style={{ padding:'14px 20px', fontSize:'0.78rem', color:'var(--stone)', textTransform:'capitalize' }}>{o.payment_method || '—'}</td>
                    <td style={{ padding:'14px 20px' }}><StatusBadge status={o.status} /></td>
                    <td style={{ padding:'14px 20px' }}>
                      <button onClick={() => navigate(`/admin/orders/${o.id}`)} style={{ fontSize:'0.72rem', color:'var(--bronze)', background:'none', border:'none', borderBottom:'1px solid var(--bronze)', cursor:'pointer', paddingBottom:1 }}>View →</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
