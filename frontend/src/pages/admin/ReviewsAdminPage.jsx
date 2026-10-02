import { useEffect, useState } from 'react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import AdminState from '../../components/admin/AdminState'
import AdminPagination from '../../components/admin/AdminPagination'
import StatusBadge from '../../components/admin/StatusBadge'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import { useToast } from '../../components/admin/toastContext'
import { apiError, shortDate } from '../../utils/admin'
import * as service from '../../services/adminReviewService'
export default function ReviewsAdminPage() {
  const [data, setData] = useState()
  const [page, setPage] = useState(1)
  const [approved, setApproved] = useState('false')
  const [rating, setRating] = useState('')
  const [error, setError] = useState('')
  const [target, setTarget] = useState()
  const toast = useToast()
  const load = () =>
    service
      .listReviews({ page, pageSize: 10, approved, rating })
      .then((value) => {
        setError('')
        setData(value)
      })
      .catch((e) => setError(apiError(e, 'Reviews could not be loaded.')))
  useEffect(() => {
    load()
  }, [page, approved, rating])
  const approve = async (id) => {
    try {
      await service.approveReview(id)
      toast.notify('Review approved.')
      load()
    } catch (e) {
      setError(apiError(e))
    }
  }
  const remove = async () => {
    try {
      await service.deleteReview(target.id)
      toast.notify('Review deleted.')
      setTarget()
      load()
    } catch (e) {
      setError(apiError(e))
    }
  }
  return (
    <>
      <AdminPageHeader
        title="Reviews"
        description="Approve useful traveller stories and remove unsuitable content."
      />
      <div className="admin-filters">
        <select
          aria-label="Approval status"
          value={approved}
          onChange={(e) => {
            setPage(1)
            setApproved(e.target.value)
          }}
        >
          <option value="">All reviews</option>
          <option value="false">Pending</option>
          <option value="true">Approved</option>
        </select>
        <select
          aria-label="Rating"
          value={rating}
          onChange={(e) => {
            setPage(1)
            setRating(e.target.value)
          }}
        >
          <option value="">All ratings</option>
          {[5, 4, 3, 2, 1].map((x) => (
            <option value={x} key={x}>
              {x} stars
            </option>
          ))}
        </select>
      </div>
      <AdminState
        loading={!data && !error}
        error={error}
        empty={data?.items.length === 0 && 'No reviews match these filters.'}
      >
        {data && (
          <div className="review-moderation">
            {data.items.map((x) => (
              <article key={x.id}>
                <div className="review-top">
                  <div>
                    <strong>{x.customerName}</strong>
                    <span>
                      Tour #{x.tourPackageId} · {shortDate(x.createdAt)}
                    </span>
                  </div>
                  <StatusBadge status={x.isApproved ? 'approved' : 'pending'}>
                    {x.isApproved ? 'Approved' : 'Pending'}
                  </StatusBadge>
                </div>
                <div
                  className="stars"
                  aria-label={`${x.rating} out of 5 stars`}
                >
                  {'★'.repeat(x.rating)}
                  {'☆'.repeat(5 - x.rating)}
                </div>
                <p>{x.comment}</p>
                <div className="table-actions">
                  {!x.isApproved && (
                    <button onClick={() => approve(x.id)}>Approve</button>
                  )}
                  <button onClick={() => setTarget(x)}>Delete</button>
                </div>
              </article>
            ))}
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
        title="Delete review?"
        confirmLabel="Delete review"
        onClose={() => setTarget()}
        onConfirm={remove}
      >
        This review from {target?.customerName} will be permanently removed.
      </ConfirmDialog>
    </>
  )
}
