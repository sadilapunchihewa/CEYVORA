import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import AdminState from '../../components/admin/AdminState'
import AdminPagination from '../../components/admin/AdminPagination'
import StatusBadge from '../../components/admin/StatusBadge'
import { apiError, shortDate } from '../../utils/admin'
import * as service from '../../services/adminBookingService'
const statuses = ['Pending', 'Confirmed', 'Cancelled', 'Completed']
export default function BookingsAdminPage() {
  const [data, setData] = useState()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    service
      .listBookings({ page, pageSize: 10, status, search: query })
      .then(setData)
      .catch((e) => setError(apiError(e, 'Bookings could not be loaded.')))
  }, [page, status, query])
  return (
    <>
      <AdminPageHeader
        title="Bookings"
        description="Review customer trips and keep each booking moving."
      />
      <form
        className="admin-filters"
        onSubmit={(e) => {
          e.preventDefault()
          setPage(1)
          setQuery(search)
        }}
      >
        <input
          placeholder="Search customer or email"
          aria-label="Search bookings"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          aria-label="Booking status"
          value={status}
          onChange={(e) => {
            setPage(1)
            setStatus(e.target.value)
          }}
        >
          <option value="">All statuses</option>
          {statuses.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <button className="button button-outline">Search</button>
      </form>
      <AdminState
        loading={!data && !error}
        error={error}
        empty={data?.items.length === 0 && 'No bookings match these filters.'}
      >
        {data && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Customer</th>
                  <th>Travel date</th>
                  <th>Travellers</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((x) => (
                  <tr key={x.id}>
                    <td data-label="Booking">
                      #{x.id}
                      <small>Tour #{x.tourPackageId}</small>
                    </td>
                    <td data-label="Customer">
                      <strong>{x.customerName}</strong>
                      <small>{x.email}</small>
                    </td>
                    <td data-label="Travel date">{shortDate(x.travelDate)}</td>
                    <td data-label="Travellers">
                      {x.adults} adults
                      {x.children ? `, ${x.children} children` : ''}
                    </td>
                    <td data-label="Status">
                      <StatusBadge>{x.status}</StatusBadge>
                    </td>
                    <td data-label="Action">
                      <Link className="table-link" to={`${x.id}`}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminState>
      <AdminPagination
        page={page}
        totalPages={data?.totalPages || 1}
        onChange={setPage}
      />
    </>
  )
}
