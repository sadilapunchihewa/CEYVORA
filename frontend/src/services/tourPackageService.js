import api from '../api/axios'
import { cleanParams, validSlug } from '../utils/query'
export const getTourPackageById = (id, signal) =>
  api.get('/api/tourpackages/' + id, { signal }).then((r) => r.data)
export const getTourPackages = (params = {}, signal) =>
  api
    .get('/api/tourpackages', { params: cleanParams(params), signal })
    .then((r) => r.data)
export const getFeaturedTourPackages = (signal) =>
  api.get('/api/tourpackages/featured', { signal }).then((r) => r.data)

export const getTourPackageBySlug = (slug, signal) => {
  if (!validSlug(slug)) return Promise.reject({ response: { status: 404 } })
  return api
    .get('/api/tourpackages/slug/' + encodeURIComponent(slug), { signal })
    .then((r) => r.data)
}
