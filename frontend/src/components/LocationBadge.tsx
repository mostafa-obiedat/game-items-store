import type { Location } from '../api/types'

const styles: Record<Location, string> = {
  JO: 'bg-emerald-100 text-emerald-700',
  SA: 'bg-amber-100 text-amber-700',
}

interface Props {
  location: Location
  label?: string
}

export default function LocationBadge({ location, label }: Props) {
  return (
    <span
      title={label}
      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${styles[location]}`}
    >
      {location}
    </span>
  )
}
