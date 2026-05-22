import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { ORDER_STATUS } from '@/lib/constants'
import AdminNav from '@/components/AdminNav'
import { StatusBadge } from './Dashboard'

// ── Excel / CSV export ────────────────────────────────────
function exportToCSV(orders) {
  const headers = ['Order ID', 'Date', 'Customer Name', 'Email', 'Phone', 'Governorate', 'City', 'Address', 'Items', 'Subtotal (EGP)', 'Shipping (EGP)', 'Total (EGP)', 'Status', 'Payment', 'Notes']

  const rows = orders.map(o => {
    const addr = o.shipping_address || {}
    const items = (o.order_items || []).map(i => `${i.product_name} x${i.qty}${i.variant_name ? ` (${i.variant_name})` : ''}${i.personalisation_note ? ` [Note: ${i.personalisation_note}]` : ''}`).join(' | ')
    return [
      o.id.split('-')[0].toUpperCase(),
      new Date(o.created_at).toLocaleDateString('en-EG'),
      o.guest_name || '',
      o.guest_email || '',
      o.guest_phone || '',
      addr.governorate || '',
      addr.city || '',
      `${addr.line1 || ''}${addr.line2 ? ', ' + addr.line2 : ''}`,
      items,
      o.subtotal || 0,
      o.shipping || 0,
      o.total || 0,
      ORDER_STATUS[o.status]?.label || o.status,
      o.payment_method || 'cod',
      o.notes || '',
    ]
  })

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cavero-orders-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const navigate = useNavigate()

  const load = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('orders')
      .select('id, guest_name, guest_email, guest_phone, total, subtotal, shipping, status, created_at, payment_method, notes, shipping_address, order_items(product_name, qty, variant_name, personalisation_note)')
      .order('created_at', { ascending: false })
    if (filter !== 'all') query = query.eq('status', filter)
    const { data } = await query
    setOrders(data || [])
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  const filtered = search.trim()
    ? orders.filter(o =>
        o.guest_name?.toLowerCase().includes(search.toLowerCase()) ||
        o.guest_email?.toLowerCase().includes(search.toLowerCase()) ||
        o.guest_phone?.includes(search) ||
        o.id.includes(search.toLowerCase())
      )
    : orders

  async function handleExport() {
    setExporting(true)
    // Fetch full data for export including all fields
    let query = supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })
    if (filter !== 'all') query = query.eq('status', filter)
    const { data } = await query
    exportToCSV(data || [])
    setExporting(false)
  }

  const totalRevenue = filtered.reduce((s, o) => s + (o.total || 0), 0)

  return (
    <div style={{ minHeight: '100vh', background: '#F8F6F0' }}>
      <AdminNav />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 300 }}>Orders</h1>
            <p style={{ color: 'var(--stone)', fontSize: '0.85rem', marginTop: 4 }}>
              {filtered.length} orders · EGP {totalRevenue.toLocaleString()} total
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={load}
              style={{ padding: '10px 20px', borderRadius: 'var(--r)', fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', border: '1px solid rgba(45,43,52,0.2)', background: 'transparent', color: 'var(--charcoal)', fontFamily: 'var(--font-body)' }}>
              ↻ Refresh
            </button>
            <button
              onClick={handleExport}
              disabled={exporting || filtered.length === 0}
              style={{ padding: '10px 20px', borderRadius: 'var(--r)', fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', border: 'none', background: 'var(--charcoal)', color: 'var(--cream)', fontFamily: 'var(--font-body)', opacity: exporting ? 0.6 : 1 }}>
              {exporting ? 'Exporting...' : '↓ Export to Excel'}
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ marginBottom: 20 }}>
          <input
            type="text"
            placeholder="Search by name, email, phone, or order ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', maxWidth: 420, padding: '10px 16px', border: '1px solid rgba(45,43,52,0.15)', borderRadius: 'var(--r)', fontSize: '0.88rem', outline: 'none', fontFamily: 'var(--font-body)', color: 'var(--charcoal)', background: '#fff' }}
          />
        </div>

        {/* Status filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {[{ key: 'all', label: 'All' }, ...Object.entries(ORDER_STATUS).map(([k, v]) => ({ key: k, label: v.label }))].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{ padding: '7px 16px', borderRadius: 100, fontSize: '0.7rem', cursor: 'pointer', border: '1px solid', fontFamily: 'var(--font-body)', transition: 'all .15s', borderColor: filter === f.key ? 'var(--charcoal)' : 'rgba(45,43,52,0.2)', background: filter === f.key ? 'var(--charcoal)' : 'transparent', color: filter === f.key ? 'var(--cream)' : 'var(--charcoal)' }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: 'var(--r)', border: '1px solid rgba(45,43,52,0.08)', overflow: 'hidden' }}>
          {loading ? (
            <p style={{ padding: 32, color: 'var(--stone)' }}>Loading...</p>
          ) : filtered.length === 0 ? (
            <p style={{ padding: 32, color: 'var(--stone)', textAlign: 'center' }}>No orders found.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(45,43,52,0.08)', background: '#FAFAF8' }}>
                  {['Ref', 'Customer', 'Items', 'Date', 'Total', 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: '0.65rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--stone)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid rgba(45,43,52,0.05)', cursor: 'pointer', transition: 'background .15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FAFAF8'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                    onClick={() => navigate(`/admin/orders/${o.id}`)}>
                    <td style={{ padding: '14px 20px', fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--stone)' }}>
                      #{o.id.split('-')[0].toUpperCase()}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 500 }}>{o.guest_name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--stone)' }}>{o.guest_email}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--stone)' }}>{o.guest_phone}</div>
                    </td>
                    <td style={{ padding: '14px 20px', maxWidth: 220 }}>
                      {(o.order_items || []).map((item, i) => (
                        <div key={i} style={{ fontSize: '0.78rem', color: 'var(--charcoal)', lineHeight: 1.5 }}>
                          {item.product_name} <span style={{ color: 'var(--stone)' }}>×{item.qty}</span>
                          {item.personalisation_note && <span style={{ color: 'var(--bronze)', display: 'block', fontSize: '0.7rem' }}>✎ {item.personalisation_note}</span>}
                        </div>
                      ))}
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '0.82rem', color: 'var(--stone)', whiteSpace: 'nowrap' }}>
                      {new Date(o.created_at).toLocaleDateString('en-EG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '0.9rem', fontWeight: 500, color: 'var(--bronze)', whiteSpace: 'nowrap' }}>
                      EGP {o.total.toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <StatusBadge status={o.status} />
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--bronze)', borderBottom: '1px solid var(--bronze)', paddingBottom: 1 }}>View →</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p style={{ marginTop: 16, fontSize: '0.72rem', color: 'var(--stone)' }}>
          The Export to Excel button downloads a .csv file that opens directly in Excel with all order details, addresses, and items.
        </p>
      </div>
    </div>
  )
}