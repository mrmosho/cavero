import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { ORDER_STATUS } from '@/lib/constants'
import AdminNav from '@/components/AdminNav'
import { useAdmin } from '@/context/AdminContext'
import { logAction } from '@/lib/audit'
import { StatusBadge } from './Dashboard'

export default function AdminOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [bosta, setBosta] = useState({ loading:false, done:false, error:null })

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('orders').select('*, order_items(*)').eq('id', id).single()
      setOrder(data)
      setLoading(false)
    }
    load()
  }, [id])

  async function updateStatus(newStatus) {
    setSaving(true)
    const { data } = await supabase.from('orders').update({ status: newStatus }).eq('id', id).select('*, order_items(*)').single()
    if (data) {
      setOrder(data)
      await logAction({ userEmail: user?.email, action: `Changed order status to "${newStatus}"`, targetType:'order', targetId: id, targetName: order?.guest_name, details: { from: order?.status, to: newStatus } })
    }
    setSaving(false)
  }

  async function deleteOrder() {
    if (!confirm('Permanently delete this order? This cannot be undone.')) return
    if (!confirm('Are you sure? All order items will also be deleted.')) return
    const { error } = await supabase.from('orders').delete().eq('id', id)
    if (error) { alert('Failed to delete: ' + error.message); return }
    await logAction({ userEmail: user?.email, action: 'Deleted order', targetType:'order', targetId: id, targetName: order?.guest_name, details: { total: order?.total, status: order?.status } })
    navigate('/admin/orders')
  }

  async function createBostaShipment() {
    setBosta({ loading:true, done:false, error:null })
    try {
      const { data, error } = await supabase.functions.invoke('create-bosta-shipment', { body: { order_id: id } })
      if (error) throw new Error(error.message)
      setBosta({ loading:false, done:true, error:null })
      const { data: refreshed } = await supabase.from('orders').select('*, order_items(*)').eq('id', id).single()
      if (refreshed) setOrder(refreshed)
    } catch (err) {
      setBosta({ loading:false, done:false, error:err.message })
    }
  }

  if (loading) return <div style={{ minHeight:'100vh', background:'#F8F6F0' }}><AdminNav /><p style={{ padding:40, color:'var(--stone)' }}>Loading...</p></div>
  if (!order)  return <div style={{ minHeight:'100vh', background:'#F8F6F0' }}><AdminNav /><p style={{ padding:40, color:'var(--stone)' }}>Order not found.</p></div>

  const addr = order.shipping_address || {}
  const items = order.order_items || []

  return (
    <div style={{ minHeight:'100vh', background:'#F8F6F0' }}>
      <AdminNav />
      <div style={{ maxWidth:1000, margin:'0 auto', padding:'40px 32px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:32 }}>
          <div>
            <button onClick={() => navigate('/admin/orders')} style={{ fontSize:'0.72rem', color:'var(--stone)', background:'none', border:'none', cursor:'pointer', marginBottom:12 }}>← Back to orders</button>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:'1.8rem', fontWeight:300 }}>Order #{order.id.split('-')[0].toUpperCase()}</h1>
            <p style={{ color:'var(--stone)', fontSize:'0.82rem', marginTop:4 }}>{new Date(order.created_at).toLocaleString('en-EG')}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:24 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <Section title="Items">
              {items.map(item => (
                <div key={item.id} style={{ display:'flex', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid rgba(45,43,52,0.07)' }}>
                  <div>
                    <div style={{ fontSize:'0.9rem' }}>{item.product_name}</div>
                    {item.variant_name && <div style={{ fontSize:'0.75rem', color:'var(--stone)', marginTop:2 }}>{item.variant_name}</div>}
                    {item.personalisation_note && <div style={{ fontSize:'0.75rem', color:'var(--bronze)', marginTop:4, fontStyle:'italic' }}>Note: "{item.personalisation_note}"</div>}
                    <div style={{ fontSize:'0.75rem', color:'var(--stone)', marginTop:2 }}>Qty: {item.qty}</div>
                  </div>
                  <div style={{ fontSize:'0.9rem', fontWeight:500, color:'var(--bronze)', marginLeft:16 }}>EGP {(item.unit_price*item.qty).toLocaleString()}</div>
                </div>
              ))}
              <div style={{ paddingTop:14 }}>
                {[['Subtotal',`EGP ${order.subtotal?.toLocaleString()}`],['Shipping',order.shipping===0?'Free':`EGP ${order.shipping}`]].map(([l,v]) => (
                  <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:'0.82rem', color:'var(--stone)', padding:'4px 0' }}><span>{l}</span><span>{v}</span></div>
                ))}
                <div style={{ display:'flex', justifyContent:'space-between', fontWeight:500, paddingTop:8, borderTop:'1px solid rgba(45,43,52,0.08)', marginTop:4 }}>
                  <span>Total</span><span style={{ color:'var(--bronze)' }}>EGP {order.total?.toLocaleString()}</span>
                </div>
              </div>
            </Section>
            <Section title="Customer">
              <Row label="Name"  value={order.guest_name} />
              <Row label="Email" value={<a href={`mailto:${order.guest_email}`} style={{ color:'var(--bronze)' }}>{order.guest_email}</a>} />
              <Row label="Phone" value={<a href={`tel:${order.guest_phone}`}    style={{ color:'var(--bronze)' }}>{order.guest_phone}</a>} />
              {order.payment_method && <Row label="Payment" value={order.payment_method} />}
              {order.paymob_txn_id  && <Row label="Paymob TXN" value={order.paymob_txn_id} mono />}
            </Section>
            <Section title="Delivery address">
              <Row label="Name"    value={addr.name} />
              <Row label="Address" value={`${addr.line1}${addr.line2?', '+addr.line2:''}`} />
              <Row label="City"    value={`${addr.city}, ${addr.governorate}`} />
              {addr.phone && <Row label="Phone" value={addr.phone} />}
            </Section>
            {order.bosta_tracking_no ? (
              <Section title="Shipping">
                <Row label="Bosta tracking" value={order.bosta_tracking_no} mono />
                {order.bosta_shipment_id && <Row label="Shipment ID" value={order.bosta_shipment_id} mono />}
              </Section>
            ) : order.status === 'ready_to_ship' && (
              <Section title="Shipping">
                {bosta.error && <p style={{ fontSize:'0.82rem', color:'#EF4444', marginBottom:12 }}>{bosta.error}</p>}
                {bosta.done ? <p style={{ fontSize:'0.85rem', color:'#16A34A' }}>Shipment created successfully.</p> : (
                  <button className="btn btn-bronze" style={{ width:'100%' }} onClick={createBostaShipment} disabled={bosta.loading}>
                    {bosta.loading ? 'Creating shipment...' : 'Create Bosta shipment →'}
                  </button>
                )}
              </Section>
            )}
            {order.notes && <Section title="Order notes"><p style={{ fontSize:'0.88rem', lineHeight:1.7 }}>{order.notes}</p></Section>}
          </div>
          <div>
            <Section title="Update status">
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {Object.entries(ORDER_STATUS).map(([key, val]) => (
                  <button key={key} onClick={() => updateStatus(key)} disabled={saving || order.status===key}
                    style={{ padding:'10px 16px', borderRadius:'var(--r)', fontSize:'0.78rem', cursor:order.status===key?'default':'pointer', border:'1px solid', fontFamily:'var(--font-body)', textAlign:'left', transition:'all .2s', borderColor:order.status===key?val.color:'rgba(45,43,52,0.15)', background:order.status===key?`${val.color}15`:'#fff', color:order.status===key?val.color:'var(--charcoal)', opacity:saving?0.5:1 }}>
                    {order.status===key?'✓ ':''}{val.label}
                  </button>
                ))}
              </div>
            </Section>
            <div style={{ marginTop:16, padding:16, background:'#fff', borderRadius:'var(--r)', border:'1px solid rgba(45,43,52,0.08)' }}>
              <p style={{ fontSize:'0.65rem', fontWeight:500, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--stone)', marginBottom:12 }}>Quick contact</p>
              <a href={`mailto:${order.guest_email}`} className="btn btn-outline btn-sm btn-full" style={{ marginBottom:8, display:'block', textAlign:'center' }}>Email customer</a>
              <a href={`https://wa.me/${order.guest_phone?.replace(/[^0-9]/g,'')}`} target="_blank" rel="noreferrer" className="btn btn-bronze btn-sm btn-full" style={{ display:'block', textAlign:'center' }}>WhatsApp</a>
            </div>
            <div style={{ marginTop:16, padding:16, background:'#FEF2F2', borderRadius:'var(--r)', border:'1px solid #FECACA' }}>
              <p style={{ fontSize:'0.65rem', fontWeight:500, letterSpacing:'0.1em', textTransform:'uppercase', color:'#991B1B', marginBottom:12 }}>Danger zone</p>
              <button onClick={deleteOrder} style={{ width:'100%', padding:'10px', background:'#8B1A1A', color:'#fff', border:'none', borderRadius:'var(--r)', fontSize:'0.72rem', fontWeight:500, letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer', fontFamily:'var(--font-body)' }}>
                Delete order
              </button>
              <p style={{ fontSize:'0.7rem', color:'#991B1B', marginTop:8, lineHeight:1.5 }}>Permanently removes this order and all its items.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ background:'#fff', borderRadius:'var(--r)', border:'1px solid rgba(45,43,52,0.08)', padding:'20px 24px' }}>
      <p style={{ fontSize:'0.65rem', fontWeight:500, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--stone)', marginBottom:16 }}>{title}</p>
      {children}
    </div>
  )
}

function Row({ label, value, mono=false }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'7px 0', borderBottom:'1px solid rgba(45,43,52,0.05)' }}>
      <span style={{ fontSize:'0.78rem', color:'var(--stone)', flexShrink:0, marginRight:16 }}>{label}</span>
      <span style={{ fontSize:mono?'0.72rem':'0.85rem', fontFamily:mono?'monospace':'inherit', textAlign:'right', wordBreak:'break-all' }}>{value}</span>
    </div>
  )
}