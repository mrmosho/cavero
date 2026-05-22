import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useCategories } from '@/hooks/useCategories'
import { logAction } from '@/lib/audit'
import { useAdmin } from '@/context/AdminContext'
import AdminNav from '@/components/AdminNav'

const EMPTY = { slug:'', name:'', price:'', category:'vases', label:'', description:'', details:'', badge:'', available:true, customisable:false, sort_order:0 }
const BADGES = ['','new','custom']
const inp = { width:'100%', padding:'12px 14px', border:'1px solid rgba(45,43,52,0.2)', borderRadius:'var(--r)', fontSize:'0.9rem', color:'var(--charcoal)', background:'#fff', outline:'none', fontFamily:'var(--font-body)' }
const lbl = { display:'block', fontSize:'0.68rem', fontWeight:500, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--stone)', marginBottom:7 }

export default function AdminProductForm() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const isNew        = id === 'new'
  const fileInputRef = useRef(null)

  const { user }       = useAdmin()
  const { categories } = useCategories({ includeInactive: true })

  const [form,      setForm]      = useState(EMPTY)
  const [variants,  setVariants]  = useState([])
  const [images,    setImages]    = useState([])
  const [newVar,    setNewVar]    = useState({ name:'', hex:'#2D2B34' })
  const [loading,   setLoading]   = useState(!isNew)
  const [saving,    setSaving]    = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState(null)
  const [savedId,   setSavedId]   = useState(isNew ? null : id)

  // Auto-fill label when category changes
  useEffect(() => {
    if (!form.category || !categories.length) return
    const cat = categories.find(c => c.key === form.category)
    if (cat && (!form.label || categories.some(c => c.label === form.label))) {
      setForm(p => ({ ...p, label: cat.label }))
    }
  }, [form.category, categories])

  useEffect(() => {
    if (isNew) return
    async function load() {
      const { data } = await supabase
        .from('products')
        .select('*, product_variants(*), product_images(*)')
        .eq('id', id)
        .single()
      if (data) {
        const { product_variants, product_images, ...rest } = data
        setForm({ ...rest, price:String(rest.price), badge:rest.badge||'', sort_order:rest.sort_order||0 })
        setVariants(product_variants || [])
        setImages((product_images || []).sort((a,b) => a.position - b.position))
      }
      setLoading(false)
    }
    load()
  }, [id, isNew])

  const set      = f => e => setForm(p => ({ ...p, [f]: e.target.value }))
  const setCheck = f => e => setForm(p => ({ ...p, [f]: e.target.checked }))

  async function handleSave(e) {
    e.preventDefault()
    if (!isNew && !confirm('Save changes to this product?')) return
    setSaving(true)
    setError(null)
    const payload = { ...form, price:parseInt(form.price)||0, badge:form.badge||null, sort_order:parseInt(form.sort_order)||0 }
    if (isNew) {
      const { data, error: err } = await supabase.from('products').insert(payload).select().single()
      if (err) { setError(err.message); setSaving(false); return }
      await logAction({ userEmail: user?.email, action: 'Created product', targetType:'product', targetId: data.id, targetName: data.name, details: { price: data.price, category: data.category } })
      setSavedId(data.id)
      navigate(`/admin/products/${data.id}`, { replace: true })
    } else {
      const { error: err } = await supabase.from('products').update(payload).eq('id', savedId || id)
      if (err) { setError(err.message); setSaving(false); return }
      await logAction({ userEmail: user?.email, action: 'Updated product', targetType:'product', targetId: savedId || id, targetName: form.name, details: { price: payload.price, available: payload.available } })
      setSaving(false)
      navigate('/admin/products')
      return
    }
    setSaving(false)
  }

  async function handleImageUpload(e) {
    const files = Array.from(e.target.files)
    const pid   = savedId || id
    if (!files.length || !pid) return
    setUploading(true)
    setError(null)
    for (const file of files) {
      if (!file.type.startsWith('image/')) { setError('Only image files are allowed.'); continue }
      if (file.size > 5 * 1024 * 1024)    { setError('Images must be under 5MB.'); continue }
      const ext      = file.name.split('.').pop().toLowerCase()
      const filename = `${pid}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('product-images').upload(filename, file, { upsert: false })
      if (uploadErr) { setError(`Upload failed: ${uploadErr.message}`); continue }
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filename)
      const position = images.length
      const { data: imgRow, error: dbErr } = await supabase.from('product_images').insert({ product_id: pid, url: publicUrl, alt: form.name, position }).select().single()
      if (dbErr) { setError(`DB error: ${dbErr.message}`); continue }
      setImages(prev => [...prev, imgRow])
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleDeleteImage(imgId, imgUrl) {
    if (!confirm('Delete this image?')) return
    const path = imgUrl.split('/product-images/')[1]
    if (path) await supabase.storage.from('product-images').remove([path])
    await supabase.from('product_images').delete().eq('id', imgId)
    setImages(prev => prev.filter(i => i.id !== imgId))
  }

  async function handleSetPrimary(imgId) {
    const updated = images.map((img, i) => ({ ...img, position: img.id === imgId ? 0 : i + 1 }))
    for (const img of updated) {
      await supabase.from('product_images').update({ position: img.position }).eq('id', img.id)
    }
    setImages(updated.sort((a,b) => a.position - b.position))
  }

  async function addVariant() {
    const pid = savedId || id
    if (!newVar.name.trim()) return
    if (!pid) { setError('Save the product first, then add variants.'); return }
    const { data, error: err } = await supabase.from('product_variants').insert({ product_id: pid, name: newVar.name, hex: newVar.hex, available: true }).select().single()
    if (err) { setError(err.message); return }
    setVariants(prev => [...prev, data])
    setNewVar({ name:'', hex:'#2D2B34' })
  }

  async function removeVariant(varId) {
    const { error: err } = await supabase.from('product_variants').delete().eq('id', varId)
    if (err) { setError(err.message); return }
    setVariants(prev => prev.filter(v => v.id !== varId))
  }

  if (loading) return <div style={{ minHeight:'100vh', background:'#F8F6F0' }}><AdminNav /><p style={{ padding:40, color:'var(--stone)' }}>Loading...</p></div>

  const pid = savedId || (isNew ? null : id)

  return (
    <div style={{ minHeight:'100vh', background:'#F8F6F0' }}>
      <AdminNav />
      <div className="admin-page-content" style={{ maxWidth:800, margin:'0 auto', padding:'40px 32px' }}>
        <div style={{ marginBottom:32 }}>
          <button onClick={() => navigate('/admin/products')} style={{ fontSize:'0.72rem', color:'var(--stone)', background:'none', border:'none', cursor:'pointer', marginBottom:12 }}>← Back to products</button>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:'2rem', fontWeight:300 }}>{isNew && !savedId ? 'Add product' : `Edit — ${form.name}`}</h1>
        </div>

        {error && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'var(--r)', padding:'14px 18px', marginBottom:24, fontSize:'0.88rem', color:'#991B1B' }}>{error}</div>}

        <form onSubmit={handleSave}>
          <div style={{ background:'#fff', borderRadius:'var(--r)', border:'1px solid rgba(45,43,52,0.08)', padding:28, marginBottom:20 }}>
            <p style={{ fontSize:'0.65rem', fontWeight:500, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--stone)', marginBottom:20 }}>Basic info</p>
            <div className="admin-form-2col" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
              <div><label style={lbl}>Name</label><input style={inp} value={form.name} onChange={set('name')} required /></div>
              <div><label style={lbl}>Slug</label><input style={inp} value={form.slug} onChange={set('slug')} placeholder="e.g. lune-vase" required /></div>
            </div>
            <div className="admin-form-4col" style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:16, marginBottom:16 }}>
              <div><label style={lbl}>Price (EGP)</label><input style={inp} type="number" min="0" value={form.price} onChange={set('price')} required /></div>
              <div>
                <label style={lbl}>Category</label>
                <select style={inp} value={form.category} onChange={set('category')}>
                  {categories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Label</label><input style={inp} value={form.label} onChange={set('label')} placeholder="Auto-filled from category" required /></div>
              <div><label style={lbl}>Badge</label><select style={inp} value={form.badge} onChange={set('badge')}>{BADGES.map(b => <option key={b} value={b}>{b || '— none —'}</option>)}</select></div>
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

          {/* Colour variants — available on new AND existing products */}
          <div style={{ background:'#fff', borderRadius:'var(--r)', border:'1px solid rgba(45,43,52,0.08)', padding:28, marginBottom:20 }}>
            <p style={{ fontSize:'0.65rem', fontWeight:500, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--stone)', marginBottom:20 }}>Colour variants</p>
            {!pid && (
              <div style={{ background:'rgba(168,149,111,0.08)', border:'1px solid rgba(168,149,111,0.2)', borderRadius:'var(--r)', padding:'12px 16px', marginBottom:16 }}>
                <p style={{ fontSize:'0.8rem', color:'var(--charcoal)' }}>Save the product first to start adding variants — they will appear here immediately after.</p>
              </div>
            )}
            {variants.length > 0 && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:20 }}>
                {variants.map(v => (
                  <div key={v.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 14px', background:'#F8F6F0', borderRadius:100, fontSize:'0.78rem' }}>
                    <div style={{ width:14, height:14, borderRadius:'50%', background:v.hex, border:'1px solid rgba(45,43,52,0.15)', flexShrink:0 }} />
                    {v.name}
                    {pid && <button type="button" onClick={() => removeVariant(v.id)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1rem', color:'var(--stone)', padding:0, lineHeight:1 }}>×</button>}
                  </div>
                ))}
              </div>
            )}
            {pid && (
              <div style={{ display:'flex', gap:10, alignItems:'flex-end' }}>
                <div style={{ flex:1 }}>
                  <label style={lbl}>Colour name</label>
                  <input style={inp} placeholder="e.g. Forest Green" value={newVar.name} onChange={e => setNewVar(p => ({ ...p, name:e.target.value }))} />
                </div>
                <div>
                  <label style={lbl}>Colour</label>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <input type="color" value={newVar.hex} onChange={e => setNewVar(p => ({ ...p, hex:e.target.value }))}
                      style={{ width:44, height:44, borderRadius:'var(--r)', border:'1px solid rgba(45,43,52,0.2)', cursor:'pointer', padding:2 }} />
                    <input style={{ ...inp, width:110 }} value={newVar.hex} onChange={e => setNewVar(p => ({ ...p, hex:e.target.value }))} />
                  </div>
                </div>
                <button type="button" className="btn btn-outline" onClick={addVariant}>Add</button>
              </div>
            )}
          </div>

          {/* Images — available after save */}
          {pid && (
            <div style={{ background:'#fff', borderRadius:'var(--r)', border:'1px solid rgba(45,43,52,0.08)', padding:28, marginBottom:20 }}>
              <p style={{ fontSize:'0.65rem', fontWeight:500, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--stone)', marginBottom:20 }}>Product images</p>
              {images.length > 0 && (
                <div className="admin-img-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
                  {images.map((img) => (
                    <div key={img.id} style={{ position:'relative', aspectRatio:'1', borderRadius:'var(--r)', overflow:'hidden', border:`2px solid ${img.position===0?'var(--bronze)':'rgba(45,43,52,0.1)'}` }}>
                      <img src={img.url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      {img.position === 0 && (
                        <span style={{ position:'absolute', top:6, left:6, background:'var(--bronze)', color:'#fff', fontSize:'0.6rem', fontWeight:500, padding:'2px 7px', borderRadius:100 }}>Primary</span>
                      )}
                      <div style={{ position:'absolute', bottom:0, left:0, right:0, display:'flex', gap:4, padding:6, background:'rgba(29,28,34,0.75)' }}>
                        {img.position !== 0 && (
                          <button type="button" onClick={() => handleSetPrimary(img.id)}
                            style={{ flex:1, padding:'4px', background:'rgba(168,149,111,0.9)', color:'#fff', border:'none', borderRadius:2, fontSize:'0.6rem', cursor:'pointer', fontFamily:'var(--font-body)' }}>Set primary</button>
                        )}
                        <button type="button" onClick={() => handleDeleteImage(img.id, img.url)}
                          style={{ flex:1, padding:'4px', background:'rgba(139,26,26,0.85)', color:'#fff', border:'none', borderRadius:2, fontSize:'0.6rem', cursor:'pointer', fontFamily:'var(--font-body)' }}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div onClick={() => fileInputRef.current?.click()}
                style={{ border:'2px dashed rgba(45,43,52,0.2)', borderRadius:'var(--r)', padding:32, textAlign:'center', cursor:'pointer', background:'#FAFAF8' }}
                onMouseEnter={e => e.currentTarget.style.borderColor='var(--bronze)'}
                onMouseLeave={e => e.currentTarget.style.borderColor='rgba(45,43,52,0.2)'}>
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display:'none' }} />
                <p style={{ fontSize:'0.88rem', color:'var(--stone)', marginBottom:4 }}>{uploading ? 'Uploading...' : 'Click to upload images'}</p>
                <p style={{ fontSize:'0.75rem', color:'var(--stone)' }}>JPG, PNG, WebP · Max 5MB each · Multiple allowed</p>
              </div>
            </div>
          )}

          <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/admin/products')}>Cancel</button>
            <button type="submit" className="btn btn-bronze" disabled={saving}>{saving ? 'Saving...' : isNew && !savedId ? 'Create product' : 'Save changes'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}