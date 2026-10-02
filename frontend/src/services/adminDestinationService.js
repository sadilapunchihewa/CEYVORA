import api from '../api/axios'
import { cleanParams } from '../utils/query'
export const listDestinations = (params = {}, signal) =>
  api
    .get('/api/destinations', {
      params: cleanParams({ ...params, includeInactive: true }),
      signal,
    })
    .then((r) => r.data)
export const getDestination = (id, signal) =>
  api
    .get(`/api/destinations/${id}`, {
      params: { includeInactive: true },
      signal,
    })
    .then((r) => r.data)
export const createDestination = (data) =>
  api.post('/api/destinations', data).then((r) => r.data)
export const updateDestination = (id, data) =>
  api.put(`/api/destinations/${id}`, data)
export const deactivateDestination = (id) =>
  api.delete(`/api/destinations/${id}`)
export const uploadDestinationImage = (id, file) => {
  const data = new FormData()
  data.append('file', file)
  return api.post(`/api/destinations/${id}/image`, data).then((r) => r.data)
}
