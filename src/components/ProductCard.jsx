import { Link } from 'react-router-dom'
import { useCart } from '@/context/CartContext'
import ProductIllustration from './illustrations/ProductIllustration'

export default function ProductCard({ product, delayClass = '' }) {
  const { addToCart } = useCart()
  const primaryImage = product.product_images?.find(i => i.position === 0)?.url
    || product.product_images?.[0]?.url
    || null

  return (
    <article className={`product-card reveal ${delayClass}`}>
      <div className="product-card__img-wrap">
        <Link to={`/shop/${product.slug}`}>
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={product.name}
              style={{ width:'100%', height:'100%', objectFit:'cover' }}
            />
          ) : (
            <div className="product-card__placeholder">
              <ProductIllustration slug={product.slug} />
            </div>
          )}
        </Link>
        <button
          className="product-card__quick-add"
          onClick={e => { e.preventDefault(); addToCart(product.slug) }}>
          Add to cart
        </button>
        {product.badge && (
          <span style={{ position:'absolute', top:12, left:12, display:'inline-block', padding:'3px 10px', borderRadius:100, fontSize:'0.65rem', fontWeight:500, letterSpacing:'0.08em', textTransform:'uppercase', background: product.badge === 'new' ? 'var(--charcoal)' : 'var(--bronze)', color:'#fff' }}>
            {product.badge === 'new' ? 'New' : product.badge}
          </span>
        )}
        {product.customisable && !product.badge && (
          <span style={{ position:'absolute', top:12, left:12, display:'inline-block', padding:'3px 10px', borderRadius:100, fontSize:'0.65rem', fontWeight:500, letterSpacing:'0.08em', textTransform:'uppercase', background:'var(--bronze)', color:'#fff' }}>
            Custom
          </span>
        )}
      </div>
      <Link to={`/shop/${product.slug}`} style={{ display:'block' }}>
        <p className="t-label product-card__label">{product.label}</p>
        <h3 className="product-card__name">{product.name}</h3>
        <p className="product-card__price">
          {product.slug === 'duo-statue' ? 'From ' : ''}EGP {product.price.toLocaleString()}
        </p>
      </Link>
    </article>
  )
}