import { enquiryInterest } from '../../utils/enquiries'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import AdminState from '../../components/admin/AdminState'
import AdminPagination from '../../components/admin/AdminPagination'
import { apiError, shortDate } from '../../utils/admin'
import * as service from '../../services/adminEnquiryService'
export default function EnquiriesAdminPage() {
  const [params, setParams] = useSearchParams()
  const [data, setData] = useState()
  const rawPage = Number(params.get('page'))
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1
  const query = params.get('search') || ''
  const [search, setSearch] = useState(query)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [refresh, setRefresh] = useState(0)
  function updateFilters(changes) {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, String(value))
      else next.delete(key)
    }
    setParams(next)
  }
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    service
      .listEnquiries({ page, pageSize: 10, search: query }, controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setData(value)
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setError(
            apiError(
              e,
              'Enquiries could not be loaded. Try refreshing the list.',
            ),
          )
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [page, query, refresh])
  return (
    <>
      <AdminPageHeader
        title="Traveller enquiries"
        description="Review trip requests, contact travellers by email or phone, and follow up by email or phone."
      />
      <form
        className="admin-filters"
        onSubmit={(e) => {
          e.preventDefault()
          updateFilters({ page: 1, search: search.trim() })
        }}
      >
        <input
          placeholder="Search traveller, email, country or journey"
          aria-label="Search enquiries"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="button button-outline">Search</button>
        {query && (
          <button
            type="button"
            className="button button-outline"
            onClick={() => {
              setSearch('')
              setParams({})
            }}
          >
            Clear filters
          </button>
        )}
        <button
          type="button"
          className="button button-outline"
          disabled={loading}
          onClick={() => setRefresh((value) => value + 1)}
        >
          Refresh
        </button>
      </form>
      {data && !loading && !error && (
        <p role="status">
          {data.totalItems} {data.totalItems === 1 ? 'request' : 'requests'}
        </p>
      )}
      <AdminState
        loading={loading}
        error={error}
        empty={
          !loading &&
          data?.items.length === 0 &&
          'No enquiries match. Clear filters or refresh to check for new requests.'
        }
      >
        {data && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Reference / Traveller</th>
                  <th>Contact</th>
                  <th>Travel details</th>
                  <th>Received</th>
                  <th>Journey request</th>
                  <th>Reply</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((x) => (
                  <tr key={x.id}>
                    <td data-label="Traveller">
                      <small>CEY-{x.id}</small>
                      <strong>{x.name}</strong>
                      <small>{x.country || 'Country not provided'}</small>
                    </td>
                    <td data-label="Contact">
                      <a href={'mailto:' + x.email}>{x.email}</a>
                      <small>
                        <a href={'tel:' + x.phone.replace(/[^+\d]/g, '')}>
                          {x.phone}
                        </a>
                      </small>
                    </td>
                    <td data-label="Travel details">
                      {x.arrivalDate
                        ? shortDate(x.arrivalDate)
                        : 'Dates flexible'}
                      <small>{x.numberOfTravellers} travellers</small>
                    </td>
                    <td data-label="Received">{shortDate(x.createdAt)}</td>
                    <td data-label="Journey request">{enquiryInterest(x)}</td>
                    <td data-label="Reply">
                      {x.status === 'Replied' ? 'Replied' : 'Not marked'}
                    </td>
                    <td data-label="Action">
                      <Link className="table-link" to={`${x.id}`}>
                        Review request
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
        onChange={(value) => updateFilters({ page: value })}
      />
    </>
  )
}
