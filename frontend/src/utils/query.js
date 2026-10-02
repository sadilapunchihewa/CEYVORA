export const sortOptions = [
  ['newest', 'Newest'],
  ['duration_asc', 'Duration: short to long'],
  ['duration_desc', 'Duration: long to short'],
]

export function cleanParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== '',
    ),
  )
}

// Validate shared URLs as well as form input before requesting the backend.
export function readBrowseParams(params, tours) {
  const query = {}
  const errors = {}
  function text(key, max) {
    const value = (params.get(key) || '').trim()
    if (value.length > max) errors[key] = `Use no more than ${max} characters.`
    if (value) query[key] = value
  }
  function number(key, label, min, max, integer = true, fallback) {
    const raw = params.get(key)?.trim()
    if (!raw) {
      if (fallback !== undefined) query[key] = fallback
      return
    }
    const value = Number(raw)
    if (
      !/^\d+(\.\d+)?$/.test(raw) ||
      !Number.isFinite(value) ||
      value < min ||
      value > max ||
      (integer && !Number.isInteger(value))
    ) {
      errors[key] =
        `${label} must be ${integer ? 'a whole number ' : ''}between ${min.toLocaleString('en-US')} and ${max.toLocaleString('en-US')}.`
    } else query[key] = value
  }
  text('search', 200)
  number('page', 'Page', 1, 1000000, true, 1)
  number('pageSize', 'Results per page', 1, 50, true, tours ? 6 : 9)
  const featured = params.get('featured')
  if (featured) {
    if (featured === 'true' || featured === 'false') query.featured = featured
    else errors.featured = 'Choose a valid featured option.'
  }
  if (tours) {
    number('minDays', 'Minimum days', 1, 365)
    number('maxDays', 'Maximum days', 1, 365)
    number('destinationId', 'Destination', 1, 2147483647)
    query.sort = params.get('sort') || 'newest'
    if (!sortOptions.some(([value]) => value === query.sort))
      errors.sort = 'Choose a sort option from the list.'
    if (query.minDays > query.maxDays)
      errors.minDays = 'Minimum days cannot exceed maximum days.'
  } else {
    text('province', 100)
    text('district', 100)
  }
  return { query, errors }
}

export function validSlug(slug) {
  return (
    typeof slug === 'string' &&
    slug.length <= 180 &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
  )
}
