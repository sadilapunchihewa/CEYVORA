import LoadingSpinner from '../common/LoadingSpinner'
import Button from '../common/Button'
export default function CustomerResource({ resource, children }) {
  if (resource.loading) return <LoadingSpinner label="Loading your bookings…" />
  if (resource.error)
    return (
      <div role="alert" className="resource-state">
        <h2>
          {resource.status === 404
            ? 'Booking not found'
            : resource.status === 403
              ? 'This booking isn’t available to your account.'
              : 'We couldn’t load your bookings.'}
        </h2>
        <p>
          {[403, 404].includes(resource.status)
            ? 'Return to your bookings to view your own travel requests.'
            : 'Please check your connection and try again.'}
        </p>
        {[403, 404].includes(resource.status) ? (
          <Button to="/account/bookings">My bookings</Button>
        ) : (
          <Button onClick={resource.retry}>Try again</Button>
        )}
      </div>
    )
  return children
}
