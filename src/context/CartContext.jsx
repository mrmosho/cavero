import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { PRODUCTS } from '@/lib/products'
const CartContext = createContext(null)
export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => { try { return JSON.parse(localStorage.getItem('cavero_cart')) || [] } catch { return [] } })
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)
  useEffect(() => { localStorage.setItem('cavero_cart', JSON.stringify(cart)) }, [cart])
  const showToast = useCallback((msg) => { setToast(msg); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(null), 2800) }, [])
  const addToCart = useCallback((slug, qty = 1, options = {}) => {
    const product = PRODUCTS.find(p => p.slug === slug)
    if (!product || !product.available) return
    setCart(prev => {
      const key = `${slug}__${options.variantName || 'default'}`
      const existing = prev.find(i => i.key === key)
      if (existing) return prev.map(i => i.key === key ? { ...i, qty: i.qty + qty, personalisationNote: options.personalisationNote ?? i.personalisationNote } : i)
      return [...prev, { key, slug: product.slug, name: product.name, price: product.price, label: product.label, qty, variantName: options.variantName || null, personalisationNote: options.personalisationNote || null }]
    })
    showToast('Added to cart ✦')
  }, [showToast])
  const removeFromCart = useCallback((key) => setCart(prev => prev.filter(i => i.key !== key)), [])
  const updateQty = useCallback((key, qty) => { if (qty <= 0) { removeFromCart(key); return } setCart(prev => prev.map(i => i.key === key ? { ...i, qty } : i)) }, [removeFromCart])
  const clearCart = useCallback(() => setCart([]), [])
  const cartCount = cart.reduce((s, i) => s + i.qty, 0)
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  return <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQty, clearCart, cartCount, cartTotal, drawerOpen, setDrawerOpen, showToast, toast }}>{children}</CartContext.Provider>
}
export function useCart() { const ctx = useContext(CartContext); if (!ctx) throw new Error('useCart must be used inside CartProvider'); return ctx }