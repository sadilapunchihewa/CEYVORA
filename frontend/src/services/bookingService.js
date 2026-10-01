import api from '../api/axios'
import { getTourPackageById } from './tourPackageService'
export const createBooking = (data) =>
  api.post('/api/bookings', data).then((r) => r.data)
async function withTours(bookings, signal) {
  const ids = [...new Set(bookings.map((b) => b.tourPackageId))]
  const tours = await Promise.all(
    ids.map(async (id) => {
      try {
        return [id, await getTourPackageById(id, signal)]
      } catch {
        return [id, null]
      }
    }),
  )
  const byId = new Map(tours)
  return bookings.map((b) => ({ ...b, tour: byId.get(b.tourPackageId) }))
}
export async function getMyBookings(signal) {
  const { data } = await api.get('/api/bookings/my', { signal })
  return withTours(data, signal)
}
export async function getMyBooking(id, signal) {
  if (!/^[1-9]\d*$/.test(id)) throw { response: { status: 404 } }
  const { data } = await api.get('/api/bookings/my/' + id, { signal })
  return (await withTours([data], signal))[0]
}
