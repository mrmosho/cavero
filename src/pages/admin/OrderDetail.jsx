import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAdmin } from '@/context/AdminContext'
import { logAction } from '@/lib/audit'
import AdminNav from '@/components/AdminNav'

const STATUSES = ['pending_payment','in_production','ready_to_ship','shipped','completed','cancelled']
const STATUS_LABELS = { pending_payment:'Order Placed', in_production:'In Production', ready_to_ship:'Ready to Ship', shipped:'Shipped', completed:'Completed', cancelled:'Cancelled' }
const STATUS_COLORS = { pending_payment:'#A8956F', in_production:'#C4873A', ready_to_ship:'#2D2B34', shipped:'#2D2B34', completed:'#6B8F5E', cancelled:'#8B1A1A' }

function Section({ title, children }) {
  return (
    <div style={{ background:'#fff', borderRadius:'var(--r)', border:'1px solid rgba(45,43,52,0.08)', padding:24, marginBottom:16 }}>
      <p style={{ fontSize:'0.65rem', fontWeight:500, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--stone)', marginBottom:16 }}>{title}</p>
      {children}
    </div>
  )
}

export default function AdminOrderDetail() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const { user }     = useAdmin()
  const [order,  setOrder]  = useState(null)
  const [saving, setSaving] = useState(false)
  const [loading,setLoading]= useState(true)

  useEffect(() => { load() }, [id])

  async function load() {
    const { data } = await supabase.from('orders').select('*, order_items(*)').eq('id', id).single()
    setOrder(data)
    setLoading(false)
  }

  async function updateStatus(newStatus) {
    setSaving(true)
    const { data } = await supabase.from('orders').update({ status: newStatus }).eq('id', id).select('*, order_items(*)').single()
    if (data) {
      await logAction({ userEmail: user?.email, action: `Changed order status to "${newStatus}"`, targetType:'order', targetId: id, targetName: order?.guest_name, details: { from: order?.status, to: newStatus } })
      setOrder(data)
    }
    setSaving(false)
  }

  async function deleteOrder() {
    if (!confirm('Permanently delete this order?')) return
    if (!confirm('Are you sure? This cannot be undone.')) return
    await logAction({ userEmail: user?.email, action: 'Deleted order', targetType:'order', targetId: id, targetName: order?.guest_name, details: { total: order?.total, status: order?.status } })
    await supabase.from('orders').delete().eq('id', id)
    navigate('/admin/orders')
  }

  if (loading) return <div style={{ minHeight:'100vh', background:'#F8F6F0' }}><AdminNav /><p style={{ padding:40, color:'var(--stone)' }}>Loading...</p></div>
  if (!order)  return <div style={{ minHeight:'100vh', background:'#F8F6F0' }}><AdminNav /><p style={{ padding:40, color:'var(--stone)' }}>Order not found.</p></div>

  const isCustom = order.order_type === 'custom'

  return (
    <div style={{ minHeight:'100vh', background:'#F8F6F0' }}>
      <AdminNav />
      <div className="admin-page-content" style={{ maxWidth:1100, margin:'0 auto', padding:'40px 32px' }}>

        <div style={{ marginBottom:32 }}>
          <button onClick={() => navigate('/admin/orders')} style={{ fontSize:'0.72rem', color:'var(--stone)', background:'none', border:'none', cursor:'pointer', marginBottom:12 }}>← Back to orders</button>
          <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:'1.8rem', fontWeight:300 }}>
              #{id.slice(0,8).toUpperCase()}
            </h1>
            {isCustom && (
              <span style={{ background:'rgba(168,149,111,0.15)', color:'var(--bronze)', fontSize:'0.7rem', fontWeight:500, padding:'4px 12px', borderRadius:100 }}>✦ Custom Order</span>
            )}
            <span style={{ display:'inline-block', padding:'4px 12px', borderRadius:100, fontSize:'0.7rem', fontWeight:500, background:`${STATUS_COLORS[order.status]}18`, color:STATUS_COLORS[order.status], textTransform:'capitalize' }}>
              {order.status?.replace(/_/g,' ')}
            </span>
          </div>
          <p style={{ color:'var(--stone)', fontSize:'0.82rem', marginTop:6 }}>
            {new Date(order.created_at).toLocaleDateString('en-EG', { weekday:'long', day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })}
          </p>
        </div>

        <div className="admin-order-grid" style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:24 }}>

          {/* Left */}
          <div>
            {/* Custom order details */}
            {isCustom && (
              <Section title="Custom order details">
                <p style={{ fontSize:'0.9rem', lineHeight:1.8, color:'var(--charcoal)', whiteSpace:'pre-wrap', marginBottom: order.stl_file_url ? 16 : 0 }}>
                  {order.custom_description || 'No description provided.'}
                </p>
                {order.stl_file_url && (
                  <a href={order.stl_file_url} target="_blank" rel="noreferrer"
                    style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 18px', background:'var(--charcoal)', color:'var(--cream)', borderRadius:'var(--r)', fontSize:'0.75rem', fontWeight:500, letterSpacing:'0.08em', textTransform:'uppercase', textDecoration:'none' }}>
                    ↓ Download STL / 3D File
                  </a>
                )}
              </Section>
            )}

            {/* Order items — for standard orders */}
            {!isCustom && (
              <Section title="Order items">
                {(order.order_items||[]).map(item => (
                  <div key={item.id} style={{ display:'flex', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid rgba(45,43,52,0.06)' }}>
                    <div>
                      <div style={{ fontSize:'0.9rem' }}>{item.product_name}</div>
                      {item.variant_name && <div style={{ fontSize:'0.75rem', color:'var(--stone)', marginTop:2 }}>{item.variant_name}</div>}
                      {item.personalisation_note && <div style={{ fontSize:'0.75rem', color:'var(--bronze)', marginTop:2 }}>Note: {item.personalisation_note}</div>}
                      <div style={{ fontSize:'0.75rem', color:'var(--stone)', marginTop:2 }}>Qty: {item.qty}</div>
                    </div>
                    <div style={{ fontSize:'0.9rem', fontWeight:500, color:'var(--bronze)' }}>EGP {(item.unit_price*item.qty).toLocaleString()}</div>
                  </div>
                ))}
                <div style={{ paddingTop:12, display:'flex', flexDirection:'column', gap:6 }}>
                  {[['Subtotal', `EGP ${order.subtotal?.toLocaleString()}`], ['Shipping', order.shipping===0?'Free':`EGP ${order.shipping}`]].map(([l,v]) => (
                    <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:'0.85rem', color:'var(--stone)' }}><span>{l}</span><span>{v}</span></div>
                  ))}
                  {order.discount_amount > 0 && (
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.85rem', color:'#16A34A' }}><span>Discount ({order.discount_code})</span><span>− EGP {order.discount_amount}</span></div>
                  )}
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'1rem', fontWeight:600, paddingTop:8, borderTop:'1px solid rgba(45,43,52,0.1)', marginTop:4 }}><span>Total</span><span>EGP {order.total?.toLocaleString()}</span></div>
                </div>
              </Section>
            )}

            {/* Customer */}
            <Section title="Customer">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                {[['Name', order.guest_name], ['Email', order.guest_email], ['Phone', order.guest_phone], ['Payment', 'Cash on delivery']].map(([l,v]) => v ? (
                  <div key={l}><p style={{ fontSize:'0.65rem', fontWeight:500, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--stone)', marginBottom:4 }}>{l}</p><p style={{ fontSize:'0.88rem' }}>{v}</p></div>
                ) : null)}
              </div>
            </Section>

            {/* Shipping address */}
            {order.shipping_address && (
              <Section title="Shipping address">
                <p style={{ fontSize:'0.9rem', lineHeight:1.8 }}>
                  {order.shipping_address.name}<br/>
                  {order.shipping_address.line1}{order.shipping_address.line2 ? `, ${order.shipping_address.line2}` : ''}<br/>
                  {order.shipping_address.city}, {order.shipping_address.governorate}
                  {order.shipping_address.postal_code && <>, {order.shipping_address.postal_code}</>}
                </p>
              </Section>
            )}

            {order.notes && (
              <Section title="Order notes">
                <p style={{ fontSize:'0.9rem', lineHeight:1.7, color:'var(--stone)' }}>{order.notes}</p>
              </Section>
            )}
          </div>

          {/* Right sidebar */}
          <div className="admin-order-sidebar">
            <Section title="Update status">
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {STATUSES.map(s => (
                  <button key={s} onClick={() => updateStatus(s)} disabled={saving || order.status===s}
                    style={{ padding:'10px 14px', borderRadius:'var(--r)', border:'1px solid', fontSize:'0.78rem', cursor:order.status===s?'default':'pointer', fontFamily:'var(--font-body)', textAlign:'left', fontWeight: order.status===s?600:400, background:order.status===s?`${STATUS_COLORS[s]}12`:'transparent', color:order.status===s?STATUS_COLORS[s]:'var(--charcoal)', borderColor:order.status===s?STATUS_COLORS[s]:'rgba(45,43,52,0.15)', textTransform:'capitalize' }}>
                    {order.status===s && '● '}{STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </Section>

            {isCustom && (
              <Section title="Custom order price">
                <p style={{ fontSize:'0.78rem', color:'var(--stone)', lineHeight:1.6, marginBottom:12 }}>
                  Once you've reviewed the request, update the order total directly in Supabase and notify the customer via WhatsApp.
                </p>
                {order.guest_phone && (
                  <a href={`https://wa.me/${order.guest_phone.replace(/[^0-9]/g,'')}?text=Hi%20${encodeURIComponent(order.guest_name)}%2C%20your%20custom%20order%20quote%20is%20ready!%20`}
                    target="_blank" rel="noreferrer"
                    style={{ display:'block', textAlign:'center', padding:'10px', background:'#25D366', color:'#fff', borderRadius:'var(--r)', fontSize:'0.75rem', fontWeight:500, letterSpacing:'0.06em', textTransform:'uppercase', textDecoration:'none' }}>
                    💬 WhatsApp customer
                  </a>
                )}
              </Section>
            )}

            <Section title="Actions">
              <button onClick={deleteOrder} style={{ width:'100%', padding:'10px', background:'transparent', border:'1px solid #FECACA', borderRadius:'var(--r)', fontSize:'0.72rem', cursor:'pointer', color:'#991B1B', fontFamily:'var(--font-body)' }}>
                Delete order
              </button>
            </Section>
          </div>
        </div>
      </div>
    </div>
  )
}