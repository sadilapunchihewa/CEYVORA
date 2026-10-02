import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import AdminState from '../../components/admin/AdminState'
import StatusBadge from '../../components/admin/StatusBadge'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import { useToast } from '../../components/admin/toastContext'
import { apiError, money, shortDate } from '../../utils/admin'
import * as service from '../../services/adminBookingService'
const statuses = ['Pending', 'Confirmed', 'Cancelled', 'Completed']
export default function BookingDetailsAdminPage() {
  const { id } = useParams()
  const [data, setData] = useState()
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()
  const load = () =>
    service
      .getBooking(id)
      .then((x) => {
        setError('')
        setData(x)
        setNext(x.status)
      })
      .catch((e) => setError(apiError(e, 'Booking could not be loaded.')))
  useEffect(() => {
    load()
  }, [id])
  const update = async () => {
    try {
      await service.updateBookingStatus(id, next)
      toast.notify('Booking status updated.')
      setConfirm(false)
      load()
    } catch (e) {
      setError(apiError(e))
    }
  }
  return (
    <>
      <AdminPageHeader
        title={`Booking #${id}`}
        description="Customer and travel details for this booking."
      />
      <AdminState loading={!data && !error} error={error}>
        {data && (
          <>
            <section className="admin-detail">
              <div>
                <span>Customer</span>
                <strong>{data.customerName}</strong>
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
                <span>Tour package</span>
                <strong>#{data.tourPackageId}</strong>
              </div>
              <div>
                <span>Travel date</span>
                <strong>{shortDate(data.travelDate)}</strong>
              </div>
              <div>
                <span>Travellers</span>
                <strong>
                  {data.adults} adults, {data.children} children
                </strong>
              </div>
              <div>
                <span>Total amount</span>
                <strong>
                  {data.totalAmount == null
                    ? 'Not set'
                    : money(data.totalAmount)}
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
                <span>Special requests</span>
                <p>{data.specialRequests || 'No special requests.'}</p>
              </div>
            </section>
            <section className="admin-panel status-update">
              <h2>Update status</h2>
              <select
                aria-label="Booking status"
                value={next}
                onChange={(e) => setNext(e.target.value)}
              >
                {statuses.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
              <button
                className="button button-primary"
                disabled={next === data.status}
                onClick={() => setConfirm(true)}
              >
                Save status
              </button>
            </section>
            <Link className="text-link" to="/admin/bookings">
              Back to bookings
            </Link>
          </>
        )}
      </AdminState>
      <ConfirmDialog
        open={confirm}
        title={`Change status to ${next}?`}
        danger={next === 'Cancelled'}
        confirmLabel="Change status"
        onClose={() => setConfirm(false)}
        onConfirm={update}
      >
        The booking will be marked {next.toLowerCase()}.
      </ConfirmDialog>
    </>
  )
}
