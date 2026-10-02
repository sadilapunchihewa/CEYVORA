import { apiBaseUrl } from '../api/axios'
export function resolveImageUrl(path) {
  if (typeof path !== 'string' || !path.trim()) return null
  if (
    /^\/images\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.(?:jpg|jpeg|png|webp|avif)$/i.test(
      path,
    )
  )
    return path
  try {
    const url = new URL(path, apiBaseUrl + '/')
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null
  } catch {
    return null
  }
}
