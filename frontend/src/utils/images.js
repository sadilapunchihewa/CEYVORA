import { apiBaseUrl } from '../api/axios'
export function resolveImageUrl(path) {
  if (typeof path !== 'string' || !path.trim()) return null
  try {
    const url = new URL(path, apiBaseUrl + '/')
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null
  } catch {
    return null
  }
}
