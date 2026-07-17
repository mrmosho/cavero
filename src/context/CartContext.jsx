import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { PRODUCTS } from '@/lib/products'
import { pixelAddToCart } from '@/lib/pixel'
import { tiktokAddToCart } from '@/lib/tiktok'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [cart,       setCart]       = useState(() => { try { return JSON.parse(localStorage.getItem('cavero_cart')) || [] } catch { return [] } })
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [toast,      setToast]      = useState(null)
  const toastTimer = useRef(null)

  useEffect(() => { localStorage.setItem('cavero_cart', JSON.stringify(cart)) }, [cart])

  const showToast = useCallback((msg) => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2800)
  }, [])

  const addToCart = useCallback(async (slug, qty = 1, options = {}) => {
    // First try local array (instant)
    let product = PRODUCTS.find(p => p.slug === slug)

    // If not found locally, fetch from Supabase (DB-only products)
    if (!product) {
      const { data } = await supabase
        .from('products')
        .select('slug, name, price, label, available')
        .eq('slug', slug)
        .single()
      if (data) product = data
    }

    if (!product || product.available === false) {
      console.warn('Product not found or unavailable:', slug)
      return
    }

    setCart(prev => {
      const key      = `${slug}__${options.variantName || 'default'}`
      const existing = prev.find(i => i.key === key)
      if (existing) {
        return prev.map(i => i.key === key
          ? { ...i, qty: i.qty + qty, personalisationNote: options.personalisationNote ?? i.personalisationNote }
          : i
        )
      }
      return [...prev, {
        key,
        slug:                product.slug,
        name:                product.name,
        price:               product.price,
        label:               product.label,
        qty,
        variantName:         options.variantName         || null,
        personalisationNote: options.personalisationNote || null,
      }]
    })

    showToast('Added to cart ✦')
    if (product) pixelAddToCart({ name: product.name, slug: product.slug, price: product.price, qty })
      tiktokAddToCart({ name: product.name, slug: product.slug, price: product.price, qty })
  }, [showToast])

  const removeFromCart = useCallback((key) => setCart(prev => prev.filter(i => i.key !== key)), [])
  const updateQty      = useCallback((key, qty) => {
    if (qty <= 0) { removeFromCart(key); return }
    setCart(prev => prev.map(i => i.key === key ? { ...i, qty } : i))
  }, [removeFromCart])
  const clearCart = useCallback(() => setCart([]), [])

  const cartCount = cart.reduce((s, i) => s + i.qty, 0)
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0)

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQty, clearCart, cartCount, cartTotal, drawerOpen, setDrawerOpen, showToast, toast }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}