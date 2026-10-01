import axios from 'axios'
import { getToken, setToken } from '../auth/session'
export const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
).replace(/\/+$/, '')
const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
  headers: { Accept: 'application/json' },
})
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token && !config.skipAuth)
    config.headers.Authorization = `Bearer ${token}`
  return config
})
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // A late response from a previous session must not clear a newer login.
    const sent = error.config?.headers?.Authorization
    if (
      error.response?.status === 401 &&
      sent &&
      sent === `Bearer ${getToken()}`
    )
      setToken(null)
    return Promise.reject(error)
  },
)
export default api
