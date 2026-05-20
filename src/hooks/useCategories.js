import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// Fallback in case Supabase is unreachable
const FALLBACK = [
  { key:'vases',    label:'Vases & Planters',     sort_order:1, active:true },
  { key:'desk',     label:'Desk Objects',          sort_order:2, active:true },
  { key:'gifts',    label:'Couples & Gifts',       sort_order:3, active:true },
  { key:'lighting', label:'Candle Holders',        sort_order:4, active:true },
  { key:'specials', label:'Name Tags & Specials',  sort_order:5, active:true },
  { key:'decor',    label:'Decor',                 sort_order:6, active:true },
]

export function useCategories({ includeInactive = false } = {}) {
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    let cancelled = false
    async function fetch() {
      setLoading(true)
      try {
        let query = supabase
          .from('categories')
          .select('*')
          .order('sort_order', { ascending: true })
        if (!includeInactive) query = query.eq('active', true)
        const { data, error } = await query
        if (error) throw error
        if (!cancelled) setCategories(data || [])
      } catch {
        if (!cancelled) setCategories(FALLBACK.filter(c => includeInactive || c.active))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetch()
    return () => { cancelled = true }
  }, [includeInactive])

  return { categories, loading }
}