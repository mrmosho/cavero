import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { useProducts } from '@/hooks/useProducts'
import ProductCard from '@/components/ProductCard'
import Newsletter from '@/components/Newsletter'
import Footer from '@/components/Footer'
import Toast from '@/components/Toast'

const FILTERS = [
  { key:'all',      label:'All Objects' },
  { key:'vases',    label:'Vases & Planters' },
  { key:'desk',     label:'Desk Objects' },
  { key:'gifts',    label:'Couples & Gifts' },
  { key:'lighting', label:'Candle Holders' },
  { key:'specials', label:'Name Tags & Specials' },
  { key:'decor',    label:'Decor' },
]

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filter, setFilter] = useState(searchParams.get('cat') || 'all')
  const { products, loading } = useProducts()
  useScrollReveal([filter, loading])

  const setCategory = (key) => {
    setFilter(key)
    key === 'all' ? setSearchParams({}) : setSearchParams({ cat: key })
  }

  const filtered = filter === 'all'
    ? products
    : products.filter(p => p.category === filter)

  return (
    <>
      <Toast />
      <div style={{ paddingTop:'calc(var(--nav-h) + 60px)', paddingBottom:60, background:'var(--cream)' }}>
        <div className="container">
          <div className="reveal" style={{ marginBottom:48 }}>
            <p className="t-label" style={{ marginBottom:12 }}>The collection</p>
            <h1 className="t-h1">All Objects</h1>
            <p className="t-body" style={{ marginTop:12, maxWidth:500 }}>Every piece made to order from our Cairo studio.</p>
          </div>
          <div className="shop-filters reveal">
            {FILTERS.map(f => (
              <button key={f.key} className={`filter-btn${filter===f.key?' active':''}`} onClick={() => setCategory(f.key)}>
                {f.label}
              </button>
            ))}
            <span className="shop-sort">{loading ? '...' : `${filtered.length} objects`}</span>
          </div>
          {loading ? (
            <div style={{ textAlign:'center', padding:'80px 0', color:'var(--stone)' }}>Loading collection...</div>
          ) : (
            <div className="shop-grid">
              {filtered.map((p, i) => (
                <ProductCard key={p.slug || p.id} product={p} delayClass={`d${(i % 3) + 1}`} />
              ))}
            </div>
          )}
        </div>
      </div>
      <Newsletter />
      <Footer />
    </>
  )
}