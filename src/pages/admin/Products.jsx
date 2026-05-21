import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import AdminNav from '@/components/AdminNav'
import { logAction } from '@/lib/audit'
import { useAdmin } from '@/context/AdminContext'

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { user }  = useAdmin()

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('products').select('*').order('sort_order', { ascending: true })
    setProducts(data || [])
    setLoading(false)
  }

  async function toggleAvailable(id, current) {
    await supabase.from('products').update({ available: !current }).eq('id', id)
    setProducts(prev => prev.map(p => p.id === id ? { ...p, available: !current } : p))
  }

  async function deleteProduct(id, name) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    await supabase.from('products').delete().eq('id', id)
    await logAction({ userEmail: user?.email, action: 'Deleted product', targetType:'product', targetId: id, targetName: name })
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div style={{ minHeight:'100vh', background:'#F8F6F0' }}>
      <AdminNav />
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'40px 32px' }}>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:32 }}>
          <div>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:'2rem', fontWeight:300 }}>Products</h1>
            <p style={{ color:'var(--stone)', fontSize:'0.85rem', marginTop:4 }}>{products.length} products</p>
          </div>
          <button className="btn btn-bronze" onClick={() => navigate('/admin/products/new')}>+ Add product</button>
        </div>
        {loading ? <p style={{ color:'var(--stone)' }}>Loading...</p> : (
          <div style={{ background:'#fff', borderRadius:'var(--r)', border:'1px solid rgba(45,43,52,0.08)', overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid rgba(45,43,52,0.08)' }}>
                  {['Product','Category','Price','Badge','Customisable','Available',''].map(h => (
                    <th key={h} style={{ padding:'12px 20px', textAlign:'left', fontSize:'0.65rem', fontWeight:500, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--stone)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} style={{ borderBottom:'1px solid rgba(45,43,52,0.05)' }}>
                    <td style={{ padding:'14px 20px' }}>
                      <div style={{ fontSize:'0.9rem' }}>{p.name}</div>
                      <div style={{ fontSize:'0.72rem', color:'var(--stone)', fontFamily:'monospace' }}>{p.slug}</div>
                    </td>
                    <td style={{ padding:'14px 20px', fontSize:'0.82rem', color:'var(--stone)', textTransform:'capitalize' }}>{p.category}</td>
                    <td style={{ padding:'14px 20px', fontSize:'0.88rem', fontWeight:500, color:'var(--bronze)' }}>EGP {p.price.toLocaleString()}</td>
                    <td style={{ padding:'14px 20px' }}>
                      {p.badge && <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:100, fontSize:'0.62rem', fontWeight:500, background:p.badge==='new'?'var(--charcoal)':'var(--bronze)', color:'#fff' }}>{p.badge}</span>}
                    </td>
                    <td style={{ padding:'14px 20px', fontSize:'0.78rem', color:p.customisable?'var(--bronze)':'var(--stone)' }}>{p.customisable?'Yes':'No'}</td>
                    <td style={{ padding:'14px 20px' }}>
                      <button onClick={() => toggleAvailable(p.id, p.available)}
                        style={{ width:44, height:24, borderRadius:100, border:'none', cursor:'pointer', background:p.available?'var(--bronze)':'rgba(45,43,52,0.15)', position:'relative', transition:'background .2s' }}>
                        <span style={{ position:'absolute', top:3, width:18, height:18, borderRadius:'50%', background:'#fff', transition:'left .2s', left:p.available?23:3 }} />
                      </button>
                    </td>
                    <td style={{ padding:'14px 20px' }}>
                      <div style={{ display:'flex', gap:12 }}>
                        <button onClick={() => navigate(`/admin/products/${p.id}`)} style={{ fontSize:'0.72rem', color:'var(--bronze)', background:'none', border:'none', borderBottom:'1px solid var(--bronze)', cursor:'pointer', paddingBottom:1 }}>Edit</button>
                        <button onClick={() => deleteProduct(p.id, p.name)} style={{ fontSize:'0.72rem', color:'#EF4444', background:'none', border:'none', borderBottom:'1px solid #EF4444', cursor:'pointer', paddingBottom:1 }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}