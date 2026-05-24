import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAdmin } from '@/context/AdminContext'
import { logAction } from '@/lib/audit'
import AdminNav from '@/components/AdminNav'

export default function AdminReviews() {
  const { user }       = useAdmin()
  const [reviews,  setReviews]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('pending') // pending | verified | all

  useEffect(() => { load() }, [filter])

  async function load() {
    setLoading(true)
    let query = supabase.from('product_reviews').select('*').order('created_at', { ascending: false })
    if (filter === 'pending')  query = query.eq('verified', false)
    if (filter === 'verified') query = query.eq('verified', true)
    const { data } = await query
    setReviews(data || [])
    setLoading(false)
  }

  async function approve(id, reviewerName, productName) {
    await supabase.from('product_reviews').update({ verified: true }).eq('id', id)
    await logAction({ userEmail: user?.email, action: 'Approved review', targetType:'review', targetId: id, targetName: productName, details: { reviewer: reviewerName } })
    setReviews(prev => prev.map(r => r.id === id ? { ...r, verified: true } : r))
    if (filter === 'pending') setReviews(prev => prev.filter(r => r.id !== id))
  }

  async function reject(id, reviewerName, productName) {
    if (!confirm('Delete this review permanently?')) return
    await supabase.from('product_reviews').delete().eq('id', id)
    await logAction({ userEmail: user?.email, action: 'Rejected and deleted review', targetType:'review', targetId: id, targetName: productName, details: { reviewer: reviewerName } })
    setReviews(prev => prev.filter(r => r.id !== id))
  }

  const Stars = ({ rating }) => (
    <span style={{ color:'var(--bronze)', fontSize:'0.85rem' }}>
      {'★'.repeat(rating)}{'☆'.repeat(5-rating)}
    </span>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#F8F6F0' }}>
      <AdminNav />
      <div className="admin-page-content" style={{ maxWidth:1000, margin:'0 auto', padding:'40px 32px' }}>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:32 }}>
          <div>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:'2rem', fontWeight:300 }}>Reviews</h1>
            <p style={{ color:'var(--stone)', fontSize:'0.85rem', marginTop:4 }}>{reviews.length} {filter === 'pending' ? 'pending approval' : filter === 'verified' ? 'published' : 'total'}</p>
          </div>
        </div>

        <div style={{ display:'flex', gap:8, marginBottom:24 }}>
          {[
            { key:'pending',  label:'Pending' },
            { key:'verified', label:'Published' },
            { key:'all',      label:'All' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{ padding:'7px 16px', borderRadius:100, fontSize:'0.7rem', cursor:'pointer', border:'1px solid', fontFamily:'var(--font-body)', borderColor:filter===f.key?'var(--charcoal)':'rgba(45,43,52,0.2)', background:filter===f.key?'var(--charcoal)':'transparent', color:filter===f.key?'var(--cream)':'var(--charcoal)' }}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? <p style={{ color:'var(--stone)' }}>Loading...</p> :
         reviews.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 24px', color:'var(--stone)' }}>
            <p style={{ fontFamily:'var(--font-display)', fontSize:'1.5rem', fontWeight:300, marginBottom:8 }}>No reviews here</p>
            <p style={{ fontSize:'0.85rem' }}>{filter === 'pending' ? 'All caught up — no reviews waiting for approval.' : 'No reviews yet.'}</p>
          </div>
         ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {reviews.map(r => (
              <div key={r.id} style={{ background:'#fff', borderRadius:'var(--r)', border:`1px solid ${r.verified ? 'rgba(107,143,94,0.2)' : 'rgba(45,43,52,0.08)'}`, padding:'20px 24px' }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8, flexWrap:'wrap' }}>
                      <Stars rating={r.rating} />
                      <span style={{ fontSize:'0.88rem', fontWeight:500 }}>{r.reviewer_name}</span>
                      <span style={{ fontSize:'0.75rem', color:'var(--stone)' }}>on <strong>{r.product_name}</strong></span>
                      <span style={{ fontSize:'0.72rem', color:'var(--stone)' }}>{new Date(r.created_at).toLocaleDateString('en-EG', { day:'numeric', month:'short', year:'numeric' })}</span>
                      {r.verified && <span style={{ fontSize:'0.65rem', fontWeight:500, padding:'2px 8px', borderRadius:100, background:'rgba(107,143,94,0.12)', color:'#16A34A' }}>Published</span>}
                    </div>
                    <p style={{ fontSize:'0.9rem', lineHeight:1.7, color:'var(--charcoal)', margin:0 }}>"{r.body}"</p>
                  </div>
                  <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                    {!r.verified && (
                      <button onClick={() => approve(r.id, r.reviewer_name, r.product_name)}
                        style={{ padding:'8px 16px', background:'var(--charcoal)', color:'var(--cream)', border:'none', borderRadius:'var(--r)', fontSize:'0.72rem', fontWeight:500, letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer', fontFamily:'var(--font-body)' }}>
                        ✓ Approve
                      </button>
                    )}
                    <button onClick={() => reject(r.id, r.reviewer_name, r.product_name)}
                      style={{ padding:'8px 16px', background:'transparent', border:'1px solid #FECACA', borderRadius:'var(--r)', fontSize:'0.72rem', fontWeight:500, letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer', color:'#991B1B', fontFamily:'var(--font-body)' }}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}