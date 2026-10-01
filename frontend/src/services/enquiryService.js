import api from '../api/axios'
export const createEnquiry = (payload) =>
  api.post('/api/enquiries', payload).then((r) => r.data)
