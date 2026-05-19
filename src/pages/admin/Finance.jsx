import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ORDER_STATUS } from '@/lib/constants'
import AdminNav from '@/components/AdminNav'

const REVENUE_STATUSES = ['paid','in_production','ready_to_ship','shipped','delivered']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function exportToCSV(orders, summary) {
  // Summary sheet
  const summaryRows = [
    ['CAVERO — Financial Report', '', `Generated: ${new Date().toLocaleDateString('en-EG')}`],
    [],
    ['SUMMARY'],
    ['Total Revenue (confirmed orders)', `EGP ${summary.totalRevenue.toLocaleString()}`],
    ['Total Orders', summary.totalOrders],
    ['Confirmed Orders', summary.confirmedOrders],
    ['Cancelled Orders', summary.cancelledOrders],
    ['Average Order Value', `EGP ${summary.aov.toLocaleString()}`],
    ['Total Discounts Given', `EGP ${summary.totalDiscounts.toLocaleString()}`],
    ['Total Shipping Collected', `EGP ${summary.totalShipping.toLocaleString()}`],
    [],
    ['ORDER DETAILS'],
    ['Order Ref','Date','Customer','Email','Phone','Governorate','Items','Subtotal (EGP)','Discount (EGP)','Shipping (EGP)','Total (EGP)','Status','Discount Code'],
  ]

  const orderRows = orders.map(o => {
    const addr  = o.shipping_address || {}
    const items = (o.order_items || []).map(i => `${i.product_name} x${i.qty}`).join(' | ')
    return [
      o.id.split('-')[0].toUpperCase(),
      new Date(o.created_at).toLocaleDateString('en-EG'),
      o.guest_name,
      o.guest_email,
      o.guest_phone,
      addr.governorate || '',
      items,
      o.subtotal || 0,
      o.discount_amount || 0,
      o.shipping || 0,
      o.total || 0,
      ORDER_STATUS[o.status]?.label || o.status,
      o.discount_code || '',
    ]
  })

  const allRows = [...summaryRows, ...orderRows]
  const csv = allRows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type:'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = `cavero-finance-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminFinance() {
  const [orders,    setOrders]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [dateRange, setDateRange] = useState({ from:'', to:'' })
  const [filtered,  setFiltered]  = useState([])

  useEffect(() => { load() }, [])

  useEffect(() => {
    let result = orders
    if (dateRange.from) result = result.filter(o => new Date(o.created_at) >= new Date(dateRange.from))
    if (dateRange.to)   result = result.filter(o => new Date(o.created_at) <= new Date(dateRange.to + 'T23:59:59'))
    setFiltered(result)
  }, [orders, dateRange])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(product_name, qty, unit_price)')
      .order('created_at', { ascending: false })
    setOrders(data || [])
    setFiltered(data || [])
    setLoading(false)
  }

  // ── Computed stats ────────────────────────────────────────
  const confirmed   = filtered.filter(o => REVENUE_STATUSES.includes(o.status))
  const cancelled   = filtered.filter(o => o.status === 'cancelled')
  const totalRev    = confirmed.reduce((s,o) => s + (o.total||0), 0)
  const totalDisc   = filtered.reduce((s,o) => s + (o.discount_amount||0), 0)
  const totalShip   = confirmed.reduce((s,o) => s + (o.shipping||0), 0)
  const aov         = confirmed.length > 0 ? Math.round(totalRev / confirmed.length) : 0

  // Monthly breakdown
  const now = new Date()
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const mo = d.getMonth()
    const yr = d.getFullYear()
    const monthOrders = confirmed.filter(o => {
      const od = new Date(o.created_at)
      return od.getMonth() === mo && od.getFullYear() === yr
    })
    return {
      label:   `${MONTHS[mo]} ${yr}`,
      revenue: monthOrders.reduce((s,o) => s + (o.total||0), 0),
      count:   monthOrders.length,
    }
  })

  // Product breakdown
  const productMap = {}
  confirmed.forEach(o => {
    (o.order_items||[]).forEach(item => {
      if (!productMap[item.product_name]) productMap[item.product_name] = { qty: 0, revenue: 0 }
      productMap[item.product_name].qty     += item.qty
      productMap[item.product_name].revenue += item.unit_price * item.qty
    })
  })
  const topProducts = Object.entries(productMap)
    .map(([name, d]) => ({ name, ...d }))
    .sort((a,b) => b.revenue - a.revenue)

  const summary = { totalRevenue: totalRev, totalOrders: filtered.length, confirmedOrders: confirmed.length, cancelledOrders: cancelled.length, aov, totalDiscounts: totalDisc, totalShipping: totalShip }

  const statCard = (label, value, sub) => (
    <div key={label} style={{ background:'#fff', padding:'22px 24px', borderRadius:'var(--r)', border:'1px solid rgba(45,43,52,0.08)' }}>
      <p style={{ fontSize:'0.65rem', fontWeight:500, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--stone)', marginBottom:8 }}>{label}</p>
      <p style={{ fontFamily:'var(--font-display)', fontSize:'1.8rem', fontWeight:300, marginBottom:sub?4:0 }}>{value}</p>
      {sub && <p style={{ fontSize:'0.72rem', color:'var(--stone)' }}>{sub}</p>}
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#F8F6F0' }}>
      <AdminNav />
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'40px 32px' }}>

        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:32 }}>
          <div>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:'2rem', fontWeight:300 }}>Finance</h1>
            <p style={{ color:'var(--stone)', fontSize:'0.85rem', marginTop:4 }}>Revenue from confirmed orders only (paid, in production, shipped, delivered)</p>
          </div>
          <div style={{ display:'flex', gap:10, alignItems:'flex-end' }}>
            <div>
              <label style={{ display:'block', fontSize:'0.65rem', fontWeight:500, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--stone)', marginBottom:6 }}>From</label>
              <input type="date" value={dateRange.from} onChange={e => setDateRange(p => ({ ...p, from:e.target.value }))}
                style={{ padding:'9px 12px', border:'1px solid rgba(45,43,52,0.2)', borderRadius:'var(--r)', fontSize:'0.85rem', fontFamily:'var(--font-body)', outline:'none' }} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'0.65rem', fontWeight:500, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--stone)', marginBottom:6 }}>To</label>
              <input type="date" value={dateRange.to} onChange={e => setDateRange(p => ({ ...p, to:e.target.value }))}
                style={{ padding:'9px 12px', border:'1px solid rgba(45,43,52,0.2)', borderRadius:'var(--r)', fontSize:'0.85rem', fontFamily:'var(--font-body)', outline:'none' }} />
            </div>
            {(dateRange.from || dateRange.to) && (
              <button onClick={() => setDateRange({ from:'', to:'' })} style={{ padding:'9px 16px', border:'1px solid rgba(45,43,52,0.2)', borderRadius:'var(--r)', fontSize:'0.78rem', cursor:'pointer', background:'transparent', fontFamily:'var(--font-body)' }}>Clear</button>
            )}
            <button onClick={() => exportToCSV(filtered, summary)} disabled={loading}
              style={{ padding:'10px 20px', borderRadius:'var(--r)', fontSize:'0.72rem', fontWeight:500, letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer', border:'none', background:'var(--charcoal)', color:'var(--cream)', fontFamily:'var(--font-body)' }}>
              ↓ Export to Excel
            </button>
          </div>
        </div>

        {loading ? <p style={{ color:'var(--stone)' }}>Loading...</p> : (
          <>
            {/* Key stats */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20, marginBottom:32 }}>
              {statCard('Total Revenue', `EGP ${totalRev.toLocaleString()}`, `From ${confirmed.length} confirmed orders`)}
              {statCard('Avg Order Value', `EGP ${aov.toLocaleString()}`, 'Confirmed orders only')}
              {statCard('Total Discounts', `EGP ${totalDisc.toLocaleString()}`, `Across all orders`)}
              {statCard('Shipping Collected', `EGP ${totalShip.toLocaleString()}`, 'From confirmed orders')}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:24 }}>

              {/* Monthly revenue */}
              <div style={{ background:'#fff', borderRadius:'var(--r)', border:'1px solid rgba(45,43,52,0.08)', padding:24 }}>
                <h3 style={{ fontSize:'0.72rem', fontWeight:500, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--stone)', marginBottom:20 }}>Monthly revenue (last 6 months)</h3>
                {monthlyData.map((m, i) => {
                  const max = Math.max(...monthlyData.map(x => x.revenue), 1)
                  return (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                      <span style={{ fontSize:'0.75rem', color:'var(--stone)', width:70, flexShrink:0 }}>{m.label}</span>
                      <div style={{ flex:1, height:28, background:'#F8F6F0', borderRadius:'var(--r)', overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${(m.revenue/max)*100}%`, background:'var(--bronze)', borderRadius:'var(--r)', minWidth: m.revenue > 0 ? 4 : 0, transition:'width .5s' }} />
                      </div>
                      <span style={{ fontSize:'0.78rem', fontWeight:500, width:100, textAlign:'right', flexShrink:0 }}>
                        {m.revenue > 0 ? `EGP ${m.revenue.toLocaleString()}` : '—'}
                      </span>
                      <span style={{ fontSize:'0.72rem', color:'var(--stone)', width:40, textAlign:'right', flexShrink:0 }}>{m.count} orders</span>
                    </div>
                  )
                })}
              </div>

              {/* Product breakdown */}
              <div style={{ background:'#fff', borderRadius:'var(--r)', border:'1px solid rgba(45,43,52,0.08)', padding:24 }}>
                <h3 style={{ fontSize:'0.72rem', fontWeight:500, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--stone)', marginBottom:20 }}>Revenue by product</h3>
                {topProducts.length === 0 ? (
                  <p style={{ color:'var(--stone)', fontSize:'0.85rem' }}>No confirmed orders yet.</p>
                ) : topProducts.map((p, i) => {
                  const max = topProducts[0].revenue
                  return (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                      <span style={{ fontSize:'0.78rem', color:'var(--charcoal)', width:140, flexShrink:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</span>
                      <div style={{ flex:1, height:28, background:'#F8F6F0', borderRadius:'var(--r)', overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${(p.revenue/max)*100}%`, background:'var(--charcoal)', borderRadius:'var(--r)', transition:'width .5s' }} />
                      </div>
                      <span style={{ fontSize:'0.78rem', fontWeight:500, width:90, textAlign:'right', flexShrink:0 }}>EGP {p.revenue.toLocaleString()}</span>
                      <span style={{ fontSize:'0.72rem', color:'var(--stone)', width:40, textAlign:'right', flexShrink:0 }}>{p.qty} sold</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Order status breakdown */}
            <div style={{ background:'#fff', borderRadius:'var(--r)', border:'1px solid rgba(45,43,52,0.08)', padding:24, marginBottom:24 }}>
              <h3 style={{ fontSize:'0.72rem', fontWeight:500, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--stone)', marginBottom:20 }}>Revenue by status</h3>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:16 }}>
                {REVENUE_STATUSES.map(s => {
                  const statusOrders = filtered.filter(o => o.status === s)
                  const rev = statusOrders.reduce((sum,o) => sum + (o.total||0), 0)
                  const info = ORDER_STATUS[s]
                  return (
                    <div key={s} style={{ padding:'16px 20px', background:'#F8F6F0', borderRadius:'var(--r)', borderLeft:`3px solid ${info.color}` }}>
                      <p style={{ fontSize:'0.65rem', fontWeight:500, letterSpacing:'0.1em', textTransform:'uppercase', color:info.color, marginBottom:8 }}>{info.label}</p>
                      <p style={{ fontFamily:'var(--font-display)', fontSize:'1.4rem', fontWeight:300, marginBottom:4 }}>EGP {rev.toLocaleString()}</p>
                      <p style={{ fontSize:'0.72rem', color:'var(--stone)' }}>{statusOrders.length} orders</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Pending orders warning */}
            {filtered.filter(o => o.status === 'pending_payment').length > 0 && (
              <div style={{ background:'rgba(168,149,111,0.08)', border:'1px solid rgba(168,149,111,0.3)', borderRadius:'var(--r)', padding:'16px 22px', marginBottom:24 }}>
                <p style={{ fontSize:'0.85rem', color:'var(--charcoal)' }}>
                  <strong>{filtered.filter(o => o.status === 'pending_payment').length} orders</strong> are still pending — revenue of <strong>EGP {filtered.filter(o => o.status === 'pending_payment').reduce((s,o) => s+(o.total||0),0).toLocaleString()}</strong> is not counted until orders are confirmed.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}