import { Link } from 'react-router-dom'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { useCart } from '@/context/CartContext'
import { calculateShipping } from '@/lib/shipping'
import ProductIllustration from '@/components/illustrations/ProductIllustration'
import Newsletter from '@/components/Newsletter'
import Footer from '@/components/Footer'
import Toast from '@/components/Toast'

export default function Cart() {
  const { cart, removeFromCart, updateQty, cartTotal } = useCart()
  const shipping = calculateShipping(cartTotal)
  const total = cartTotal + shipping
  useScrollReveal()
  return (
    <>
      <Toast />
      <div style={{ paddingTop:'calc(var(--nav-h) + 60px)', minHeight:'100vh', paddingBottom:80, background:'var(--cream)' }}>
        <div className="container">
          <div className="reveal" style={{ marginBottom:48 }}>
            <p className="t-label" style={{ marginBottom:12 }}>Your order</p>
            <h1 className="t-h1">Cart</h1>
          </div>
          {cart.length === 0 ? (
            <div style={{ textAlign:'center', padding:'80px 24px' }} className="reveal">
              <div style={{ fontFamily:'var(--font-display)', fontSize:'2rem', fontWeight:300, marginBottom:16 }}>Your cart is empty</div>
              <p style={{ color:'var(--stone)', marginBottom:32 }}>Nothing here yet — browse the collection.</p>
              <Link to="/shop" className="btn btn-bronze">Shop the collection</Link>
            </div>
          ) : (
            <div className="cart-grid reveal">
              <div>
                {cart.map(item => (
                  <div className="cart-item" key={item.key}>
                    <div className="cart-item__img"><ProductIllustration slug={item.slug} /></div>
                    <div>
                      <div className="cart-item__name">{item.name}</div>
                      <div className="cart-item__variant">{item.variantName && `${item.variantName} · `}{item.label}</div>
                      {item.personalisationNote && <div style={{ fontSize:'0.78rem', color:'var(--stone)', marginBottom:8 }}>Note: {item.personalisationNote}</div>}
                      <div className="cart-item__qty">
                        <button className="qty-btn" onClick={() => updateQty(item.key, item.qty-1)}>−</button>
                        <span className="qty-val">{item.qty}</span>
                        <button className="qty-btn" onClick={() => updateQty(item.key, item.qty+1)}>+</button>
                      </div>
                      <div className="cart-item__remove" onClick={() => removeFromCart(item.key)}>Remove</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontWeight:500, color:'var(--bronze)' }}>EGP {(item.price*item.qty).toLocaleString()}</div>
                      <div style={{ fontSize:'.78rem', color:'var(--stone)', marginTop:4 }}>EGP {item.price.toLocaleString()} each</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="cart-summary">
                <div className="cart-summary__title">Order Summary</div>
                <div className="cart-summary__row"><span>Subtotal</span><span>EGP {cartTotal.toLocaleString()}</span></div>
                <div className="cart-summary__row"><span>Shipping</span><span>{shipping === 0 ? 'Free' : `EGP ${shipping}`}</span></div>
                <div className="cart-summary__row cart-summary__row--total"><span>Total</span><span>EGP {total.toLocaleString()}</span></div>
                {shipping > 0 && <p className="cart-summary__notice">Free shipping on orders over EGP 1,000</p>}
                <Link to="/checkout" className="btn btn-bronze btn-full" style={{ marginTop:24 }}>Proceed to Checkout</Link>
                <p className="cart-summary__notice" style={{ marginTop:12 }}>Made to order · Ships in 5-7 days</p>
              </div>
            </div>
          )}
        </div>
      </div>
      <Newsletter />
      <Footer />
    </>
  )
}
