import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import AdminState from '../../components/admin/AdminState'
import AdminPagination from '../../components/admin/AdminPagination'
import StatusBadge from '../../components/admin/StatusBadge'
import { apiError, shortDate } from '../../utils/admin'
import * as service from '../../services/adminEnquiryService'
const statuses = ['New', 'InProgress', 'Resolved', 'Closed']
export default function EnquiriesAdminPage() {
  const [data, setData] = useState()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    service
      .listEnquiries({ page, pageSize: 10, status, search: query })
      .then(setData)
      .catch((e) => setError(apiError(e, 'Enquiries could not be loaded.')))
  }, [page, status, query])
  return (
    <>
      <AdminPageHeader
        title="Enquiries"
        description="Follow up on traveller questions and quote requests."
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
          placeholder="Search name, email or country"
          aria-label="Search enquiries"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={status}
          aria-label="Enquiry status"
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
        empty={data?.items.length === 0 && 'No enquiries match these filters.'}
      >
        {data && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Traveller</th>
                  <th>Arrival</th>
                  <th>Travellers</th>
                  <th>Interested tour</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((x) => (
                  <tr key={x.id}>
                    <td data-label="Traveller">
                      <strong>{x.name}</strong>
                      <small>{x.email}</small>
                    </td>
                    <td data-label="Arrival">{shortDate(x.arrivalDate)}</td>
                    <td data-label="Travellers">{x.numberOfTravellers}</td>
                    <td data-label="Interested tour">
                      {x.tourPackageId ? `#${x.tourPackageId}` : 'General'}
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
