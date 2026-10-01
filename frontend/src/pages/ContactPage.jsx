import { useCallback, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import useResource from '../hooks/useResource'
import { getTourPackageBySlug } from '../services/tourPackageService'
import PageHeader from '../components/common/PageHeader'
import Button from '../components/common/Button'
import { createEnquiry } from '../services/enquiryService'

const initial = {
  name: '',
  email: '',
  phone: '',
  country: '',
  arrivalDate: '',
  numberOfTravellers: '2',
  message: '',
}
const fields = [
  {
    name: 'name',
    label: 'Your name',
    autoComplete: 'name',
    required: true,
    maxLength: 150,
  },
  {
    name: 'email',
    label: 'Email address',
    type: 'email',
    autoComplete: 'email',
    required: true,
    maxLength: 254,
  },
  {
    name: 'phone',
    label: 'Phone number',
    type: 'tel',
    autoComplete: 'tel',
    required: true,
    maxLength: 30,
  },
  {
    name: 'country',
    label: 'Country (optional)',
    autoComplete: 'country-name',
    maxLength: 100,
  },
  { name: 'arrivalDate', label: 'Arrival date (optional)', type: 'date' },
  {
    name: 'numberOfTravellers',
    label: 'Number of travellers',
    type: 'number',
    min: 1,
    max: 1000,
    step: 1,
    required: true,
  },
]
function validate(values) {
  const errors = {}
  if (!values.name.trim()) errors.name = 'Please enter your name.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
    errors.email = 'Please enter a valid email address.'
  if (!/^\+?[\d\s().-]{5,30}$/.test(values.phone.trim()))
    errors.phone = 'Please enter a phone number, including your country code.'
  const count = Number(values.numberOfTravellers)
  if (!Number.isInteger(count) || count < 1 || count > 1000)
    errors.numberOfTravellers = 'Choose between 1 and 1,000 travellers.'
  if (!values.message.trim())
    errors.message = 'Tell us a little about your trip.'
  if (values.arrivalDate && !Number.isFinite(Date.parse(values.arrivalDate)))
    errors.arrivalDate = 'Choose a valid arrival date.'
  return errors
}
export default function ContactPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const packageSlug = searchParams.get('package') || ''
  const loadPackage = useCallback(
    (signal) =>
      packageSlug
        ? getTourPackageBySlug(packageSlug, signal)
        : Promise.resolve(null),
    [packageSlug],
  )
  const selectedPackage = useResource(loadPackage)
  const packageBlocked = Boolean(
    packageSlug &&
    (selectedPackage.loading || selectedPackage.error || !selectedPackage.data),
  )
  function clearPackage() {
    const next = new URLSearchParams(searchParams)
    next.delete('package')
    setSearchParams(next)
    setServerError('')
  }
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState({})
  const [pending, setPending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState('')
  const inFlight = useRef(false)
  const form = useRef(null)
  const feedback = useRef(null)
  function change(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
  }
  function focusFirst(nextErrors) {
    requestAnimationFrame(() =>
      form.current?.elements.namedItem(Object.keys(nextErrors)[0])?.focus(),
    )
  }
  async function submit(event) {
    event.preventDefault()
    if (inFlight.current) return
    if (packageBlocked) return
    const nextErrors = validate(values)
    setErrors(nextErrors)
    setServerError('')
    if (Object.keys(nextErrors).length) {
      focusFirst(nextErrors)
      return
    }
    inFlight.current = true
    setPending(true)
    try {
      await createEnquiry({
        ...(packageSlug && selectedPackage.data
          ? { tourPackageId: selectedPackage.data.id }
          : {}),
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        country: values.country.trim() || null,
        arrivalDate: values.arrivalDate
          ? new Date(values.arrivalDate + 'T00:00:00Z').toISOString()
          : null,
        numberOfTravellers: Number(values.numberOfTravellers),
        message: values.message.trim(),
      })
      setSuccess(true)
      requestAnimationFrame(() => feedback.current?.focus())
    } catch (error) {
      if (error.response?.status === 404 && packageSlug) selectedPackage.retry()
      const fieldErrors = {}
      if (error.response?.status === 400 && error.response.data?.errors) {
        for (const [key, messages] of Object.entries(
          error.response.data.errors,
        )) {
          const name = key.charAt(0).toLowerCase() + key.slice(1)
          if (Object.hasOwn(initial, name))
            fieldErrors[name] = Array.isArray(messages)
              ? messages.join(' ')
              : 'Please check this field.'
        }
      }
      setErrors(fieldErrors)
      if (Object.keys(fieldErrors).length) focusFirst(fieldErrors)
      setServerError(
        error.response?.status === 404 && packageSlug
          ? 'This journey is no longer available. You can continue as a general enquiry below.'
          : Object.keys(fieldErrors).length
            ? 'Please check the highlighted fields and send again.'
            : 'We couldn’t confirm that your enquiry was received. Your details are still here. Please check your connection before trying again.',
      )
    } finally {
      inFlight.current = false
      setPending(false)
    }
  }
  return (
    <>
      <PageHeader
        title="Let’s make it your Sri Lanka."
        description="A few ideas or a whole itinerary in mind? Tell us about the journey you’d like to take."
        eyebrow="Begin your journey"
        image="/images/colombo-market.webp"
        imageAlt="Tuk-tuks and pedestrians moving through Pettah Market in Colombo"
        marker="START HERE · 04"
      />
      <section className="section container contact-layout">
        <aside className="contact-aside">
          <h2>Start with a conversation.</h2>
          <p>
            Share your travel dates, interests and the people coming along.
            There’s no need to have everything figured out.
          </p>
          <img
            src="/images/colombo-lake.webp"
            alt="A small boat resting on calm water beneath tropical trees in Colombo"
            width="600"
            height="700"
            loading="lazy"
          />
          <p className="small-text">
            This is a trip enquiry, not a booking or payment.
          </p>
        </aside>
        {success ? (
          <div
            className="success-panel"
            ref={feedback}
            tabIndex="-1"
            role="status"
          >
            <span aria-hidden="true" className="success-mark">
              ✓
            </span>
            <h2>Your enquiry is on its way.</h2>
            <p>
              Thank you for sharing your plans. Your enquiry has been received
              by Ceyvora.
            </p>
            <Button
              onClick={() => {
                setSuccess(false)
                setValues(initial)
                requestAnimationFrame(() =>
                  form.current?.elements.namedItem('name')?.focus(),
                )
              }}
            >
              Send another enquiry
            </Button>
          </div>
        ) : (
          <form
            className="enquiry-form"
            ref={form}
            onSubmit={submit}
            noValidate
            aria-busy={pending}
          >
            <h2>Tell us about your trip</h2>
            {packageSlug && (
              <div className="enquiry-package">
                {selectedPackage.loading ? (
                  <p role="status">Loading your selected journey…</p>
                ) : selectedPackage.error ? (
                  <div role="alert">
                    <p>
                      {selectedPackage.status === 404
                        ? 'We couldn’t find that journey.'
                        : 'Your selected journey could not be loaded.'}
                    </p>
                    {selectedPackage.status !== 404 && (
                      <button
                        type="button"
                        className="text-action"
                        onClick={selectedPackage.retry}
                      >
                        Try again
                      </button>
                    )}
                  </div>
                ) : (
                  <p>
                    <span>Interested tour</span>
                    <strong>{selectedPackage.data?.title}</strong>
                  </p>
                )}
                <button
                  type="button"
                  className="text-action"
                  onClick={clearPackage}
                >
                  Continue as a general enquiry
                </button>
              </div>
            )}
            <p className="form-note">Fields marked * are required.</p>
            <div className="form-grid">
              {fields.map(({ name, label, required, ...props }) => (
                <div className="field" key={name}>
                  <label htmlFor={name}>
                    {label}
                    {required && ' *'}
                  </label>
                  <input
                    id={name}
                    name={name}
                    {...props}
                    required={required}
                    value={values[name]}
                    onChange={change}
                    aria-invalid={Boolean(errors[name])}
                    aria-describedby={
                      errors[name] ? name + '-error' : undefined
                    }
                  />
                  {errors[name] && (
                    <p className="field-error" id={name + '-error'}>
                      {errors[name]}
                    </p>
                  )}
                </div>
              ))}
              <div className="field full-width">
                <label htmlFor="message">
                  What would you love to experience? *
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows="5"
                  maxLength="5000"
                  required
                  value={values.message}
                  onChange={change}
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={
                    errors.message ? 'message-error' : undefined
                  }
                  placeholder="Places you’d like to see, your interests, or anything we should know…"
                />
                {errors.message && (
                  <p className="field-error" id="message-error">
                    {errors.message}
                  </p>
                )}
              </div>
            </div>
            {serverError && (
              <p className="form-error" role="alert">
                {serverError}
              </p>
            )}
            <p className="small-text">
              We’ll use these details to respond to your travel enquiry.
            </p>
            <Button type="submit" disabled={pending || packageBlocked}>
              {pending ? 'Sending enquiry…' : 'Send enquiry'}
            </Button>
          </form>
        )}
      </section>
    </>
  )
}
