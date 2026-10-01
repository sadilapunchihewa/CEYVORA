import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import AdminState from '../../components/admin/AdminState'
import AdminPagination from '../../components/admin/AdminPagination'
import StatusBadge from '../../components/admin/StatusBadge'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import { useToast } from '../../components/admin/toastContext'
import { resolveImageUrl } from '../../utils/images'
import { apiError } from '../../utils/admin'
import * as service from '../../services/adminDestinationService'
export default function DestinationsAdminPage() {
  const [data, setData] = useState()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [target, setTarget] = useState()
  const toast = useToast()
  const load = () => {
    service
      .listDestinations({ page, pageSize: 10, search: query })
      .then(setData)
      .catch((e) => setError(apiError(e, 'Destinations could not be loaded.')))
  }
  useEffect(load, [page, query])
  const remove = async () => {
    try {
      await service.deactivateDestination(target.id)
      toast.notify('Destination deactivated.')
      setTarget()
      load()
    } catch (e) {
      setError(apiError(e))
    }
  }
  return (
    <>
      <AdminPageHeader
        title="Destinations"
        description="Manage the places shown across the public website."
        action="Add destination"
        to="/admin/destinations/new"
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
          aria-label="Search destinations"
          placeholder="Search name, district or province"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="button button-outline">Search</button>
      </form>
      <AdminState
        loading={!data && !error}
        error={error}
        empty={data?.items.length === 0 && 'No destinations found.'}
      >
        {data && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Destination</th>
                  <th>Location</th>
                  <th>Featured</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((x) => (
                  <tr key={x.id}>
                    <td data-label="Destination">
                      <div className="admin-identity">
                        {resolveImageUrl(x.imageUrl) ? (
                          <img src={resolveImageUrl(x.imageUrl)} alt="" />
                        ) : (
                          <span />
                        )}
                        <strong>{x.name}</strong>
                      </div>
                    </td>
                    <td data-label="Location">
                      {[x.district, x.province].filter(Boolean).join(', ') ||
                        '—'}
                    </td>
                    <td data-label="Featured">
                      <StatusBadge
                        status={x.isFeatured ? 'featured' : 'standard'}
                      >
                        {x.isFeatured ? 'Featured' : 'Standard'}
                      </StatusBadge>
                    </td>
                    <td data-label="Status">
                      <StatusBadge status={x.isActive ? 'active' : 'inactive'}>
                        {x.isActive ? 'Active' : 'Inactive'}
                      </StatusBadge>
                    </td>
                    <td data-label="Actions">
                      <div className="table-actions">
                        <Link to={`${x.id}/edit`}>Edit</Link>
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
        title="Deactivate destination?"
        confirmLabel="Deactivate"
        onClose={() => setTarget()}
        onConfirm={remove}
      >
        This removes “{target?.name}” from the public website.
      </ConfirmDialog>
    </>
  )
}
