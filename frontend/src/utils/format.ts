/** Prices arrive as decimal strings so they keep their precision in transit. */
export function formatPrice(price: string) {
  return `${Number(price).toFixed(2)} USD`
}

export function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}
