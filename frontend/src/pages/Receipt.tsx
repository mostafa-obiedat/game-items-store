import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import api from '../api/client'
import { errorMessage } from '../api/errors'
import type { Order } from '../api/types'
import { formatDate, formatPrice } from '../utils/format'

export default function Receipt() {
  const { reference } = useParams()
  const location = useLocation()
  const passedOrder = (location.state as { order?: Order })?.order ?? null

  const [order, setOrder] = useState<Order | null>(passedOrder)
  const [loading, setLoading] = useState(!passedOrder)
  const [error, setError] = useState('')

  useEffect(() => {
    // Only fetch when the page was opened directly, e.g. after a refresh.
    if (passedOrder) return

    let active = true
    api
      .get<Order>(`/orders/${reference}/`)
      .then(({ data }) => active && setOrder(data))
      .catch((err) => active && setError(errorMessage(err, 'This receipt could not be found.')))
      .finally(() => active && setLoading(false))

    return () => {
      active = false
    }
  }, [reference, passedOrder])

  if (loading) {
    return <div className="h-64 animate-pulse rounded-xl bg-white/70" />
  }

  if (error || !order) {
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
    <div className="mx-auto max-w-lg">
      <div className="rounded-xl bg-white p-6 shadow-sm sm:p-8">
        <div className="border-b border-dashed border-slate-300 pb-5 text-center">
          <p className="text-sm font-medium text-emerald-600">Purchase complete</p>
          <h1 className="mt-1 text-2xl font-bold">Receipt</h1>
        </div>

        <dl className="mt-5 space-y-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Item</dt>
            <dd className="text-right font-semibold">{order.product.title}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Location</dt>
            <dd className="text-right">{order.product.location_display}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Buyer</dt>
            <dd className="text-right">{order.buyer}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Date</dt>
            <dd className="text-right">{formatDate(order.created_at)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Order number</dt>
            <dd className="text-right font-mono font-medium tracking-wide">{order.reference}</dd>
          </div>
        </dl>

        <div className="mt-5 flex justify-between border-t border-dashed border-slate-300 pt-5">
          <span className="font-medium">Total paid</span>
          <span className="text-xl font-bold text-indigo-600">{formatPrice(order.price)}</span>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link
          to="/products"
          className="inline-block rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-medium transition hover:bg-slate-100"
        >
          Back to store
        </Link>
      </div>
    </div>
  )
}
