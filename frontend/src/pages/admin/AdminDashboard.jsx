import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import {
  listEnquiries,
  getEnquirySummary,
} from '../../services/adminEnquiryService'
import { shortDate } from '../../utils/admin'
import { enquiryInterest } from '../../utils/enquiries'
export default function AdminDashboard() {
  const [summary, setSummary] = useState(null)
  const [chartError, setChartError] = useState('')
  const [total, setTotal] = useState(null)
  const [recent, setRecent] = useState([])
  const [error, setError] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    getEnquirySummary(controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setSummary(value)
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setChartError('Enquiry analytics could not be loaded.')
      })
    listEnquiries({ pageSize: 5 }, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setRecent(data.items)
          setTotal(data.totalItems)
        }
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError(
            'Enquiries could not be loaded. Open traveller enquiries to retry.',
          )
      })
    return () => controller.abort()
  }, [])
  return (
    <>
      <AdminPageHeader
        title="Your travel desk"
        description="Review requests, contact travellers by email or phone, and discuss their travel plans."
      />
      <div className="admin-overview-metrics">
        <Link to="/admin/enquiries">
          <span>Total enquiries</span>
          <strong>{summary?.total ?? total ?? '—'}</strong>
          <small>Every traveller conversation</small>
        </Link>
        <div>
          <span>Last 14 days</span>
          <strong>{summary?.recentCount ?? '—'}</strong>
          <small>New requests received</small>
        </div>
        <div>
          <span>Travellers represented</span>
          <strong>{summary?.travellers ?? '—'}</strong>
          <small>Across all enquiry requests</small>
        </div>
      </div>
      <div className="admin-analytics-grid">
        <section className="admin-panel">
          <h2>Enquiry activity</h2>
          <p>Requests received over the last 14 days · UTC</p>
          {summary ? (
            <div
              className="enquiry-chart"
              role="img"
              aria-label={summary.daily
                .map((item) => `${item.date}: ${item.count} requests`)
                .join(', ')}
            >
              {summary.daily.map((item) => (
                <div className="enquiry-chart-column" key={item.date}>
                  <span>{item.count}</span>
                  <div className="enquiry-chart-track">
                    <div
                      style={{
                        height: `${item.count ? Math.max(4, (item.count / Math.max(1, ...summary.daily.map((x) => x.count))) * 100) : 0}%`,
                      }}
                    />
                  </div>
                  <small>{item.date.slice(8)}</small>
                </div>
              ))}
            </div>
          ) : (
            <p>{chartError || 'Loading activity…'}</p>
          )}
          {summary?.recentCount === 0 && (
            <p>No requests received in this period.</p>
          )}
        </section>
        <section className="admin-panel">
          <h2>Where travellers enquire from</h2>
          <p>Top countries · all enquiries</p>
          {summary ? (
            summary.countries.length ? (
              <div className="enquiry-country-chart">
                {summary.countries.map((item) => (
                  <div key={item.country}>
                    <div>
                      <span>{item.country}</span>
                      <strong>{item.count}</strong>
                    </div>
                    <div className="enquiry-country-track">
                      <span
                        style={{
                          width: `${(item.count / Math.max(1, summary.total)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>Country insights will appear after enquiries arrive.</p>
            )
          ) : (
            <p>{chartError || 'Loading countries…'}</p>
          )}
        </section>
      </div>
      <section className="admin-panel">
        <h2>Latest requests</h2>
        <p>
          {error ||
            'Open a request to view contact details and travel preferences.'}
        </p>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Traveller</th>
                <th>Journey request</th>
                <th>Received</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((item) => (
                <tr key={item.id}>
                  <td data-label="Traveller">
                    <strong>{item.name}</strong>
                    <small>{item.email}</small>
                  </td>
                  <td data-label="Journey request">{enquiryInterest(item)}</td>
                  <td data-label="Received">{shortDate(item.createdAt)}</td>
                  <td data-label="Action">
                    <Link
                      className="table-link"
                      to={'/admin/enquiries/' + item.id}
                    >
                      View request
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!recent.length && !error && <p>No recent requests to display.</p>}
        <Link className="button button-outline" to="/admin/enquiries">
          All enquiries
        </Link>
      </section>
    </>
  )
}
