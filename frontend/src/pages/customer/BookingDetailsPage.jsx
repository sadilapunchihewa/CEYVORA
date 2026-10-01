import { useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getMyBooking } from '../../services/bookingService'
import useResource from '../../hooks/useResource'
import CustomerResource from '../../components/auth/CustomerResource'
import { BookingStatus } from './MyBookingsPage'
import { dateLabel } from '../../utils/customer'
export default function BookingDetailsPage() {
  const { id } = useParams()
  const resource = useResource(
    useCallback((signal) => getMyBooking(id, signal), [id]),
  )
  const booking = resource.data
  return (
    <>
      <Link to="/account/bookings">Back to my bookings</Link>
      <h1>Booking details</h1>
      <CustomerResource resource={resource}>
        {booking && (
          <>
            <BookingStatus status={booking.status} />
            <h2 className="booking-title">
              {booking.tour?.title || 'Sri Lanka journey'}
            </h2>
            {booking.status === 'Pending' && (
              <p>
                Your request is awaiting review. Your journey is not confirmed
                yet.
              </p>
            )}
            <dl className="customer-facts">
              {[
                ['Travel date', dateLabel(booking.travelDate)],
                [
                  'Travellers',
                  `${booking.adults} adults / ${booking.children} children`,
                ],
                ['Requested on', dateLabel(booking.createdAt)],
                ['Contact name', booking.customerName],
                ['Email', booking.email],
                ['Phone', booking.phone],
                ['Country', booking.country || 'Not provided'],
                [
                  'Special requests',
                  booking.specialRequests || 'None provided',
                ],
                [
                  'Total amount',
                  booking.totalAmount == null
                    ? 'To be agreed'
                    : `${Number(booking.totalAmount).toLocaleString('en-US')} (currency not supplied; please confirm with Ceyvora)`,
                ],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd className="preserve-lines">{value}</dd>
                </div>
              ))}
            </dl>
            {booking.tour && (
              <Link to={'/tours/' + booking.tour.slug}>View this journey</Link>
            )}
          </>
        )}
      </CustomerResource>
    </>
  )
}
