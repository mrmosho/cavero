import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '@/context/CartContext'
import ProductIllustration from './illustrations/ProductIllustration'
export default function CartDrawer() {
  const { cart, removeFromCart, updateQty, cartTotal, setDrawerOpen } = useCart()
  const close = () => setDrawerOpen(false)
  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = '' } }, [])
  return (
    <>
      <div className="overlay" style={{ zIndex:1000 }} onClick={close}/>
      <div className="cart-drawer">
        <div className="cart-drawer__header">
          <div className="cart-drawer__title">Your Cart</div>
          <span className="cart-drawer__close" onClick={close}>\u00d7</span>
        </div>
        <div className="cart-drawer__items">
          {cart.length === 0 ? (
            <div className="cart-drawer__empty">
              <div style={{ fontSize:'2.5rem', marginBottom:16, opacity:0.3 }}>\u25c7</div>
              <p style={{ fontFamily:'var(--font-display)', fontSize:'1.1rem', fontWeight:300, marginBottom:8 }}>Your cart is empty</p>
              <p style={{ fontSize:'.8rem' }}>Browse the collection to find your piece.</p>
            </div>
          ) : cart.map(item => (
            <div className="drawer-item" key={item.key}>
              <div className="drawer-item__img"><ProductIllustration slug={item.slug}/></div>
              <div>
                <div className="drawer-item__name">{item.name}</div>
                {item.variantName && <div style={{ fontSize:'0.75rem', color:'var(--stone)', marginBottom:2 }}>{item.variantName}</div>}
                <div className="drawer-item__price">EGP {(item.price * item.qty).toLocaleString()}</div>
                <div className="drawer-item__actions">
                  <div className="drawer-item__qty">
                    <button className="drawer-qty-btn" onClick={() => updateQty(item.key, item.qty - 1)}>\u2212</button>
                    <span style={{ fontSize:'.85rem', minWidth:18, textAlign:'center' }}>{item.qty}</span>
                    <button className="drawer-qty-btn" onClick={() => updateQty(item.key, item.qty + 1)}>+</button>
                  </div>
                  <span style={{ fontSize:'1rem', color:'var(--stone)', cursor:'pointer' }} onClick={() => removeFromCart(item.key)}>\u00d7</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="cart-drawer__footer">
          <div className="cart-drawer__subtotal">
            <span style={{ color:'var(--stone)' }}>Subtotal</span>
            <span style={{ fontWeight:500 }}>EGP {cartTotal.toLocaleString()}</span>
          </div>
          <Link to="/cart" className="btn btn-primary btn-full" onClick={close}>View Cart</Link>
          <Link to="/checkout" className="btn btn-bronze btn-full" style={{ marginTop:8 }} onClick={close}>Checkout</Link>
          <p style={{ marginTop:12, fontSize:'.72rem', color:'var(--stone)', textAlign:'center' }}>Made to order \u00b7 Ships in 5\u20137 days</p>
        </div>
      </div>
    </>
  )
}
