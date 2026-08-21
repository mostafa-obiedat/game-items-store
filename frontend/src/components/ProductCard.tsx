import { Link } from 'react-router-dom'
import type { Product } from '../api/types'
import LocationBadge from './LocationBadge'
import { formatPrice } from '../utils/format'

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      to={`/products/${product.id}`}
      className="flex flex-col rounded-xl bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-bold leading-snug">{product.title}</h2>
        <LocationBadge location={product.location} label={product.location_display} />
      </div>

      <p className="mt-2 flex-1 text-sm text-slate-500">{product.description}</p>

      <p className="mt-4 text-xl font-semibold text-indigo-600">
        {formatPrice(product.price)}
      </p>
    </Link>
  )
}
