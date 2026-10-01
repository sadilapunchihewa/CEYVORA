import api from '../api/axios'
export const createReview = (data) =>
  api.post('/api/reviews', data).then((r) => r.data)
export const getPackageReviews = (id, signal) =>
  api.get('/api/reviews/package/' + id, { signal }).then((r) => r.data)
