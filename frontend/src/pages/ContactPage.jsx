import BusinessDetails from '../components/common/BusinessDetails'
import { countries, callingCodes } from '../data/countries'
import { validateContact, enquiryMessage } from '../utils/contactForm'
import TravelFAQ from '../components/common/TravelFAQ'
import { useCallback, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import useResource from '../hooks/useResource'
import { getTourPackageBySlug } from '../services/tourPackageService'
import InnerPageHero from '../components/common/InnerPageHero'
import Button from '../components/common/Button'
import { createEnquiry } from '../services/enquiryService'

const initial = {
  name: '',
  email: '',
  phone: '',
  country: '',
  arrivalDate: '',
  adults: '2',
  kids: '0',
  infants: '0',
  departureDate: '',
  phoneCode: '+94',
  consent: false,
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
    label: 'Your email',
    type: 'email',
    autoComplete: 'email',
    required: true,
    maxLength: 254,
  },
  { name: 'country', label: 'Country', required: true },
  {
    name: 'phone',
    label: 'Phone',
    type: 'tel',
    autoComplete: 'tel-national',
    required: true,
    maxLength: 24,
  },
  {
    name: 'adults',
    label: 'No. of adults (12+)',
    type: 'number',
    min: 1,
    max: 1000,
    step: 1,
    required: true,
  },
  {
    name: 'kids',
    label: 'No. of kids (0–11 years)',
    type: 'number',
    min: 0,
    max: 1000,
    step: 1,
  },
  {
    name: 'infants',
    label: 'No. of infants (under 2)',
    type: 'number',
    min: 0,
    max: 1000,
    step: 1,
    required: true,
  },
  { name: 'arrivalDate', label: 'Arrival date', type: 'date' },
  { name: 'departureDate', label: 'Departure date', type: 'date' },
]
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
  const [values, setValues] = useState(() => ({
    ...initial,
    message: searchParams.get('interest')
      ? `I’m interested in a journey inspired by ${searchParams.get('interest').slice(0, 200)}. Please help me plan the details.`
      : '',
  }))
  const [errors, setErrors] = useState({})
  const [pending, setPending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState('')
  const inFlight = useRef(false)
  const form = useRef(null)
  const feedback = useRef(null)
  function change(event) {
    const { name, value, type, checked } = event.target
    setValues((current) => {
      const country =
        name === 'country'
          ? countries.find((item) => item.name === value)
          : null
      return {
        ...current,
        [name]: type === 'checkbox' ? checked : value,
        ...(country ? { phoneCode: callingCodes[country.code] || '' } : {}),
      }
    })
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
    const nextErrors = validateContact(values)
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
        phone: values.phoneCode + ' ' + values.phone.trim(),
        country: values.country.trim() || null,
        arrivalDate: values.arrivalDate
          ? new Date(values.arrivalDate + 'T00:00:00Z').toISOString()
          : null,
        numberOfTravellers:
          Number(values.adults) + Number(values.kids) + Number(values.infants),
        message: enquiryMessage(values),
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
      <InnerPageHero
        className="contact-page-header"
        title="Let’s make it your Sri Lanka."
        description="A few ideas or a whole itinerary in mind? Tell us about the journey you’d like to take."
        eyebrow="Begin your journey"
        image="/images/destinations/weligama.jpg"
        imageAlt="A fishing boat floating in the turquoise waters of Weligama"
        marker="START HERE · 04"
      />
      <section className="section container contact-layout">
        <aside className="contact-aside">
          <h2>Start with a conversation.</h2>
          <BusinessDetails />
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
            <p className="directory-region">Connect with us</p>
            <h2>Let’s craft your dream journey together.</h2>
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
                  {name === 'country' ? (
                    <select
                      id={name}
                      name={name}
                      required
                      value={values.country}
                      onChange={change}
                      autoComplete="country-name"
                      aria-invalid={Boolean(errors.country)}
                      aria-describedby={
                        errors.country ? 'country-error' : undefined
                      }
                    >
                      <option value="">Select your country</option>
                      {countries.map((country) => (
                        <option key={country.code} value={country.name}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div
                      className={name === 'phone' ? 'contact-phone' : undefined}
                    >
                      {name === 'phone' && (
                        <div>
                          <label className="small-text" htmlFor="phoneCode">
                            Calling code
                          </label>
                          <input
                            id="phoneCode"
                            name="phoneCode"
                            type="tel"
                            autoComplete="tel-country-code"
                            list="calling-codes"
                            value={values.phoneCode}
                            onChange={change}
                            placeholder="+94"
                            maxLength={5}
                            required
                            aria-invalid={Boolean(errors.phoneCode)}
                            aria-describedby={
                              errors.phoneCode ? 'phoneCode-error' : undefined
                            }
                          />
                          <datalist id="calling-codes">
                            {Object.entries(callingCodes).map(
                              ([code, dial]) => (
                                <option key={code} value={dial}>
                                  {
                                    countries.find(
                                      (country) => country.code === code,
                                    )?.name
                                  }
                                </option>
                              ),
                            )}
                          </datalist>
                        </div>
                      )}
                      <input
                        id={name}
                        name={name}
                        {...props}
                        required={required}
                        value={values[name]}
                        onChange={change}
                        min={
                          name === 'departureDate'
                            ? values.arrivalDate || undefined
                            : props.min
                        }
                        aria-invalid={Boolean(errors[name])}
                        aria-describedby={
                          errors[name] ? name + '-error' : undefined
                        }
                      />
                    </div>
                  )}
                  {name === 'phone' && errors.phoneCode && (
                    <p className="field-error" id="phoneCode-error">
                      {errors.phoneCode}
                    </p>
                  )}
                  {name === 'kids' && (
                    <p className="small-text">
                      Count children under 2 in the infants field only.
                    </p>
                  )}
                  {errors[name] && (
                    <p className="field-error" id={name + '-error'}>
                      {errors[name]}
                    </p>
                  )}
                </div>
              ))}
              <div className="field full-width">
                <label htmlFor="message">Message *</label>
                <textarea
                  id="message"
                  name="message"
                  rows="5"
                  maxLength="4500"
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
            <div className="contact-consent">
              <label htmlFor="consent">
                <input
                  id="consent"
                  name="consent"
                  type="checkbox"
                  checked={values.consent}
                  onChange={change}
                  required
                  aria-invalid={Boolean(errors.consent)}
                  aria-describedby={
                    errors.consent ? 'consent-error' : undefined
                  }
                />{' '}
                I have read the <a href="#privacy-notice">Privacy Policy</a> /{' '}
                <a href="#enquiry-terms">Terms and Conditions</a>, and agree to
                my details being used to respond to this enquiry. *
              </label>
              {errors.consent && (
                <p className="field-error" id="consent-error">
                  {errors.consent}
                </p>
              )}
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
      <section className="section container enquiry-notices">
        <details id="privacy-notice" open>
          <summary>Privacy Policy — travel enquiries</summary>
          <p>
            This form collects your name, email, country, phone number, travel
            dates, group details and message. Ceyvora stores the enquiry so its
            authorised admin team can review it and respond about your trip. Do
            not include passport details, card numbers or other sensitive
            documents in your message.
          </p>
          <p>
            To ask about your submitted information or request a correction or
            deletion, send an enquiry identifying your earlier request. This
            acknowledgement concerns your enquiry only; it is not a marketing
            subscription.
          </p>
        </details>
        <details id="enquiry-terms" open>
          <summary>Terms and Conditions — enquiries</summary>
          <p>
            Submitting this form is a request for information, not a confirmed
            booking or payment. Routes, prices, availability and inclusions must
            be agreed separately. Ask for the applicable booking, payment and
            cancellation terms before accepting a quote.
          </p>
          <p>
            Group ages and dates help with planning. Count each traveller once,
            and confirm ages at the time of travel when discussing activities
            and accommodation.
          </p>
        </details>
      </section>
      <TravelFAQ />
    </>
  )
}
