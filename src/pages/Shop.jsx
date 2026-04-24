import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { PRODUCTS } from '@/lib/products'
import ProductCard from '@/components/ProductCard'
import Newsletter from '@/components/Newsletter'
import Footer from '@/components/Footer'
import Toast from '@/components/Toast'

const FILTERS = [
  { key: 'all',      label: 'All Objects' },
  { key: 'vases',    label: 'Vases & Planters' },
  { key: 'desk',     label: 'Desk Objects' },
  { key: 'gifts',    label: 'Gifts' },
  { key: 'lighting', label: 'Lighting' },
  { key: 'decor',    label: 'Decor' },
]

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialCat = searchParams.get('cat') || 'all'
  const [filter, setFilter] = useState(initialCat)

  useScrollReveal([filter])

  const setCategory = (key) => {
    setFilter(key)
    key === 'all' ? setSearchParams({}) : setSearchParams({ cat: key })
  }

  const filtered = filter === 'all'
    ? PRODUCTS.filter(p => p.available)
    : PRODUCTS.filter(p => p.category === filter && p.available)

  return (
    <>
      <Toast />

      <div style={{ paddingTop: 'calc(var(--nav-h) + 60px)', paddingBottom: 60, background: 'var(--cream)' }}>
        <div className="container">
          {/* Header */}
          <div className="reveal" style={{ marginBottom: 48 }}>
            <p className="t-label" style={{ marginBottom: 12 }}>The collection</p>
            <h1 className="t-h1">All Objects</h1>
            <p className="t-body" style={{ marginTop: 12, maxWidth: 500 }}>
              Every piece made to order from our Cairo studio. Designed once — made for you.
            </p>
          </div>

          {/* Filters */}
          <div className="shop-filters reveal">
            {FILTERS.map(f => (
              <button
                key={f.key}
                className={`filter-btn${filter === f.key ? ' active' : ''}`}
                onClick={() => setCategory(f.key)}
              >
                {f.label}
              </button>
            ))}
            <span className="shop-sort">{filtered.length} objects</span>
          </div>

          {/* Grid */}
          <div className="shop-grid">
            {filtered.map((p, i) => (
              <ProductCard key={p.slug} product={p} delayClass={`d${(i % 3) + 1}`} />
            ))}
          </div>
        </div>
      </div>

      <Newsletter />
      <Footer />
    </>
  )
}
