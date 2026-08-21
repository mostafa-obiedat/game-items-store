import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../api/client'
import { errorMessage } from '../api/errors'
import type { Order, Product } from '../api/types'
import LocationBadge from '../components/LocationBadge'
import { formatPrice } from '../utils/format'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [buying, setBuying] = useState(false)
  const [buyError, setBuyError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    api
      .get<Product>(`/products/${id}/`)
      .then(({ data }) => active && setProduct(data))
      .catch((err) => active && setError(errorMessage(err, 'This product could not be found.')))
      .finally(() => active && setLoading(false))

    return () => {
      active = false
    }
  }, [id])

  async function handleBuy() {
    setBuying(true)
    setBuyError('')
    try {
      const { data } = await api.post<Order>('/orders/', { product_id: Number(id) })
      // Hand the receipt over directly so the next page renders without a second request.
      navigate(`/receipt/${data.reference}`, { state: { order: data } })
    } catch (err) {
      setBuyError(errorMessage(err, 'The purchase could not be completed.'))
      setBuying(false)
    }
  }

  if (loading) {
    return <div className="h-64 animate-pulse rounded-xl bg-white/70" />
  }

  if (error || !product) {
    return (
      <div>
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        <Link to="/products" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
          Back to products
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link to="/products" className="text-sm text-indigo-600 hover:underline">
        Back to products
      </Link>

      <div className="mt-4 rounded-xl bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold sm:text-3xl">{product.title}</h1>
          <LocationBadge location={product.location} label={product.location_display} />
        </div>

        <p className="mt-4 text-slate-600">{product.description}</p>

        <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-200 pt-6 text-sm">
          <div>
            <dt className="text-slate-500">Price</dt>
            <dd className="mt-1 text-2xl font-semibold text-indigo-600">
              {formatPrice(product.price)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Available in</dt>
            <dd className="mt-1 font-medium">{product.location_display}</dd>
          </div>
        </dl>

        {buyError && (
          <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{buyError}</p>
        )}

        <button
          onClick={handleBuy}
          disabled={buying}
          className="mt-6 w-full rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {buying ? 'Processing...' : 'Buy now'}
        </button>
      </div>
    </div>
  )
}
