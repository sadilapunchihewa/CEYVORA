import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import AdminState from '../../components/admin/AdminState'
import AdminPagination from '../../components/admin/AdminPagination'
import StatusBadge from '../../components/admin/StatusBadge'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import { useToast } from '../../components/admin/toastContext'
import { resolveImageUrl } from '../../utils/images'
import { apiError, money } from '../../utils/admin'
import * as service from '../../services/adminTourService'
export default function ToursAdminPage() {
  const [data, setData] = useState()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [target, setTarget] = useState()
  const toast = useToast()
  const load = () =>
    service
      .listTours({ page, pageSize: 10, search: query })
      .then(setData)
      .catch((e) => setError(apiError(e, 'Tours could not be loaded.')))
  useEffect(load, [page, query])
  const remove = async () => {
    try {
      await service.deactivateTour(target.id)
      toast.notify('Tour deactivated.')
      setTarget()
      load()
    } catch (e) {
      setError(apiError(e))
    }
  }
  return (
    <>
      <AdminPageHeader
        title="Tour packages"
        description="Manage offers, routes, itinerary days and hero images."
        action="Add tour package"
        to="/admin/tours/new"
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
          aria-label="Search tours"
          placeholder="Search title or description"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="button button-outline">Search</button>
      </form>
      <AdminState
        loading={!data && !error}
        error={error}
        empty={data?.items.length === 0 && 'No tour packages found.'}
      >
        {data && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tour package</th>
                  <th>Duration</th>
                  <th>Starting price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((x) => (
                  <tr key={x.id}>
                    <td data-label="Tour package">
                      <div className="admin-identity">
                        {resolveImageUrl(x.heroImageUrl) ? (
                          <img src={resolveImageUrl(x.heroImageUrl)} alt="" />
                        ) : (
                          <span />
                        )}
                        <div>
                          <strong>{x.title}</strong>
                          {x.isFeatured && <small>Featured</small>}
                        </div>
                      </div>
                    </td>
                    <td data-label="Duration">
                      {x.durationDays} days / {x.durationNights} nights
                    </td>
                    <td data-label="Starting price">
                      {money(x.startingPrice, x.currency)}
                    </td>
                    <td data-label="Status">
                      <StatusBadge status={x.isActive ? 'active' : 'inactive'}>
                        {x.isActive ? 'Active' : 'Inactive'}
                      </StatusBadge>
                    </td>
                    <td data-label="Actions">
                      <div className="table-actions">
                        <Link to={`${x.id}/edit`}>Edit</Link>
                        <Link to={`${x.id}/itinerary`}>Itinerary</Link>
                        <button onClick={() => setTarget(x)}>Deactivate</button>
                      </div>
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
      <ConfirmDialog
        open={Boolean(target)}
        title="Deactivate tour package?"
        confirmLabel="Deactivate"
        onClose={() => setTarget()}
        onConfirm={remove}
      >
        This removes “{target?.title}” from the public website.
      </ConfirmDialog>
    </>
  )
}
