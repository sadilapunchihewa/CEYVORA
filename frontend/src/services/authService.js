import api from '../api/axios'
export const login = (data) =>
  api.post('/api/auth/login', data, { skipAuth: true }).then((r) => r.data)
export const register = (data) =>
  api.post('/api/auth/register', data, { skipAuth: true }).then((r) => r.data)
export const getCurrentUser = () => api.get('/api/auth/me').then((r) => r.data)
