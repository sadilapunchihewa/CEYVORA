export function requestError(error, fallback) {
  const status = error.response?.status
  if (status === 401) return 'Your session has ended. Please sign in again.'
  if (status === 403) return 'Your account does not have access to this action.'
  if (status === 429)
    return 'Too many attempts. Please wait a minute and try again.'
  if (status === 400)
    return 'Please check the information you entered and try again.'
  if (status === 404) return 'This journey or booking is no longer available.'
  return fallback
}
export const dateLabel = (value) =>
  new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
export const tomorrow = () =>
  new Date(Date.now() + 86400000).toISOString().slice(0, 10)
export const validPhone = (value) =>
  /^[+\d\s().-]+$/.test(value) && /\d/.test(value)

export function safeReturn(value) {
  return typeof value === 'string' &&
    /^\/(account(?:\/|$)|tours\/[^/?#]+\/book(?:[?#]|$))/.test(value) &&
    !value.includes('\\')
    ? value
    : '/account'
}
