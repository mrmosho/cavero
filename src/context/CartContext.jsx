import { createContext, useContext, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { pixelAddToCart } from '@/lib/pixel'
import { tiktokAddToCart } from '@/lib/tiktok'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [cart,        setCart]        = useState([])
  const [drawerOpen,  setDrawerOpen]  = useState(false)
  const [toast,       setToast]       = useState(null)
  const [cartFlash,   setCartFlash]   = useState(false)

  const cartCount = cart.reduce((s, i) => s + i.qty, 0)
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0)

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function flashCart() {
    setCartFlash(true)
    setTimeout(() => setCartFlash(false), 600)
  }

  const addToCart = useCallback(async (slug, qty = 1, { variantName = null, personalisationNote = null } = {}) => {
    // Try local products first
    let product = null

    // Fetch from Supabase
    const { data } = await supabase
      .from('products')
      .select('slug, name, price, product_images(url, position)')
      .eq('slug', slug)
      .single()

    if (data) product = data

    if (!product) {
      showToast('Product not found.')
      return
    }

    const key    = `${slug}-${variantName || 'default'}`
    const imgUrl = product.product_images?.sort((a,b) => a.position - b.position)[0]?.url || null

    setCart(prev => {
      const existing = prev.find(i => i.key === key)
      if (existing) return prev.map(i => i.key === key ? { ...i, qty: i.qty + qty } : i)
      return [...prev, { key, slug, name: product.name, price: product.price, qty, variantName, personalisationNote, imgUrl }]
    })

    showToast('Added to cart ✦')
    flashCart()
    setDrawerOpen(true)

    // Fire pixels
    pixelAddToCart({ name: product.name, slug: product.slug, price: product.price, qty })
    tiktokAddToCart({ name: product.name, slug: product.slug, price: product.price, qty })
  }, [])

  function updateQty(key, qty) {
    if (qty <= 0) {
      setCart(prev => prev.filter(i => i.key !== key))
    } else {
      setCart(prev => prev.map(i => i.key === key ? { ...i, qty } : i))
    }
  }

  function removeItem(key) {
    setCart(prev => prev.filter(i => i.key !== key))
  }

  function clearCart() {
    setCart([])
  }

  return (
    <CartContext.Provider value={{ cart, cartCount, cartTotal, drawerOpen, setDrawerOpen, toast, showToast, cartFlash, addToCart, updateQty, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}