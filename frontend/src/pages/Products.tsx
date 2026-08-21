import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api/client'
import { errorMessage } from '../api/errors'
import type { Paginated, Product } from '../api/types'
import Pagination from '../components/Pagination'
import ProductCard from '../components/ProductCard'

// Matches the backend default so the page count lines up.
const PAGE_SIZE = 12

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? 1)
  const location = searchParams.get('location') ?? ''

  const [products, setProducts] = useState<Product[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    api
      .get<Paginated<Product>>('/products/', {
        params: { page, ...(location ? { location } : {}) },
      })
      .then(({ data }) => {
        if (!active) return
        setProducts(data.results)
        setCount(data.count)
      })
      .catch((err) => {
        if (!active) return
        setError(errorMessage(err, 'Could not load products.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    // Ignore the response if the filters changed while it was in flight.
    return () => {
      active = false
    }
  }, [page, location])

  function updateParams(next: { page?: number; location?: string }) {
    const params: Record<string, string> = {}
    const nextLocation = next.location ?? location
    if (nextLocation) params.location = nextLocation
    if (next.page && next.page > 1) params.page = String(next.page)
    setSearchParams(params)
  }

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-slate-500">{count} items available</p>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-600">Location</span>
          <select
            value={location}
            onChange={(e) => updateParams({ location: e.target.value, page: 1 })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-indigo-500"
          >
            <option value="">All</option>
            <option value="JO">Jordan</option>
            <option value="SA">Saudi Arabia</option>
          </select>
        </label>
      </div>

      {error && (
        <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {loading ? (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-xl bg-white/70" />
          ))}
        </div>
      ) : (
        <>
          {products.length === 0 && !error ? (
            <p className="mt-6 text-slate-500">No products match this filter.</p>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={(next) => updateParams({ page: next })}
          />
        </>
      )}
    </div>
  )
}
