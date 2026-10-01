import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import * as destinations from '../../services/adminDestinationService'
import * as tours from '../../services/adminTourService'
import * as bookings from '../../services/adminBookingService'
import * as enquiries from '../../services/adminEnquiryService'
import * as reviews from '../../services/adminReviewService'
const entries = [
  [
    'Destinations',
    '/admin/destinations',
    'Shape the places travellers discover.',
  ],
  ['Tour packages', '/admin/tours', 'Manage prices, routes and itineraries.'],
  ['Bookings', '/admin/bookings', 'Review and progress customer bookings.'],
  ['Enquiries', '/admin/enquiries', 'Follow up with prospective travellers.'],
  ['Reviews', '/admin/reviews', 'Moderate stories from completed trips.'],
]
export default function AdminDashboard() {
  const [counts, setCounts] = useState({})
  useEffect(() => {
    const c = new AbortController()
    Promise.allSettled([
      destinations.listDestinations({ pageSize: 1 }, c.signal),
      tours.listTours({ pageSize: 1 }, c.signal),
      bookings.listBookings({ status: 'Pending', pageSize: 1 }, c.signal),
      enquiries.listEnquiries({ status: 'New', pageSize: 1 }, c.signal),
      reviews.listReviews({ approved: false, pageSize: 1 }, c.signal),
    ]).then((r) =>
      setCounts(
        Object.fromEntries(
          r.map((x, i) => [
            i,
            x.status === 'fulfilled' ? x.value.totalItems : null,
          ]),
        ),
      ),
    )
    return () => c.abort()
  }, [])
  return (
    <>
      <AdminPageHeader
        title="Ceyvora Admin"
        description="Keep journeys accurate, respond to travellers, and publish the best of Sri Lanka."
      />
      <div className="admin-counts">
        {entries.map((x, i) => (
          <Link to={x[1]} key={x[0]}>
            <span>{counts[i] ?? '—'}</span>
            <strong>
              {i === 2
                ? 'Pending bookings'
                : i === 3
                  ? 'New enquiries'
                  : i === 4
                    ? 'Pending reviews'
                    : x[0]}
            </strong>
            <p>{x[2]}</p>
          </Link>
        ))}
      </div>
    </>
  )
}
