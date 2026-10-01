import { useCallback, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../../context/authContextValue'
import { getTourPackageBySlug } from '../../services/tourPackageService'
import { createBooking } from '../../services/bookingService'
import useResource from '../../hooks/useResource'
import DetailState from '../../components/details/DetailState'
import TravelImage from '../../components/common/TravelImage'
import FormField from '../../components/auth/FormField'
import Button from '../../components/common/Button'
import { tomorrow, validPhone, requestError } from '../../utils/customer'
export default function BookingPage() {
  const { slug } = useParams()
  const { user } = useAuth()
  const resource = useResource(
    useCallback((signal) => getTourPackageBySlug(slug, signal), [slug]),
  )
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const [success, setSuccess] = useState(false)
  const busy = useRef(false)
  const tour = resource.data
  async function submit(event) {
    event.preventDefault()
    if (busy.current) return
    const form = event.currentTarget
    const data = Object.fromEntries(new FormData(form))
    const next = {}
    if (!data.travelDate || data.travelDate < tomorrow())
      next.travelDate = 'Choose a future travel date.'
    if (!validPhone(data.phone)) next.phone = 'Enter a valid phone number.'
    for (const [key, min] of [
      ['adults', 1],
      ['children', 0],
    ])
      if (
        data[key] === '' ||
        !Number.isInteger(Number(data[key])) ||
        Number(data[key]) < min ||
        Number(data[key]) > 1000
      )
        next[key] = `Enter a whole number from ${min} to 1000.`
    setErrors(next)
    setMessage('')
    if (Object.keys(next).length) {
      form.elements[Object.keys(next)[0]]?.focus()
      return
    }
    busy.current = true
    setPending(true)
    try {
      await createBooking({
        tourPackageId: tour.id,
        phone: data.phone.trim(),
        country: data.country.trim() || null,
        travelDate: data.travelDate + 'T00:00:00Z',
        adults: Number(data.adults),
        children: Number(data.children),
        specialRequests: data.specialRequests.trim() || null,
      })
      setSuccess(true)
    } catch (error) {
      setMessage(
        requestError(
          error,
          'We couldn’t submit your booking right now. Please try again.',
        ),
      )
    } finally {
      busy.current = false
      setPending(false)
    }
  }
  if (success)
    return (
      <div className="container customer-page booking-success" role="status">
        <h1>Your travel request has been received.</h1>
        <p>
          Your request is pending review. Availability and final pricing still
          need to be confirmed.
        </p>
        <Button to="/account/bookings">View my bookings</Button>
      </div>
    )
  return (
    <div className="container customer-page">
      <DetailState resource={resource} kind="journey" to="/tours">
        {tour && (
          <>
            <h1>Plan your journey</h1>
            <div className="booking-layout">
              <aside className="booking-summary">
                <TravelImage path={tour.heroImageUrl} alt={tour.title} eager />
                <h2>{tour.title}</h2>
                <p>
                  {tour.durationDays} days / {tour.durationNights} nights
                </p>
                <p>
                  Starting from{' '}
                  <strong>
                    {tour.currency}{' '}
                    {Number(tour.startingPrice).toLocaleString('en-US')}
                  </strong>
                </p>
                <p>
                  This is a travel request. Availability and your final quote
                  will be agreed with you.
                </p>
                <Link to={'/tours/' + tour.slug}>View journey details</Link>
              </aside>
              <section>
                <h2>Tell us your plans</h2>
                <p>
                  Requesting as {user.fullName}. We’ll use {user.email} to
                  contact you.
                </p>
                <form className="customer-form" noValidate onSubmit={submit}>
                  <FormField
                    label="Travel date"
                    name="travelDate"
                    type="date"
                    min={tomorrow()}
                    required
                    error={errors.travelDate}
                  />
                  <div className="customer-form-row">
                    <FormField
                      label="Adults"
                      name="adults"
                      type="number"
                      min="1"
                      max="1000"
                      step="1"
                      defaultValue="1"
                      required
                      error={errors.adults}
                    />
                    <FormField
                      label="Children"
                      name="children"
                      type="number"
                      min="0"
                      max="1000"
                      step="1"
                      defaultValue="0"
                      required
                      error={errors.children}
                    />
                  </div>
                  <FormField
                    label="Phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    defaultValue={user.phone || ''}
                    maxLength={30}
                    required
                    error={errors.phone}
                  />
                  <FormField
                    label="Country (optional)"
                    name="country"
                    autoComplete="country-name"
                    defaultValue={user.country || ''}
                    maxLength={100}
                  />
                  <div className="customer-field">
                    <label htmlFor="specialRequests">
                      Special requests (optional)
                    </label>
                    <textarea
                      id="specialRequests"
                      name="specialRequests"
                      rows="5"
                      maxLength={3000}
                    />
                  </div>
                  {message && (
                    <p role="alert" className="form-message">
                      {message}
                    </p>
                  )}
                  <Button type="submit" disabled={pending}>
                    {pending ? 'Sending request…' : 'Send travel request'}
                  </Button>
                </form>
              </section>
            </div>
          </>
        )}
      </DetailState>
    </div>
  )
}
