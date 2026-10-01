import api from '../api/axios'
import { cleanParams } from '../utils/query'
export const listEnquiries = (params = {}, signal) =>
  api
    .get('/api/enquiries', { params: cleanParams(params), signal })
    .then((r) => r.data)
export const getEnquiry = (id, signal) =>
  api.get(`/api/enquiries/${id}`, { signal }).then((r) => r.data)
export const updateEnquiryStatus = (id, status) =>
  api.put(`/api/enquiries/${id}/status`, { status })
