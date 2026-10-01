export function apiError(
  error,
  fallback = 'The action could not be completed.',
) {
  if (error.response?.status === 403)
    return "You don't have permission to access this area."
  const data = error.response?.data
  if (typeof data?.message === 'string') return data.message
  if (data?.errors) return Object.values(data.errors).flat().join(' ')
  return fallback
}
export const shortDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      })
    : '—'
export const money = (value, currency = 'USD') =>
  new Intl.NumberFormat('en', { style: 'currency', currency }).format(
    value || 0,
  )
export const validImage = (file) =>
  ['image/jpeg', 'image/png', 'image/webp'].includes(file?.type) &&
  file.size <= 5 * 1024 * 1024
