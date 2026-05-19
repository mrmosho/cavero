import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { useCart } from '@/context/CartContext'
import { useProduct, useProducts } from '@/hooks/useProducts'
import ProductIllustration from '@/components/illustrations/ProductIllustration'
import ProductCard from '@/components/ProductCard'
import Footer from '@/components/Footer'
import Toast from '@/components/Toast'

export default function Product() {
  const { slug } = useParams()
  const { addToCart } = useCart()
  const { product, loading } = useProduct(slug)
  const { products: allProducts } = useProducts()

  const [activeImg,    setActiveImg]    = useState(0)
  const [activeColour, setActiveColour] = useState(null)
  const [qty,          setQty]          = useState(1)
  const [note,         setNote]         = useState('')
  const [openAcc,      setOpenAcc]      = useState(null)

  useScrollReveal([loading])

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

  const accs = [
    { key:'details',  title:'Details & materials', content: product.details },
    { key:'shipping', title:'Shipping & delivery',  content:'Made to order in 3-5 business days. Delivered within Cairo in 1-2 days via Bosta. Free delivery on orders over EGP 1,000.' },
    { key:'care',     title:'Care instructions',    content:'Wipe with a dry or slightly damp cloth. Do not submerge in water. Avoid prolonged direct sunlight.' },
  ]

  return (
    <>
      <Toast />
      <div style={{ paddingTop:'var(--nav-h)', background:'var(--cream)' }}>
        <div className="product-detail__inner">

          {/* Gallery */}
          <div className="product-gallery">
            <div className="product-gallery__main">
              {images.length > 0 ? (
                <img
                  src={images[activeImg]?.url}
                  alt={product.name}
                  style={{ width:'100%', height:'100%', objectFit:'cover' }}
                />
              ) : (
                <ProductIllustration slug={slug} style={{ width:160, height:240 }} />
              )}
            </div>
            <div className="product-gallery__thumbs">
              {images.length > 0 ? (
                images.map((img, i) => (
                  <div key={img.id} className={`product-gallery__thumb${activeImg===i?' active':''}`} onClick={() => setActiveImg(i)}>
                    <img src={img.url} alt={`${product.name} ${i+1}`} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  </div>
                ))
              ) : (
                [0,1,2,3].map(i => (
                  <div key={i} className={`product-gallery__thumb${i===0?' active':''}`}>
                    <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem', color:'var(--stone)' }}>◇</div>
                  </div>
                ))
              )}
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
            <div className="product-info__rating">
              <span className="product-info__stars">★★★★★</span>
              <span className="product-info__rating-count">24 reviews</span>
            </div>
            <div className="product-info__price-row">
              <span className="product-info__price">
                {product.slug === 'duo-statue' ? 'From ' : ''}EGP {product.price.toLocaleString()}
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
                    <div
                      key={v.id}
                      className={`color-swatch${colour?.id === v.id ? ' active' : ''}`}
                      style={{ background: v.hex }}
                      onClick={() => setActiveColour(v)}
                      title={v.name}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Personalisation */}
            {product.customisable && (
              <div className="product-info__custom" style={{ marginBottom:28 }}>
                <p className="product-info__option-label">Personalisation note (optional)</p>
                <textarea
                  className="product-info__textarea"
                  placeholder="Any custom details, names, or requests..."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </div>
            )}

            {/* Qty + CTA */}
            <div style={{ display:'flex', gap:12, marginBottom:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, border:'1px solid rgba(45,43,52,0.2)', borderRadius:'var(--r)', padding:'0 8px' }}>
                <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q-1))}>−</button>
                <span style={{ minWidth:24, textAlign:'center' }}>{qty}</span>
                <button className="qty-btn" onClick={() => setQty(q => Math.min(10, q+1))}>+</button>
              </div>
              <button className="btn btn-bronze" style={{ flex:1 }}
                onClick={() => addToCart(slug, qty, { variantName: colour?.name || null, personalisationNote: note || null })}>
                Add to cart
              </button>
            </div>
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
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div style={{ padding:'80px 0', background:'var(--light)' }}>
            <div className="container">
              <div className="section-header reveal" style={{ marginBottom:40 }}>
                <h2 className="t-h2">You might also like</h2>
              </div>
              <div className="grid-3 reveal d1">
                {related.map(p => <ProductCard key={p.slug || p.id} product={p} />)}
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  )
}