import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { PRODUCTS as LOCAL_PRODUCTS } from '@/lib/products'

/**
 * Fetches products from Supabase.
 * Falls back to local data if Supabase isn't configured yet
 * (i.e. during dev before the DB is seeded).
 */
export function useProducts({ category } = {}) {
  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  useEffect(() => {
    let cancelled = false

    async function fetchProducts() {
      setLoading(true)
      setError(null)

      try {
        let query = supabase
          .from('products')
          .select('*, product_images(*), product_variants(*)')
          .eq('available', true)
          .order('sort_order', { ascending: true })

        if (category) query = query.eq('category', category)

        const { data, error: sbError } = await query

        if (sbError) throw sbError
        if (!cancelled) setProducts(data || [])
      } catch (err) {
        // If Supabase isn't set up yet, fall back to local data silently
        console.warn('Supabase not available, using local product data:', err.message)
        const local = category
          ? LOCAL_PRODUCTS.filter(p => p.category === category && p.available)
          : LOCAL_PRODUCTS.filter(p => p.available)
        if (!cancelled) setProducts(local)
        if (!cancelled) setError(null) // suppress error in UI during dev
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchProducts()
    return () => { cancelled = true }
  }, [category])

  return { products, loading, error }
}

/**
 * Fetches a single product by slug.
 */
export function useProduct(slug) {
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (!slug) return
    let cancelled = false

    async function fetchProduct() {
      setLoading(true)
      setError(null)

      try {
        const { data, error: sbError } = await supabase
          .from('products')
          .select('*, product_images(*), product_variants(*)')
          .eq('slug', slug)
          .eq('available', true)
          .single()

        if (sbError) throw sbError
        if (!cancelled) setProduct(data)
      } catch (err) {
        console.warn('Supabase not available, using local product data:', err.message)
        const local = LOCAL_PRODUCTS.find(p => p.slug === slug) || null
        if (!cancelled) setProduct(local)
        if (!cancelled) setError(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchProduct()
    return () => { cancelled = true }
  }, [slug])

  return { product, loading, error }
}
