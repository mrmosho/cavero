import { Link } from 'react-router-dom'
import { useCart } from '@/context/CartContext'
import ProductIllustration from './illustrations/ProductIllustration'

export default function ProductCard({ product, delayClass = '' }) {
  const { addToCart } = useCart()

  return (
    <article className={`product-card reveal ${delayClass}`}>
      {/* Image / illustration */}
      <div className="product-card__img-wrap">
        <Link to={`/shop/${product.slug}`}>
          <div className="product-card__placeholder">
            <ProductIllustration slug={product.slug} />
          </div>
        </Link>

        <button
          className="product-card__quick-add"
          onClick={(e) => {
            e.preventDefault()
            addToCart(product.slug)
          }}
        >
          Add to cart
        </button>

        {product.badge && (
          <span
            className={`badge badge-${product.badge}`}
            style={{ position: 'absolute', top: 12, left: 12 }}
          >
            {product.badge}
          </span>
        )}
      </div>

      {/* Info */}
      <Link to={`/shop/${product.slug}`} style={{ display: 'block' }}>
        <p className="t-label product-card__label">{product.label}</p>
        <h3 className="product-card__name">{product.name}</h3>
        <p className="product-card__price">
          {product.slug === 'duo-statue' ? 'From ' : ''}
          EGP {product.price.toLocaleString()}
        </p>
      </Link>
    </article>
  )
}
