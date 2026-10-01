import { getMyBookings } from '../../services/bookingService'
import useResource from '../../hooks/useResource'
import CustomerResource from '../../components/auth/CustomerResource'
import Button from '../../components/common/Button'
import TravelImage from '../../components/common/TravelImage'
import { dateLabel } from '../../utils/customer'
export function BookingStatus({ status }) {
  const known = ['Pending', 'Confirmed', 'Cancelled', 'Completed'].includes(
    status,
  )
  return (
    <span
      className={
        'booking-status status-' + (known ? status.toLowerCase() : 'unknown')
      }
    >
      {known ? status : 'Status unavailable'}
    </span>
  )
}
export default function MyBookingsPage() {
  const resource = useResource(getMyBookings)
  return (
    <>
      <h1>My bookings</h1>
      <p className="customer-intro">
        Your Sri Lankan journeys, from first request to final plans.
      </p>
      <CustomerResource resource={resource}>
        {resource.data?.length ? (
          <div className="booking-list">
            {resource.data.map((booking) => (
              <article className="booking-entry" key={booking.id}>
                <TravelImage
                  path={booking.tour?.heroImageUrl}
                  alt={booking.tour?.title || 'Sri Lanka journey'}
                />
                <div>
                  <BookingStatus status={booking.status} />
                  <h2>{booking.tour?.title || 'Sri Lanka journey'}</h2>
                  <p>
                    {dateLabel(booking.travelDate)}
                    <br />
                    {booking.adults} adults / {booking.children} children
                  </p>
                  <small>Requested {dateLabel(booking.createdAt)}</small>
                  <Button
                    to={'/account/bookings/' + booking.id}
                    variant="outline"
                  >
                    View booking
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="resource-state">
            <h2>No journeys booked yet.</h2>
            <p>Discover a journey and tell us when you’d like to travel.</p>
            <Button to="/tours">Explore tours</Button>
          </div>
        )}
      </CustomerResource>
    </>
  )
}
