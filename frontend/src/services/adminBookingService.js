import api from '../api/axios'
import { cleanParams } from '../utils/query'
export const listBookings = (params = {}, signal) =>
  api
    .get('/api/bookings', { params: cleanParams(params), signal })
    .then((r) => r.data)
export const getBooking = (id, signal) =>
  api.get(`/api/bookings/${id}`, { signal }).then((r) => r.data)
export const updateBookingStatus = (id, status) =>
  api.put(`/api/bookings/${id}/status`, { status })
