export type Location = 'JO' | 'SA'

export interface Product {
  id: number
  title: string
  description: string
  price: string
  location: Location
  location_display: string
}

export interface Order {
  reference: string
  product: Product
  price: string
  buyer: string
  created_at: string
}

export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
