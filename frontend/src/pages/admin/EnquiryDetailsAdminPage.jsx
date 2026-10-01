import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import AdminState from '../../components/admin/AdminState'
import StatusBadge from '../../components/admin/StatusBadge'
import { useToast } from '../../components/admin/toastContext'
import { apiError, shortDate } from '../../utils/admin'
import * as service from '../../services/adminEnquiryService'
const statuses = ['New', 'InProgress', 'Resolved', 'Closed']
export default function EnquiryDetailsAdminPage() {
  const { id } = useParams()
  const [data, setData] = useState()
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const toast = useToast()
  const load = () =>
    service
      .getEnquiry(id)
      .then((x) => {
        setData(x)
        setStatus(x.status)
      })
      .catch((e) => setError(apiError(e, 'Enquiry could not be loaded.')))
  useEffect(load, [id])
  const update = async () => {
    try {
      await service.updateEnquiryStatus(id, status)
      toast.notify('Enquiry status updated.')
      load()
    } catch (e) {
      setError(apiError(e))
    }
  }
  return (
    <>
      <AdminPageHeader
        title={`Enquiry #${id}`}
        description="Full traveller request and contact details."
      />
      <AdminState loading={!data && !error} error={error}>
        {data && (
          <>
            <section className="admin-detail">
              <div>
                <span>Name</span>
                <strong>{data.name}</strong>
              </div>
              <div>
                <span>Email</span>
                <a href={`mailto:${data.email}`}>{data.email}</a>
              </div>
              <div>
                <span>Phone</span>
                <a href={`tel:${data.phone}`}>{data.phone}</a>
              </div>
              <div>
                <span>Country</span>
                <strong>{data.country || '—'}</strong>
              </div>
              <div>
                <span>Arrival</span>
                <strong>{shortDate(data.arrivalDate)}</strong>
              </div>
              <div>
                <span>Travellers</span>
                <strong>{data.numberOfTravellers}</strong>
              </div>
              <div>
                <span>Interested tour</span>
                <strong>
                  {data.tourPackageId
                    ? `#${data.tourPackageId}`
                    : 'General enquiry'}
                </strong>
              </div>
              <div>
                <span>Created</span>
                <strong>{shortDate(data.createdAt)}</strong>
              </div>
              <div>
                <span>Status</span>
                <StatusBadge>{data.status}</StatusBadge>
              </div>
              <div className="wide">
                <span>Message</span>
                <p>{data.message}</p>
              </div>
            </section>
            <section className="admin-panel status-update">
              <h2>Update status</h2>
              <select
                aria-label="Enquiry status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {statuses.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
              <button
                className="button button-primary"
                disabled={status === data.status}
                onClick={update}
              >
                Save status
              </button>
            </section>
            <Link className="text-link" to="/admin/enquiries">
              Back to enquiries
            </Link>
          </>
        )}
      </AdminState>
    </>
  )
}
