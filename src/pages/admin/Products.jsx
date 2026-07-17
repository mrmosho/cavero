import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import AdminNav from '@/components/AdminNav'
import { logAction } from '@/lib/audit'
import { useAdmin } from '@/context/AdminContext'


export default function AdminProducts() {
  const [products,     setProducts]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [exportMenu,   setExportMenu]   = useState(false)
  const [importing,    setImporting]    = useState(false)
  const [importPreview,setImportPreview]= useState(null)
  const [importError,  setImportError]  = useState(null)
  const [importDone,   setImportDone]   = useState(null)
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
    const product = products.find(p => p.id === id)
    await logAction({ userEmail: user?.email, action: `${!current ? 'Made product available' : 'Made product unavailable'}`, targetType:'product', targetId: id, targetName: product?.name })
    setProducts(prev => prev.map(p => p.id === id ? { ...p, available: !current } : p))
  }

  async function deleteProduct(id, name) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    await supabase.from('products').delete().eq('id', id)
    await logAction({ userEmail: user?.email, action: 'Deleted product', targetType:'product', targetId: id, targetName: name })
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  // ── Export ────────────────────────────────────────────────
  function exportToCSV(filter) {
    let rows = products
    if (filter === 'available')   rows = products.filter(p => p.available)
    if (filter === 'unavailable') rows = products.filter(p => !p.available)
    const headers = ['Name','Slug','Category','Label','Price (EGP)','Badge','Available','Customisable','Sort Order','Description','Details']
    const data = rows.map(p => [p.name,p.slug,p.category,p.label,p.price,p.badge||'',p.available?'Yes':'No',p.customisable?'Yes':'No',p.sort_order,p.description||'',p.details||''])
    const csv = [headers,...data].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF'+csv], { type:'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `cavero-products-${filter}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setExportMenu(false)
  }

  // ── Import ────────────────────────────────────────────────
  async function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError(null)
    setImportDone(null)

    try {
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs')
      const data = await file.arrayBuffer()
      const wb   = XLSX.read(data)
      const ws   = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })

      const colorHexMap = {
        'warm taupe':'#C4A882','matte black':'#2D2B34','olive sage':'#6B7C5C',
        'white':'#F5F3EF','cream':'#D4CFC0','bronze':'#A8956F','stone':'#B8B5A8',
        'charcoal':'#2D2B34','espresso brown':'#4B2E1A','snow white':'#F5F3EF',
        'night black':'#1A1820','warm white':'#F8F3E8','sage green':'#6B7C5C',
      }

      const catMap = {
        'planters':'vases','vases':'vases','desk':'desk','gifts':'gifts',
        'lighting':'lighting','specials':'specials','decor':'decor',
        'couples and gifts':'gifts','name tags':'specials','candle holders':'lighting',
      }

      const parsed = []
      for (const row of rows) {
        const name = String(row['Product Name'] || '').trim()
        if (!name) continue

        const priceRaw   = String(row['Selling Price (EGP)'] || '0')
        const price      = parseInt(priceRaw.replace(/[^0-9]/g,'')) || 0
        const slug       = name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
        const catRaw     = String(row['Category'] || '').trim().toLowerCase()
        const category   = catMap[catRaw] || catRaw || 'decor'
        const colorsRaw  = String(row['Color Variants'] || '')
        const colors     = colorsRaw.split(/[×\n]/).map(c => c.trim()).filter(Boolean)
        const customRaw  = String(row['Customization Available'] || '').toLowerCase()
        const customisable = customRaw === 'yes'
        const material   = String(row['Material'] || '').trim()
        const weight     = String(row['Weight (g)'] || '').trim()
        const details    = [material && `Material: ${material}`, weight && `Weight: ${weight}`].filter(Boolean).join('. ')

        parsed.push({ name, slug, price, category, label: String(row['Category']||'').trim()||category, customisable, details, colors, colorHexMap, available:false, sort_order:0, badge:null, description:'' })
      }

      if (!parsed.length) { setImportError('No valid products found. Make sure the "Product Name" column has data.'); return }
      setImportPreview(parsed)
    } catch (err) {
      setImportError('Failed to read file: ' + err.message)
    }
    e.target.value = ''
  }

  async function handleConfirmImport() {
    if (!importPreview?.length) return
    setImporting(true)
    let added = 0, skipped = 0

    for (const row of importPreview) {
      // Skip if slug OR name already exists
      const { data: existingSlug } = await supabase.from('products').select('id').eq('slug', row.slug).maybeSingle()
      const { data: existingName } = await supabase.from('products').select('id').ilike('name', row.name).maybeSingle()
      if (existingSlug || existingName) { skipped++; continue }

      const { data: newProduct, error } = await supabase.from('products')
        .insert({ slug:row.slug, name:row.name, price:row.price, category:row.category, label:row.label, description:row.description, details:row.details, badge:row.badge, available:row.available, customisable:row.customisable, sort_order:row.sort_order })
        .select().single()

      if (error || !newProduct) { skipped++; continue }

      if (row.colors.length > 0) {
        const variants = row.colors.map((c, i) => ({ product_id:newProduct.id, name:c, hex:row.colorHexMap[c.toLowerCase()]||'#B8B5A8', available:true, sort_order:i }))
        await supabase.from('product_variants').insert(variants)
      }

      await logAction({ userEmail:user?.email, action:'Imported product from Excel', targetType:'product', targetId:newProduct.id, targetName:row.name })
      added++
    }

    setImporting(false)
    setImportPreview(null)
    setImportDone({ added, skipped })
    load()
  }

  return (
    <div style={{ minHeight:'100vh', background:'#F8F6F0' }}>
      <AdminNav />
      <div className="admin-page-content" style={{ maxWidth:1100, margin:'0 auto', padding:'40px 32px' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:32 }}>
          <div>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:'2rem', fontWeight:300 }}>Products</h1>
            <p style={{ color:'var(--stone)', fontSize:'0.85rem', marginTop:4 }}>{products.length} products</p>
          </div>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>

            {/* Export */}
            <div style={{ position:'relative' }}>
              <button onClick={() => setExportMenu(m => !m)}
                style={{ padding:'10px 20px', borderRadius:'var(--r)', fontSize:'0.72rem', fontWeight:500, letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer', border:'none', background:'var(--charcoal)', color:'var(--cream)', fontFamily:'var(--font-body)', display:'flex', alignItems:'center', gap:6 }}>
                ↓ Export to Excel
                <span style={{ fontSize:'0.6rem', opacity:0.6, transform:exportMenu?'rotate(180deg)':'none', transition:'transform .2s', display:'inline-block' }}>▼</span>
              </button>
              {exportMenu && (
                <>
                  <div onClick={() => setExportMenu(false)} style={{ position:'fixed', inset:0, zIndex:99 }} />
                  <div style={{ position:'absolute', top:'calc(100% + 8px)', right:0, background:'#fff', border:'1px solid rgba(45,43,52,0.12)', borderRadius:'var(--r)', minWidth:200, boxShadow:'0 8px 32px rgba(0,0,0,0.12)', zIndex:100, overflow:'hidden' }}>
                    {[
                      { key:'all',         label:'All products',     sub:`${products.length} products` },
                      { key:'available',   label:'Available only',   sub:`${products.filter(p=>p.available).length} products` },
                      { key:'unavailable', label:'Unavailable only', sub:`${products.filter(p=>!p.available).length} products` },
                    ].map(opt => (
                      <button key={opt.key} onClick={() => exportToCSV(opt.key)}
                        style={{ display:'block', width:'100%', padding:'12px 16px', textAlign:'left', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font-body)', borderBottom:'1px solid rgba(45,43,52,0.06)' }}
                        onMouseEnter={e => e.currentTarget.style.background='#F8F6F0'}
                        onMouseLeave={e => e.currentTarget.style.background='none'}>
                        <div style={{ fontSize:'0.85rem', color:'var(--charcoal)' }}>{opt.label}</div>
                        <div style={{ fontSize:'0.72rem', color:'var(--stone)', marginTop:2 }}>{opt.sub}</div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Import */}
            <label style={{ padding:'10px 20px', borderRadius:'var(--r)', fontSize:'0.72rem', fontWeight:500, letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer', border:'1px solid rgba(45,43,52,0.2)', background:'transparent', color:'var(--charcoal)', fontFamily:'var(--font-body)', display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap' }}>
              ↑ Import Excel
              <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} style={{ display:'none' }} />
            </label>

            <button className="btn btn-bronze" onClick={() => navigate('/admin/products/new')}>+ Add product</button>
          </div>
        </div>

        {/* Import error */}
        {importError && (
          <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'var(--r)', padding:'14px 18px', marginBottom:20, fontSize:'0.88rem', color:'#991B1B', display:'flex', justifyContent:'space-between' }}>
            {importError}
            <button onClick={() => setImportError(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#991B1B' }}>×</button>
          </div>
        )}

        {/* Import success */}
        {importDone && (
          <div style={{ background:'rgba(107,143,94,0.08)', border:'1px solid rgba(107,143,94,0.3)', borderRadius:'var(--r)', padding:'14px 18px', marginBottom:20, fontSize:'0.88rem', color:'#16A34A', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span>✓ Import complete — <strong>{importDone.added} products added</strong>{importDone.skipped>0?`, ${importDone.skipped} skipped (slug already exists)`:''}</span>
            <button onClick={() => setImportDone(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#16A34A' }}>×</button>
          </div>
        )}

        {/* Import preview modal */}
        {importPreview && (
          <>
            <div onClick={() => setImportPreview(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:200 }} />
            <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'calc(100% - 48px)', maxWidth:680, background:'#fff', borderRadius:'var(--r)', zIndex:201, overflow:'hidden', boxShadow:'0 24px 80px rgba(0,0,0,0.2)' }}>
              <div style={{ padding:'24px 28px', borderBottom:'1px solid rgba(45,43,52,0.08)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.3rem', fontWeight:300 }}>Import preview</h3>
                  <p style={{ fontSize:'0.78rem', color:'var(--stone)', marginTop:4 }}>{importPreview.length} products ready to import</p>
                </div>
                <button onClick={() => setImportPreview(null)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1.3rem', color:'var(--stone)' }}>×</button>
              </div>
              <div style={{ maxHeight:360, overflowY:'auto', padding:'0 28px' }}>
                {importPreview.map((p, i) => (
                  <div key={i} style={{ padding:'14px 0', borderBottom:'1px solid rgba(45,43,52,0.06)', display:'grid', gridTemplateColumns:'1fr auto', gap:16, alignItems:'start' }}>
                    <div>
                      <div style={{ fontSize:'0.9rem', fontWeight:500, marginBottom:3 }}>{p.name}</div>
                      <div style={{ fontSize:'0.75rem', color:'var(--stone)' }}>
                        {p.label} · EGP {p.price.toLocaleString()} · {p.customisable?'Customisable':'Standard'}
                        {p.colors.length>0 && <span> · {p.colors.length} colour{p.colors.length!==1?'s':''}: {p.colors.join(', ')}</span>}
                      </div>
                      {p.details && <div style={{ fontSize:'0.72rem', color:'var(--stone)', marginTop:2 }}>{p.details}</div>}
                    </div>
                    <code style={{ fontSize:'0.7rem', color:'var(--stone)', background:'#F8F6F0', padding:'2px 8px', borderRadius:4, whiteSpace:'nowrap' }}>{p.slug}</code>
                  </div>
                ))}
              </div>
              <div style={{ padding:'20px 28px', borderTop:'1px solid rgba(45,43,52,0.08)', display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button onClick={() => setImportPreview(null)} className="btn btn-outline">Cancel</button>
                <button onClick={handleConfirmImport} disabled={importing} className="btn btn-bronze">
                  {importing ? 'Importing...' : `Import ${importPreview.length} products`}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Products table */}
        {loading ? <p style={{ color:'var(--stone)' }}>Loading...</p> : (
          <div className="admin-table-wrap" style={{ background:'#fff', borderRadius:'var(--r)', border:'1px solid rgba(45,43,52,0.08)', overflow:'hidden' }}>
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