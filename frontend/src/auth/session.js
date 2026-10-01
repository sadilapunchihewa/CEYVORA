const key = 'ceyvora.accessToken'
let token = sessionStorage.getItem(key)
const listeners = new Set()
export const getToken = () => token
export function setToken(value) {
  token = value
  if (value) sessionStorage.setItem(key, value)
  else sessionStorage.removeItem(key)
  listeners.forEach((listener) => listener(value))
}
export function subscribeSession(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
