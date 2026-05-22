import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AdminNav from '@/components/AdminNav'
import { logAction } from '@/lib/audit'
import { useAdmin } from '@/context/AdminContext'

const inp = { width:'100%', padding:'11px 14px', border:'1px solid rgba(45,43,52,0.2)', borderRadius:'var(--r)', fontSize:'0.9rem', color:'var(--charcoal)', background:'#fff', outline:'none', fontFamily:'var(--font-body)' }
const lbl = { display:'block', fontSize:'0.68rem', fontWeight:500, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--stone)', marginBottom:7 }

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [showForm,   setShowForm]   = useState(false)
  const [editing,    setEditing]    = useState(null) // category id being edited
  const [newCat,     setNewCat]     = useState({ key:'', label:'', sort_order:'' })
  const [editForm,   setEditForm]   = useState({})
  const [error,      setError]      = useState(null)
  const [saving,     setSaving]     = useState(false)
  const { user }                       = useAdmin()

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
    setCategories(data || [])
    setLoading(false)
  }

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const { error: err } = await supabase.from('categories').insert({
      key:        newCat.key.toLowerCase().trim().replace(/\s+/g, '_'),
      label:      newCat.label.trim(),
      sort_order: parseInt(newCat.sort_order) || categories.length + 1,
      active:     true,
    })
    setSaving(false)
    if (err?.code === '23505') { setError('A category with this key already exists.'); return }
    if (err) { setError(err.message); return }
    await logAction({ userEmail: user?.email, action: 'Created category', targetType:'category', targetName: newCat.label, details: { key: newCat.key } })
    setNewCat({ key:'', label:'', sort_order:'' })
    setShowForm(false)
    load()
  }

  async function handleEdit(cat) {
    setEditing(cat.id)
    setEditForm({ label: cat.label, sort_order: String(cat.sort_order), active: cat.active })
  }

  async function handleSaveEdit(id) {
    setSaving(true)
    const { error: err } = await supabase.from('categories').update({
      label:      editForm.label.trim(),
      sort_order: parseInt(editForm.sort_order) || 0,
      active:     editForm.active,
    }).eq('id', id)
    setSaving(false)
    if (err) { setError(err.message); return }
    await logAction({ userEmail: user?.email, action: 'Updated category', targetType:'category', targetId: id, targetName: editForm.label, details: { label: editForm.label, sort_order: editForm.sort_order, active: editForm.active } })
    setEditing(null)
    load()
  }

  async function toggleActive(id, current) {
    await supabase.from('categories').update({ active: !current }).eq('id', id)
    const cat = categories.find(c => c.id === id)
    await logAction({ userEmail: user?.email, action: `${!current ? 'Activated' : 'Deactivated'} category`, targetType:'category', targetId: id, targetName: cat?.label })
    setCategories(prev => prev.map(c => c.id === id ? { ...c, active: !current } : c))
  }

  async function handleDelete(id, key) {
    // Check if any products use this category
    const { count } = await supabase
      .from('products')
      .select('id', { count:'exact', head:true })
      .eq('category', key)

    if (count > 0) {
      alert(`Cannot delete — ${count} product${count>1?'s':''} use this category. Reassign them first.`)
      return
    }
    if (!confirm('Delete this category? This cannot be undone.')) return
    const cat = categories.find(c => c.id === id)
    await supabase.from('categories').delete().eq('id', id)
    await logAction({ userEmail: user?.email, action: 'Deleted category', targetType:'category', targetId: id, targetName: cat?.label, details: { key } })
    load()
  }

  return (
    <div style={{ minHeight:'100vh', background:'#F8F6F0' }}>
      <AdminNav />
      <div className="admin-page-content" style={{ maxWidth:900, margin:'0 auto', padding:'40px 32px' }}>

        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:32 }}>
          <div>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:'2rem', fontWeight:300 }}>Categories</h1>
            <p style={{ color:'var(--stone)', fontSize:'0.85rem', marginTop:4 }}>
              Changes here update the shop filters and product form instantly
            </p>
          </div>
          <button onClick={() => setShowForm(f => !f)} className="btn btn-bronze">
            {showForm ? '× Cancel' : '+ Add category'}
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <div style={{ background:'#fff', borderRadius:'var(--r)', border:'1px solid rgba(45,43,52,0.08)', padding:28, marginBottom:24 }}>
            <p style={{ fontSize:'0.65rem', fontWeight:500, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--stone)', marginBottom:20 }}>New category</p>
            {error && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'var(--r)', padding:'12px 16px', marginBottom:16, fontSize:'0.85rem', color:'#991B1B' }}>{error}</div>}
            <form onSubmit={handleCreate}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr 80px auto', gap:16, alignItems:'flex-end' }}>
                <div>
                  <label style={lbl}>Key (URL slug)</label>
                  <input style={inp} value={newCat.key} onChange={e => setNewCat(p => ({ ...p, key: e.target.value }))} placeholder="e.g. candles" required />
                  <p style={{ fontSize:'0.65rem', color:'var(--stone)', marginTop:4 }}>Lowercase, no spaces</p>
                </div>
                <div>
                  <label style={lbl}>Display name</label>
                  <input style={inp} value={newCat.label} onChange={e => setNewCat(p => ({ ...p, label: e.target.value }))} placeholder="e.g. Candle Holders" required />
                </div>
                <div>
                  <label style={lbl}>Order</label>
                  <input style={inp} type="number" min="0" value={newCat.sort_order} onChange={e => setNewCat(p => ({ ...p, sort_order: e.target.value }))} placeholder="7" />
                </div>
                <button type="submit" className="btn btn-bronze" disabled={saving}>{saving ? '...' : 'Create'}</button>
              </div>
            </form>
          </div>
        )}

        {/* Categories list */}
        <div style={{ background:'#fff', borderRadius:'var(--r)', border:'1px solid rgba(45,43,52,0.08)', overflow:'hidden' }}>
          {loading ? <p style={{ padding:32, color:'var(--stone)' }}>Loading...</p> : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid rgba(45,43,52,0.08)', background:'#FAFAF8' }}>
                  {['Order','Key','Display name','Active','Products',''].map(h => (
                    <th key={h} style={{ padding:'12px 20px', textAlign:'left', fontSize:'0.65rem', fontWeight:500, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--stone)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categories.map(cat => (
                  <tr key={cat.id} style={{ borderBottom:'1px solid rgba(45,43,52,0.05)' }}>
                    <td style={{ padding:'14px 20px', fontSize:'0.82rem', color:'var(--stone)', width:60 }}>
                      {editing === cat.id ? (
                        <input type="number" value={editForm.sort_order} onChange={e => setEditForm(p => ({ ...p, sort_order: e.target.value }))}
                          style={{ width:60, padding:'6px 8px', border:'1px solid rgba(45,43,52,0.2)', borderRadius:'var(--r)', fontSize:'0.82rem', fontFamily:'var(--font-body)', outline:'none' }} />
                      ) : cat.sort_order}
                    </td>
                    <td style={{ padding:'14px 20px', fontFamily:'monospace', fontSize:'0.82rem', color:'var(--stone)' }}>{cat.key}</td>
                    <td style={{ padding:'14px 20px' }}>
                      {editing === cat.id ? (
                        <input value={editForm.label} onChange={e => setEditForm(p => ({ ...p, label: e.target.value }))}
                          style={{ padding:'8px 10px', border:'1px solid rgba(45,43,52,0.2)', borderRadius:'var(--r)', fontSize:'0.88rem', fontFamily:'var(--font-body)', outline:'none', width:200 }} />
                      ) : (
                        <span style={{ fontSize:'0.9rem', fontWeight: cat.active ? 400 : 300, opacity: cat.active ? 1 : 0.5 }}>{cat.label}</span>
                      )}
                    </td>
                    <td style={{ padding:'14px 20px' }}>
                      {editing === cat.id ? (
                        <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                          <input type="checkbox" checked={editForm.active} onChange={e => setEditForm(p => ({ ...p, active: e.target.checked }))} style={{ accentColor:'var(--bronze)', width:16, height:16 }} />
                          <span style={{ fontSize:'0.78rem' }}>Active</span>
                        </label>
                      ) : (
                        <button onClick={() => toggleActive(cat.id, cat.active)}
                          style={{ width:44, height:24, borderRadius:100, border:'none', cursor:'pointer', background:cat.active?'var(--bronze)':'rgba(45,43,52,0.15)', position:'relative', transition:'background .2s' }}>
                          <span style={{ position:'absolute', top:3, width:18, height:18, borderRadius:'50%', background:'#fff', transition:'left .2s', left:cat.active?23:3 }} />
                        </button>
                      )}
                    </td>
                    <td style={{ padding:'14px 20px' }}>
                      <CategoryProductCount categoryKey={cat.key} />
                    </td>
                    <td style={{ padding:'14px 20px' }}>
                      <div style={{ display:'flex', gap:12 }}>
                        {editing === cat.id ? (
                          <>
                            <button onClick={() => handleSaveEdit(cat.id)} disabled={saving}
                              style={{ fontSize:'0.72rem', color:'#6B8F5E', background:'none', border:'none', borderBottom:'1px solid #6B8F5E', cursor:'pointer', paddingBottom:1 }}>
                              {saving ? '...' : 'Save'}
                            </button>
                            <button onClick={() => setEditing(null)}
                              style={{ fontSize:'0.72rem', color:'var(--stone)', background:'none', border:'none', cursor:'pointer' }}>
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleEdit(cat)}
                              style={{ fontSize:'0.72rem', color:'var(--bronze)', background:'none', border:'none', borderBottom:'1px solid var(--bronze)', cursor:'pointer', paddingBottom:1 }}>
                              Edit
                            </button>
                            <button onClick={() => handleDelete(cat.id, cat.key)}
                              style={{ fontSize:'0.72rem', color:'#EF4444', background:'none', border:'none', borderBottom:'1px solid #EF4444', cursor:'pointer', paddingBottom:1 }}>
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p style={{ marginTop:16, fontSize:'0.72rem', color:'var(--stone)', lineHeight:1.7 }}>
          The key is used internally and cannot be changed after creation. Inactive categories are hidden from the shop but their products remain. You cannot delete a category that has products assigned to it.
        </p>
      </div>
    </div>
  )
}

// Small component to show product count per category
function CategoryProductCount({ categoryKey }) {
  const [count, setCount] = useState('...')
  useEffect(() => {
    supabase.from('products').select('id', { count:'exact', head:true }).eq('category', categoryKey)
      .then(({ count: c }) => setCount(c || 0))
  }, [categoryKey])
  return <span style={{ fontSize:'0.78rem', color:'var(--stone)' }}>{count} products</span>
}