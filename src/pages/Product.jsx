import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { useCart } from '@/context/CartContext'
import { useProduct, useProducts } from '@/hooks/useProducts'
import { supabase } from '@/lib/supabase'
import ProductIllustration from '@/components/illustrations/ProductIllustration'
import ProductCard from '@/components/ProductCard'
import Footer from '@/components/Footer'
import Toast from '@/components/Toast'

export default function Product() {
  const { slug }     = useParams()
  const { addToCart }= useCart()
  const navigate     = useNavigate()
  const { product, loading }     = useProduct(slug)
  const { products: allProducts }= useProducts()

  const [activeImg,    setActiveImg]    = useState(0)
  const [activeColour, setActiveColour] = useState(null)
  const [qty,          setQty]          = useState(1)
  const [note,         setNote]         = useState('')
  const [openAcc,      setOpenAcc]      = useState(null)

  // Reviews
  const [reviews,        setReviews]        = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewForm,     setReviewForm]     = useState({ name:'', rating:5, body:'' })
  const [reviewLoading,  setReviewLoading]  = useState(false)
  const [reviewSent,     setReviewSent]     = useState(false)
  const [reviewError,    setReviewError]    = useState(null)

  useScrollReveal([loading])

  useEffect(() => {
    if (!slug) return
    supabase
      .from('product_reviews')
      .select('id, reviewer_name, rating, body, created_at')
      .eq('product_slug', slug)
      .eq('verified', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setReviews(data || []); setReviewsLoading(false) })
  }, [slug])

  if (loading) return (
    <div style={{ paddingTop:'calc(var(--nav-h) + 80px)', textAlign:'center', padding:'160px 24px' }}>
      <p style={{ color:'var(--stone)' }}>Loading...</p>
    </div>
  )

  if (!product) return (
    <div style={{ paddingTop:'calc(var(--nav-h) + 80px)', textAlign:'center', padding:'160px 24px' }}>
      <h2 style={{ fontFamily:'var(--font-display)', fontSize:'2rem', fontWeight:300, marginBottom:16 }}>Product not found</h2>
      <Link to="/shop" className="btn btn-bronze">Back to shop</Link>
    </div>
  )

  const images   = product.product_images || []
  const variants = product.product_variants || []
  const colour   = activeColour || variants[0] || null
  const related  = allProducts.filter(p => p.slug !== slug && p.category === product.category).slice(0, 3)
  const avgRating = reviews.length ? Math.round(reviews.reduce((s,r) => s+r.rating,0)/reviews.length) : 0

  const accs = [
    { key:'details',  title:'Details & materials', content: product.details },
    { key:'shipping', title:'Shipping & delivery',  content:'Made to order in 3-5 business days. Delivered within Cairo in 1-2 days via Bosta. Free delivery on orders over EGP 1,000.' },
    { key:'care',     title:'Care instructions',    content:'Wipe with a dry or slightly damp cloth. Do not submerge in water. Avoid prolonged direct sunlight.' },
  ]

  async function handleSubmitReview(e) {
    e.preventDefault()
    setReviewLoading(true)
    setReviewError(null)
    const { error } = await supabase.from('product_reviews').insert({
      product_slug:  slug,
      product_name:  product.name,
      reviewer_name: reviewForm.name,
      rating:        reviewForm.rating,
      body:          reviewForm.body,
    })
    setReviewLoading(false)
    if (error) { setReviewError('Something went wrong. Please try again.'); return }
    setReviewSent(true)
    setShowReviewForm(false)
  }

  return (
    <>
      <Toast />

      {/* ── Product detail ── */}
      <div style={{ paddingTop:'var(--nav-h)', background:'var(--cream)' }}>
        <div className="product-detail__inner">

          {/* Gallery */}
          <div className="product-gallery">
            <div className="product-gallery__main">
              {images.length > 0
                ? <img src={images[activeImg]?.url} alt={product.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : <ProductIllustration slug={slug} style={{ width:160, height:240 }} />
              }
            </div>
            <div className="product-gallery__thumbs">
              {images.length > 0
                ? images.map((img,i) => (
                    <div key={img.id} className={`product-gallery__thumb${activeImg===i?' active':''}`} onClick={() => setActiveImg(i)}>
                      <img src={img.url} alt={`${product.name} ${i+1}`} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    </div>
                  ))
                : [0,1,2,3].map(i => (
                    <div key={i} className={`product-gallery__thumb${i===0?' active':''}`}>
                      <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem', color:'var(--stone)' }}>◇</div>
                    </div>
                  ))
              }
            </div>
          </div>

          {/* Info */}
          <div className="product-info">
            <div className="product-info__breadcrumb">
              <Link to="/">Home</Link><span>/</span>
              <Link to="/shop">Shop</Link><span>/</span>
              <span style={{ color:'var(--charcoal)' }}>{product.name}</span>
            </div>

            <h1 className="product-info__name">{product.name}</h1>

            {/* Real rating */}
            {reviews.length > 0 && (
              <div className="product-info__rating" style={{ cursor:'pointer' }}
                onClick={() => document.getElementById('reviews-section')?.scrollIntoView({ behavior:'smooth' })}>
                <span className="product-info__stars">{'★'.repeat(avgRating)}{'☆'.repeat(5-avgRating)}</span>
                <span className="product-info__rating-count">{reviews.length} review{reviews.length!==1?'s':''}</span>
              </div>
            )}

            <div className="product-info__price-row">
              <span className="product-info__price">
                {product.customisable ? 'From ' : ''}EGP {product.price.toLocaleString()}
              </span>
            </div>

            <p className="product-info__desc">{product.description}</p>

            {/* Colour variants */}
            {variants.length > 0 && (
              <div style={{ marginBottom:28 }}>
                <p className="product-info__option-label">
                  Colour — <span style={{ color:'var(--bronze)', textTransform:'capitalize' }}>{colour?.name || ''}</span>
                </p>
                <div className="product-info__colors">
                  {variants.map(v => (
                    <div key={v.id}
                      className={`color-swatch${colour?.id===v.id?' active':''}`}
                      style={{ background:v.hex }}
                      onClick={() => setActiveColour(v)}
                      title={v.name}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Personalisation */}
            {product.customisable && (
              <div style={{ marginBottom:28, padding:'18px 20px', background:'rgba(168,149,111,0.06)', border:'1px solid rgba(168,149,111,0.2)', borderRadius:'var(--r)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                  <span style={{ fontSize:'0.85rem' }}>✦</span>
                  <p className="product-info__option-label" style={{ margin:0 }}>Personalisation</p>
                </div>
                <textarea
                  className="product-info__textarea"
                  placeholder="Add names, dates, a message, or any custom details you'd like included..."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  style={{ borderColor: note ? 'var(--bronze)' : undefined, minHeight:90 }}
                />
                <p style={{ fontSize:'0.72rem', color:'var(--stone)', marginTop:6, lineHeight:1.6 }}>
                  Your personalisation note will be reviewed by our team before production begins.
                </p>
              </div>
            )}

            {/* Qty + Add to cart */}
            <div style={{ display:'flex', gap:12, marginBottom:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, border:'1px solid rgba(45,43,52,0.2)', borderRadius:'var(--r)', padding:'0 8px' }}>
                <button className="qty-btn" onClick={() => setQty(q => Math.max(1,q-1))}>−</button>
                <span style={{ minWidth:24, textAlign:'center' }}>{qty}</span>
                <button className="qty-btn" onClick={() => setQty(q => Math.min(10,q+1))}>+</button>
              </div>
              <button className="btn" style={{ flex:1, background:'rgba(168,149,111,0.65)', color:'#fff', transition:'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background='var(--bronze)'}
                onMouseLeave={e => e.currentTarget.style.background='rgba(168,149,111,0.65)'}
                onClick={() => addToCart(slug, qty, { variantName:colour?.name||null, personalisationNote:note||null })}>
                Add to cart
              </button>
            </div>

            {/* Buy now */}
            <button className="btn btn-full" style={{ marginBottom:12, background:'var(--charcoal)', color:'var(--cream)', border:'none', padding:'14px', borderRadius:'var(--r)', fontSize:'0.75rem', fontWeight:500, letterSpacing:'0.1em', textTransform:'uppercase', cursor:'pointer', fontFamily:'var(--font-body)' }}
              onClick={async () => {
                await addToCart(slug, qty, { variantName:colour?.name||null, personalisationNote:note||null })
                navigate('/checkout')
              }}>
              Buy now
            </button>

            <p className="product-info__notice">✦ Made to order · Ships in 5-7 days · Free Cairo delivery</p>

            {/* Accordion */}
            <div className="product-info__divider" />
            <div className="product-info__accordion">
              {accs.map(acc => (
                <div key={acc.key} className={`accordion-item${openAcc===acc.key?' open':''}`}>
                  <button className="accordion-btn" onClick={() => setOpenAcc(openAcc===acc.key?null:acc.key)}>
                    {acc.title}<span className="accordion-icon">+</span>
                  </button>
                  <div className="accordion-content">{acc.content}</div>
                </div>
              ))}
            </div>
          </div>

        </div>{/* ← closes product-detail__inner */}

        {/* Related */}
        {related.length > 0 && (
          <div style={{ padding:'80px 0', background:'var(--light)' }}>
            <div className="container">
              <div className="section-header reveal" style={{ marginBottom:40 }}>
                <h2 className="t-h2">You might also like</h2>
              </div>
              <div className="grid-3 reveal d1">
                {related.map(p => <ProductCard key={p.slug||p.id} product={p} />)}
              </div>
            </div>
          </div>
        )}

      </div>{/* ← closes outer paddingTop div */}

      {/* ── Reviews section ── */}
      <div id="reviews-section" style={{ padding:'80px 0', background:'var(--cream)' }}>
        <div className="container">
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:40 }}>
            <div>
              <p className="t-label" style={{ marginBottom:8 }}>Customer reviews</p>
              <h2 className="t-h2">
                {reviewsLoading ? 'Reviews' : reviews.length > 0 ? `${reviews.length} review${reviews.length!==1?'s':''}` : 'No reviews yet'}
              </h2>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => setShowReviewForm(f => !f)}>
              {showReviewForm ? 'Cancel' : '+ Write a review'}
            </button>
          </div>

          {/* Review form */}
          {showReviewForm && (
            <div style={{ background:'var(--white)', padding:32, borderRadius:'var(--r)', border:'1px solid rgba(45,43,52,0.1)', marginBottom:40 }}>
              <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.3rem', fontWeight:300, marginBottom:24 }}>Your review</h3>
              {reviewSent ? (
                <div style={{ textAlign:'center', padding:'24px 0' }}>
                  <p style={{ fontSize:'1.1rem', fontFamily:'var(--font-display)', fontWeight:300, marginBottom:8 }}>Thank you ✦</p>
                  <p style={{ color:'var(--stone)', fontSize:'0.88rem' }}>Your review has been submitted and will appear after approval.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                    <div>
                      <label className="form-label">Your name</label>
                      <input className="form-input" type="text" value={reviewForm.name}
                        onChange={e => setReviewForm(f => ({ ...f, name:e.target.value }))}
                        placeholder="Your Name" required />
                    </div>
                    <div>
                      <label className="form-label">Rating</label>
                      <div style={{ display:'flex', gap:6, paddingTop:8 }}>
                        {[1,2,3,4,5].map(n => (
                          <button key={n} type="button" onClick={() => setReviewForm(f => ({ ...f, rating:n }))}
                            style={{ fontSize:'1.5rem', background:'none', border:'none', cursor:'pointer', color:n<=reviewForm.rating?'var(--bronze)':'var(--stone)', transition:'color .15s' }}>
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginBottom:16 }}>
                    <label className="form-label">Your review</label>
                    <textarea className="form-textarea" value={reviewForm.body}
                      onChange={e => setReviewForm(f => ({ ...f, body:e.target.value }))}
                      placeholder="Share your experience with this piece..." required style={{ minHeight:100 }} />
                  </div>
                  {reviewError && <p style={{ fontSize:'0.78rem', color:'#991B1B', marginBottom:12 }}>{reviewError}</p>}
                  <button type="submit" className="btn btn-bronze" disabled={reviewLoading}>
                    {reviewLoading ? 'Submitting...' : 'Submit review'}
                  </button>
                  <p style={{ fontSize:'0.72rem', color:'var(--stone)', marginTop:10 }}>Reviews are verified before being published.</p>
                </form>
              )}
            </div>
          )}

          {/* Review list */}
          {!reviewsLoading && (
            reviews.length === 0 ? (
              <div style={{ textAlign:'center', padding:'60px 24px', color:'var(--stone)' }}>
                <p style={{ fontFamily:'var(--font-display)', fontSize:'1.3rem', fontWeight:300, marginBottom:8 }}>No reviews yet</p>
                <p style={{ fontSize:'0.88rem' }}>Be the first to share your experience.</p>
              </div>
            ) : (
              <div className="grid-3">
                {reviews.map(r => (
                  <div key={r.id} className="review-card">
                    <div className="review-stars">{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</div>
                    <p className="review-text">"{r.body}"</p>
                    <p className="review-author">
                      {r.reviewer_name}
                      <span style={{ color:'var(--stone)', marginLeft:8, fontSize:'0.72rem' }}>
                        {new Date(r.created_at).toLocaleDateString('en-EG', { day:'numeric', month:'long', year:'numeric' })}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            )
          )}

        </div>
      </div>

      <Footer />
    </>
  )
}