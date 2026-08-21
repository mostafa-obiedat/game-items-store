import { AxiosError } from 'axios'

/** Pull something readable out of a DRF error response. */
export function errorMessage(error: unknown, fallback = 'Something went wrong.') {
  if (!(error instanceof AxiosError) || !error.response) {
    return fallback
  }

  const data = error.response.data
  if (typeof data === 'string') return data
  if (data?.detail) return data.detail

  // Field errors come back as { field: ["message", ...] }
  const first = Object.values(data ?? {})[0]
  if (Array.isArray(first) && first.length) return String(first[0])

  return fallback
}
