import api from '../api/axios'
import { cleanParams, validSlug } from '../utils/query'
export const getDestinations = (params = {}, signal) =>
  api
    .get('/api/destinations', { params: cleanParams(params), signal })
    .then((r) => r.data)
export const getFeaturedDestinations = (signal) =>
  api.get('/api/destinations/featured', { signal }).then((r) => r.data)

export const getDestinationBySlug = (slug, signal) => {
  if (!validSlug(slug)) return Promise.reject({ response: { status: 404 } })
  return api
    .get('/api/destinations/slug/' + encodeURIComponent(slug), { signal })
    .then((r) => r.data)
}
export const getDestinationById = (id, signal) =>
  api.get('/api/destinations/' + id, { signal }).then((r) => r.data)
