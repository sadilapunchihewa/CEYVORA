import { enquiryInterest } from '../../utils/enquiries'
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import AdminState from '../../components/admin/AdminState'
import { apiError, shortDate } from '../../utils/admin'
import * as service from '../../services/adminEnquiryService'
export default function EnquiryDetailsAdminPage() {
  const { id } = useParams()
  const [data, setData] = useState()
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  async function markReplied() {
    setSaving(true)
    try {
      await service.updateEnquiryStatus(id, 'Replied')
      await load()
    } catch (e) {
      setError(apiError(e, 'Could not save the reply marker.'))
    } finally {
      setSaving(false)
    }
  }
  const load = useCallback(
    () =>
      service
        .getEnquiry(id)
        .then((x) => {
          setError('')
          setData(x)
        })
        .catch((e) => setError(apiError(e, 'Enquiry could not be loaded.'))),
    [id],
  )
  useEffect(() => {
    load()
  }, [load])
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
                <strong>{enquiryInterest(data)}</strong>
              </div>
              <div>
                <span>Created</span>
                <strong>{shortDate(data.createdAt)}</strong>
              </div>
              <div className="wide">
                <span>Message</span>
                <p>{data.message}</p>
              </div>
            </section>
            <section className="admin-panel enquiry-follow-up">
              <h2>Contact traveller</h2>
              <p>
                {data.status === 'Replied'
                  ? 'Marked as replied'
                  : 'Not marked as replied'}
              </p>
              <button
                className="button button-outline"
                disabled={saving || data.status === 'Replied'}
                onClick={markReplied}
              >
                {saving ? 'Saving…' : 'Mark as replied'}
              </button>
              <p className="muted">
                Mark this only after sending your reply. Opening Gmail does not
                send an email.
              </p>
              <div className="button-row">
                <a
                  className="button button-primary"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={
                    'https://mail.google.com/mail/?' +
                    new URLSearchParams({
                      authuser: 'ceyvora@gmail.com',
                      view: 'cm',
                      fs: '1',
                      to: data.email,
                      su: `Your Ceyvora journey enquiry #${data.id}`,
                      body: `Hello ${data.name},\n\nThank you for your journey enquiry #${data.id}. We would love to help plan your Sri Lanka trip.\n\nCould you confirm your preferred travel dates, accommodation style and the experiences you would like to include?\n\nKind regards,\nCeyvora`,
                    }).toString()
                  }
                >
                  Reply in Gmail
                </a>
              </div>
              <p className="muted">
                Opens a ready-to-edit Gmail draft addressed to {data.email}.
                Review it and send from Gmail.
              </p>
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
