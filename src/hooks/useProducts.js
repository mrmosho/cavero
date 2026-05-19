import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { PRODUCTS as LOCAL_PRODUCTS, PRODUCT_COLOURS as LOCAL_COLOURS } from '@/lib/products'

/**
 * Fetches all products from Supabase including images and variants.
 * Falls back to local data if Supabase isn't reachable.
 */
export function useProducts({ category } = {}) {
  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  useEffect(() => {
    let cancelled = false
    async function fetch() {
      setLoading(true)
      try {
        let query = supabase
          .from('products')
          .select('*, product_images(*), product_variants(*)')
          .eq('available', true)
          .order('sort_order', { ascending: true })
        if (category) query = query.eq('category', category)
        const { data, error: err } = await query
        if (err) throw err
        if (!cancelled) setProducts(data || [])
      } catch (err) {
        console.warn('Supabase products fetch failed, using local data:', err.message)
        const local = category
          ? LOCAL_PRODUCTS.filter(p => p.category === category && p.available)
          : LOCAL_PRODUCTS.filter(p => p.available)
        if (!cancelled) setProducts(local)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetch()
    return () => { cancelled = true }
  }, [category])

  return { products, loading, error }
}

/**
 * Fetches a single product by slug including images and variants.
 */
export function useProduct(slug) {
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    async function fetch() {
      setLoading(true)
      try {
        const { data, error: err } = await supabase
          .from('products')
          .select('*, product_images(*), product_variants(*)')
          .eq('slug', slug)
          .eq('available', true)
          .single()
        if (err) throw err
        if (!cancelled) setProduct(data)
      } catch (err) {
        console.warn('Supabase product fetch failed, using local data:', err.message)
        const local = LOCAL_PRODUCTS.find(p => p.slug === slug) || null
        if (!cancelled) setProduct(local ? { ...local, product_variants: LOCAL_COLOURS.map((c,i) => ({ id: i, name: c.name, hex: c.hex, available: true })), product_images: [] } : null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetch()
    return () => { cancelled = true }
  }, [slug])

  return { product, loading, error }
}

/** Returns the primary image URL for a product, or null */
export function getPrimaryImage(product) {
  if (!product?.product_images?.length) return null
  const primary = product.product_images.find(i => i.position === 0) || product.product_images[0]
  return primary?.url || null
}