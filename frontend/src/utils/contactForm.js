import { countries } from '../data/countries.js'
export function validateContact(values) {
  const errors = {}
  if (!values.name.trim()) errors.name = 'Please enter your name.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
    errors.email = 'Please enter a valid email address.'
  if (!countries.some((country) => country.name === values.country))
    errors.country = 'Please select your country.'
  if (!/^\+\d{1,4}$/.test(values.phoneCode))
    errors.phoneCode = 'Enter a calling code, for example +94.'
  if (!/^[\d\s().-]{5,24}$/.test(values.phone.trim()))
    errors.phone = 'Enter your local phone number without the country code.'
  for (const field of ['adults', 'kids', 'infants']) {
    const count = Number(values[field])
    if (
      values[field] === '' ||
      !Number.isInteger(count) ||
      count < (field === 'adults' ? 1 : 0) ||
      count > 1000
    )
      errors[field] =
        field === 'adults'
          ? 'Enter at least one adult.'
          : 'Enter zero or a positive whole number.'
  }
  if (
    Number(values.adults) + Number(values.kids) + Number(values.infants) >
    1000
  )
    errors.adults = 'Please keep the total group size at 1,000 or fewer.'
  for (const field of ['arrivalDate', 'departureDate']) {
    if (values[field] && !Number.isFinite(Date.parse(values[field])))
      errors[field] = 'Choose a valid date.'
  }
  if (values.departureDate && !values.arrivalDate)
    errors.arrivalDate = 'Add an arrival date before choosing your departure.'
  if (
    values.arrivalDate &&
    values.departureDate &&
    values.departureDate < values.arrivalDate
  )
    errors.departureDate = 'Departure cannot be before arrival.'
  if (!values.message.trim())
    errors.message = 'Tell us a little about your trip.'
  if (!values.consent)
    errors.consent =
      'Please read and acknowledge the privacy notice and enquiry terms.'
  return errors
}
export function enquiryMessage(values) {
  return [
    values.message.trim(),
    '',
    'Travel party:',
    'Adults (12+): ' + values.adults,
    'Kids (0–11, excluding infants): ' + values.kids,
    'Infants (under 2): ' + values.infants,
    'Departure date: ' + (values.departureDate || 'Not decided'),
    'Privacy notice and enquiry terms acknowledged (2026-10-02).',
  ].join('\n')
}
