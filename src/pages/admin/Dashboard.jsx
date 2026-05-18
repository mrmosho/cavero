import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { ORDER_STATUS } from '@/lib/constants'
import AdminNav from '@/components/AdminNav'

export function StatusBadge({ status }) {
  const s = ORDER_STATUS[status] || { label: status, color: 'var(--stone)' }
  return (
    <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:100, fontSize:'0.65rem', fontWeight:500, letterSpacing:'0.06em', background:`${s.color}18`, color:s.color }}>
      {s.label}
    </span>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [ordersRes, recentRes] = await Promise.all([
        supabase.from('orders').select('status, total, created_at'),
        supabase.from('orders').select('id, guest_name, guest_email, total, status, created_at').order('created_at', { ascending: false }).limit(8),
      ])
      const orders = ordersRes.data || []
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const week  = new Date(today); week.setDate(week.getDate() - 7)
      const month = new Date(today); month.setDate(1)
      const inRange = (d, from) => new Date(d) >= from
      setStats({
        totalOrders:  orders.length,
        todayOrders:  orders.filter(o => inRange(o.created_at, today)).length,
        weekRevenue:  orders.filter(o => inRange(o.created_at, week)  && o.status !== 'cancelled').reduce((s,o) => s+o.total, 0),
        monthRevenue: orders.filter(o => inRange(o.created_at, month) && o.status !== 'cancelled').reduce((s,o) => s+o.total, 0),
        byStatus: Object.keys(ORDER_STATUS).reduce((acc, k) => { acc[k] = orders.filter(o => o.status === k).length; return acc }, {}),
      })
      setRecentOrders(recentRes.data || [])
      setLoading(false)
    }
    load()
  }, [])

  const card = (label, value) => (
    <div key={label} style={{ background:'#fff', padding:24, borderRadius:'var(--r)', border:'1px solid rgba(45,43,52,0.08)' }}>
      <p style={{ fontSize:'0.68rem', fontWeight:500, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--stone)', marginBottom:12 }}>{label}</p>
      <p style={{ fontFamily:'var(--font-display)', fontSize:'2rem', fontWeight:300 }}>{value}</p>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#F8F6F0' }}>
      <AdminNav />
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'40px 32px' }}>
        <div style={{ marginBottom:36 }}>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:'2rem', fontWeight:300 }}>Dashboard</h1>
          <p style={{ color:'var(--stone)', fontSize:'0.85rem', marginTop:4 }}>{new Date().toLocaleDateString('en-EG', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
        </div>
        {loading ? <p style={{ color:'var(--stone)' }}>Loading...</p> : (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20, marginBottom:40 }}>
              {card('Total orders', stats.totalOrders)}
              {card('Orders today', stats.todayOrders)}
              {card('Revenue this week', `EGP ${stats.weekRevenue.toLocaleString()}`)}
              {card('Revenue this month', `EGP ${stats.monthRevenue.toLocaleString()}`)}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:24 }}>
              <div style={{ background:'#fff', borderRadius:'var(--r)', border:'1px solid rgba(45,43,52,0.08)', overflow:'hidden' }}>
                <div style={{ padding:'20px 24px', borderBottom:'1px solid rgba(45,43,52,0.08)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <h2 style={{ fontSize:'0.78rem', fontWeight:500, letterSpacing:'0.1em', textTransform:'uppercase' }}>Recent orders</h2>
                  <Link to="/admin/orders" style={{ fontSize:'0.72rem', color:'var(--bronze)', borderBottom:'1px solid var(--bronze)', paddingBottom:1 }}>View all</Link>
                </div>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom:'1px solid rgba(45,43,52,0.06)' }}>
                      {['Customer','Date','Total','Status'].map(h => (
                        <th key={h} style={{ padding:'10px 24px', textAlign:'left', fontSize:'0.65rem', fontWeight:500, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--stone)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map(o => (
                      <tr key={o.id} style={{ borderBottom:'1px solid rgba(45,43,52,0.05)', cursor:'pointer' }} onClick={() => window.location.href=`/admin/orders/${o.id}`}>
                        <td style={{ padding:'14px 24px' }}>
                          <div style={{ fontSize:'0.88rem' }}>{o.guest_name}</div>
                          <div style={{ fontSize:'0.75rem', color:'var(--stone)' }}>{o.guest_email}</div>
                        </td>
                        <td style={{ padding:'14px 24px', fontSize:'0.82rem', color:'var(--stone)' }}>{new Date(o.created_at).toLocaleDateString('en-EG')}</td>
                        <td style={{ padding:'14px 24px', fontSize:'0.88rem', fontWeight:500, color:'var(--bronze)' }}>EGP {o.total.toLocaleString()}</td>
                        <td style={{ padding:'14px 24px' }}><StatusBadge status={o.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ background:'#fff', borderRadius:'var(--r)', border:'1px solid rgba(45,43,52,0.08)', padding:'20px 24px' }}>
                <h2 style={{ fontSize:'0.78rem', fontWeight:500, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:20 }}>By status</h2>
                {Object.entries(ORDER_STATUS).map(([key, val]) => (
                  <div key={key} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid rgba(45,43,52,0.05)' }}>
                    <span style={{ fontSize:'0.82rem' }}>{val.label}</span>
                    <span style={{ fontFamily:'var(--font-display)', fontSize:'1.2rem', fontWeight:300 }}>{stats.byStatus[key] || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
