import api from '../api/axios'
import { cleanParams } from '../utils/query'
export const listTours = (params = {}, signal) =>
  api
    .get('/api/tourpackages', { params: cleanParams(params), signal })
    .then((r) => r.data)
export const getTour = (id, signal) =>
  api.get(`/api/tourpackages/${id}`, { signal }).then((r) => r.data)
export const createTour = (data) =>
  api.post('/api/tourpackages', data).then((r) => r.data)
export const updateTour = (id, data) => api.put(`/api/tourpackages/${id}`, data)
export const deactivateTour = (id) => api.delete(`/api/tourpackages/${id}`)
export const uploadTourImage = (id, file) => {
  const data = new FormData()
  data.append('file', file)
  return api.post(`/api/tourpackages/${id}/image`, data).then((r) => r.data)
}
export const getItinerary = (id, signal) =>
  api.get(`/api/tourpackages/${id}/itinerary`, { signal }).then((r) => r.data)
export const createItineraryDay = (id, data) =>
  api.post(`/api/tourpackages/${id}/itinerary`, data).then((r) => r.data)
export const updateItineraryDay = (id, data) =>
  api.put(`/api/itinerary/${id}`, data)
export const deleteItineraryDay = (id) => api.delete(`/api/itinerary/${id}`)
export const getTourDestinations = (id, signal) =>
  api
    .get(`/api/tourpackages/${id}/destinations`, { signal })
    .then((r) => r.data)
export const attachDestination = (tourId, destinationId, visitOrder) =>
  api.post(`/api/tourpackages/${tourId}/destinations/${destinationId}`, null, {
    params: { visitOrder },
  })
export const updateDestinationOrder = (tourId, destinationId, visitOrder) =>
  api.put(`/api/tourpackages/${tourId}/destinations/${destinationId}/order`, {
    visitOrder,
  })
export const removeDestination = (tourId, destinationId) =>
  api.delete(`/api/tourpackages/${tourId}/destinations/${destinationId}`)
