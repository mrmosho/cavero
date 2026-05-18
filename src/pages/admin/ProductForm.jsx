import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import AdminNav from '@/components/AdminNav'

const EMPTY = { slug:'', name:'', price:'', category:'vases', label:'', description:'', details:'', badge:'', available:true, customisable:false, sort_order:0 }
const CATEGORIES = ['vases','desk','gifts','lighting','decor']
const BADGES = ['','new','custom']
const inp = { width:'100%', padding:'12px 14px', border:'1px solid rgba(45,43,52,0.2)', borderRadius:'var(--r)', fontSize:'0.9rem', color:'var(--charcoal)', background:'#fff', outline:'none', fontFamily:'var(--font-body)' }
const lbl = { display:'block', fontSize:'0.68rem', fontWeight:500, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--stone)', marginBottom:7 }

export default function AdminProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'
  const [form, setForm] = useState(EMPTY)
  const [variants, setVariants] = useState([])
  const [newVar, setNewVar] = useState({ name:'', hex:'#2D2B34' })
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isNew) return
    async function load() {
      const { data } = await supabase.from('products').select('*, product_variants(*)').eq('id', id).single()
      if (data) {
        const { product_variants, ...rest } = data
        setForm({ ...rest, price:String(rest.price), badge:rest.badge||'', sort_order:rest.sort_order||0 })
        setVariants(product_variants || [])
      }
      setLoading(false)
    }
    load()
  }, [id, isNew])

  const set = f => e => setForm(prev => ({ ...prev, [f]: e.target.value }))
  const setCheck = f => e => setForm(prev => ({ ...prev, [f]: e.target.checked }))

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const payload = { ...form, price:parseInt(form.price)||0, badge:form.badge||null, sort_order:parseInt(form.sort_order)||0 }
    if (isNew) {
      const { data, error: err } = await supabase.from('products').insert(payload).select().single()
      if (err) { setError(err.message); setSaving(false); return }
      navigate(`/admin/products/${data.id}`, { replace:true })
    } else {
      const { error: err } = await supabase.from('products').update(payload).eq('id', id)
      if (err) { setError(err.message); setSaving(false); return }
    }
    setSaving(false)
  }

  async function addVariant() {
    if (!newVar.name || isNew) { if (isNew) setError('Save product first before adding variants'); return }
    const { data } = await supabase.from('product_variants').insert({ product_id:id, name:newVar.name, hex:newVar.hex, available:true }).select().single()
    if (data) { setVariants(prev => [...prev, data]); setNewVar({ name:'', hex:'#2D2B34' }) }
  }

  async function removeVariant(varId) {
    await supabase.from('product_variants').delete().eq('id', varId)
    setVariants(prev => prev.filter(v => v.id !== varId))
  }

  if (loading) return <div style={{ minHeight:'100vh', background:'#F8F6F0' }}><AdminNav /><p style={{ padding:40, color:'var(--stone)' }}>Loading...</p></div>

  return (
    <div style={{ minHeight:'100vh', background:'#F8F6F0' }}>
      <AdminNav />
      <div style={{ maxWidth:800, margin:'0 auto', padding:'40px 32px' }}>
        <div style={{ marginBottom:32 }}>
          <button onClick={() => navigate('/admin/products')} style={{ fontSize:'0.72rem', color:'var(--stone)', background:'none', border:'none', cursor:'pointer', marginBottom:12 }}>← Back to products</button>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:'2rem', fontWeight:300 }}>{isNew ? 'Add product' : `Edit — ${form.name}`}</h1>
        </div>
        {error && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'var(--r)', padding:'14px 18px', marginBottom:24, fontSize:'0.88rem', color:'#991B1B' }}>{error}</div>}
        <form onSubmit={handleSave}>
          <div style={{ background:'#fff', borderRadius:'var(--r)', border:'1px solid rgba(45,43,52,0.08)', padding:28, marginBottom:20 }}>
            <p style={{ fontSize:'0.65rem', fontWeight:500, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--stone)', marginBottom:20 }}>Basic info</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
              <div><label style={lbl}>Name</label><input style={inp} value={form.name} onChange={set('name')} required /></div>
              <div><label style={lbl}>Slug</label><input style={inp} value={form.slug} onChange={set('slug')} placeholder="e.g. lune-vase" required /></div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:16, marginBottom:16 }}>
              <div><label style={lbl}>Price (EGP)</label><input style={inp} type="number" min="0" value={form.price} onChange={set('price')} required /></div>
              <div><label style={lbl}>Category</label><select style={inp} value={form.category} onChange={set('category')}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><label style={lbl}>Label</label><input style={inp} value={form.label} onChange={set('label')} placeholder="e.g. Vases" required /></div>
              <div><label style={lbl}>Badge</label><select style={inp} value={form.badge} onChange={set('badge')}>{BADGES.map(b => <option key={b} value={b}>{b||'— none —'}</option>)}</select></div>
            </div>
            <div style={{ marginBottom:16 }}><label style={lbl}>Description</label><textarea style={{ ...inp, minHeight:80, resize:'vertical' }} value={form.description} onChange={set('description')} /></div>
            <div style={{ marginBottom:16 }}><label style={lbl}>Details (dimensions, materials)</label><textarea style={{ ...inp, minHeight:80, resize:'vertical' }} value={form.details} onChange={set('details')} /></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:24 }}>
              <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
                <input type="checkbox" checked={form.available} onChange={setCheck('available')} style={{ accentColor:'var(--bronze)', width:16, height:16 }} />
                <span style={{ fontSize:'0.82rem' }}>Available in store</span>
              </label>
              <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
                <input type="checkbox" checked={form.customisable} onChange={setCheck('customisable')} style={{ accentColor:'var(--bronze)', width:16, height:16 }} />
                <span style={{ fontSize:'0.82rem' }}>Accepts personalisation</span>
              </label>
              <div><label style={lbl}>Sort order</label><input style={{ ...inp, padding:'8px 12px' }} type="number" min="0" value={form.sort_order} onChange={set('sort_order')} /></div>
            </div>
          </div>
          {!isNew && (
            <div style={{ background:'#fff', borderRadius:'var(--r)', border:'1px solid rgba(45,43,52,0.08)', padding:28, marginBottom:20 }}>
              <p style={{ fontSize:'0.65rem', fontWeight:500, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--stone)', marginBottom:20 }}>Colour variants</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:20 }}>
                {variants.map(v => (
                  <div key={v.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 12px', background:'#F8F6F0', borderRadius:100, fontSize:'0.78rem' }}>
                    <div style={{ width:14, height:14, borderRadius:'50%', background:v.hex, border:'1px solid rgba(45,43,52,0.15)', flexShrink:0 }} />
                    {v.name}
                    <button type="button" onClick={() => removeVariant(v.id)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'0.85rem', color:'var(--stone)', padding:0 }}>×</button>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:10, alignItems:'flex-end' }}>
                <div style={{ flex:1 }}><label style={lbl}>Name</label><input style={inp} placeholder="e.g. Forest Green" value={newVar.name} onChange={e => setNewVar(p => ({ ...p, name:e.target.value }))} /></div>
                <div>
                  <label style={lbl}>Hex</label>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <input type="color" value={newVar.hex} onChange={e => setNewVar(p => ({ ...p, hex:e.target.value }))} style={{ width:44, height:44, borderRadius:'var(--r)', border:'1px solid rgba(45,43,52,0.2)', cursor:'pointer', padding:2 }} />
                    <input style={{ ...inp, width:110 }} value={newVar.hex} onChange={e => setNewVar(p => ({ ...p, hex:e.target.value }))} />
                  </div>
                </div>
                <button type="button" className="btn btn-outline" onClick={addVariant}>Add</button>
              </div>
            </div>
          )}
          <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/admin/products')}>Cancel</button>
            <button type="submit" className="btn btn-bronze" disabled={saving}>{saving?'Saving...':isNew?'Create product':'Save changes'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
