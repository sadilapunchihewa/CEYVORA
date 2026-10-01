import api from '../api/axios'
import { cleanParams } from '../utils/query'
export const listReviews = (params = {}, signal) =>
  api
    .get('/api/reviews', { params: cleanParams(params), signal })
    .then((r) => r.data)
export const approveReview = (id) => api.put(`/api/reviews/${id}/approve`)
export const deleteReview = (id) => api.delete(`/api/reviews/${id}`)
