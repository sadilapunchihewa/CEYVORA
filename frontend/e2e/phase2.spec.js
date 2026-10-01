import { test, expect } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'

const api = 'http://localhost:5111'
async function apply(page, endpoint) {
  const sort =
    endpoint === 'tourpackages'
      ? await page.getByLabel('Sort journeys').inputValue()
      : null
  const response = page.waitForResponse(
    (r) =>
      r.url().includes('/api/' + endpoint + '?') &&
      r.status() === 200 &&
      (sort === null || new URL(r.url()).searchParams.get('sort') === sort),
  )
  await page.getByRole('button', { name: 'Apply filters', exact: true }).click()
  return (await response).json()
}
async function liveTour(request) {
  const response = await request.get(api + '/api/tourpackages/featured')
  return (await response.json())[0]
}
async function fillContact(page, email = 'phase2-browser@example.invalid') {
  await page.getByLabel('Your name').fill('Frontend verification')
  await page.getByLabel('Email address').fill(email)
  await page.getByLabel('Phone number').fill('+94 770000000')
  await page.getByLabel('Number of travellers').fill('2')
  await page
    .getByLabel('What would you love')
    .fill(
      'Automated Ceyvora frontend verification. Test enquiry; no travel arrangement requested.',
    )
}

test('destination search, geographic filters, featured, URL restoration and clear', async ({
  page,
}) => {
  await page.goto('/destinations?page=2')
  await expect(page.locator('.destination-card').first()).toBeVisible()
  await page.getByLabel('Search destinations', { exact: true }).fill('Kandy')
  await page.getByLabel('Province', { exact: true }).fill('Central Province')
  await page.getByLabel('District', { exact: true }).fill('Kandy')
  await page.getByLabel('Featured', { exact: true }).selectOption('true')
  const result = await apply(page, 'destinations')
  expect(result.page).toBe(1)
  expect(result.items.length).toBeGreaterThan(0)
  expect(
    result.items.every(
      (item) =>
        item.name.includes('Kandy') &&
        item.province === 'Central Province' &&
        item.district === 'Kandy' &&
        item.isFeatured,
    ),
  ).toBe(true)
  await expect(page).toHaveURL(/page=1/)
  await page.reload()
  await expect(
    page.getByLabel('Search destinations', { exact: true }),
  ).toHaveValue('Kandy')
  await expect(page.locator('.destination-card')).toHaveCount(
    result.items.length,
  )
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click()
  await expect(page).toHaveURL(/\/destinations$/)
  await page.goBack()
  await expect(page.getByLabel('Province', { exact: true })).toHaveValue(
    'Central Province',
  )
  await expect(page.locator('.destination-card')).toHaveCount(
    result.items.length,
  )
  await page
    .getByLabel('Search destinations', { exact: true })
    .fill('no-such-place-849572')
  await apply(page, 'destinations')
  await expect(
    page.getByRole('heading', { name: 'No destinations found.' }),
  ).toBeVisible()
})

test('tour search, destination, price, duration and featured filters reach real API', async ({
  page,
  request,
}) => {
  const destinations = await (
    await request.get(api + '/api/destinations?search=Sigiriya')
  ).json()
  const destination = destinations.items[0]
  await page.goto('/tours?page=2')
  await expect(
    page
      .getByLabel('Destination', { exact: true })
      .locator('option', { hasText: 'Sigiriya' }),
  ).toHaveCount(1)
  await page.getByLabel('Search tours', { exact: true }).fill('Cultural')
  await page
    .getByLabel('Destination', { exact: true })
    .selectOption(String(destination.id))
  await page.getByLabel('Min price', { exact: true }).fill('500')
  await page.getByLabel('Max price', { exact: true }).fill('900')
  await page.getByLabel('Min days', { exact: true }).fill('4')
  await page.getByLabel('Max days', { exact: true }).fill('6')
  await page.getByLabel('Featured', { exact: true }).selectOption('true')
  await page.getByLabel('Sort journeys').selectOption('price_asc')
  const result = await apply(page, 'tourpackages')
  expect(result.page).toBe(1)
  expect(result.items.length).toBeGreaterThan(0)
  expect(
    result.items.every(
      (item) =>
        item.title.includes('Cultural') &&
        item.startingPrice >= 500 &&
        item.startingPrice <= 900 &&
        item.durationDays >= 4 &&
        item.durationDays <= 6 &&
        item.isFeatured,
    ),
  ).toBe(true)
  await expect(page).toHaveURL(/destinationId=/)
  await page.reload()
  await expect(page.getByLabel('Min price', { exact: true })).toHaveValue('500')
  await expect(page.getByLabel('Destination', { exact: true })).toHaveValue(
    String(destination.id),
  )
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click()
  await expect(page).toHaveURL(/\/tours$/)
  await page
    .getByLabel('Search tours', { exact: true })
    .fill('no-such-tour-9918')
  await apply(page, 'tourpackages')
  await expect(
    page.getByRole('heading', { name: 'No tours match your filters.' }),
  ).toBeVisible()
})

test('all tour sorting orders and real server pagination', async ({ page }) => {
  await page.goto('/tours')
  for (const [sort, field, direction] of [
    ['price_asc', 'startingPrice', 1],
    ['price_desc', 'startingPrice', -1],
    ['duration_asc', 'durationDays', 1],
    ['duration_desc', 'durationDays', -1],
    ['newest', 'createdAt', -1],
  ]) {
    await page.getByLabel('Sort journeys').selectOption(sort)
    const result = await apply(page, 'tourpackages')
    const values = result.items.map((item) =>
      field === 'createdAt' ? Date.parse(item[field]) : item[field],
    )
    expect(values).toEqual([...values].sort((a, b) => (a - b) * direction))
    await expect(page.locator('.travel-card h3')).toHaveText(
      result.items.map((item) => item.title),
    )
  }
  await page.goto('/tours?pageSize=1&sort=price_asc')
  await expect(page.locator('.travel-card')).toHaveCount(1)
  const before = await page.locator('.travel-card h3').textContent()
  await page.getByRole('button', { name: 'Page 2', exact: true }).click()
  await expect(page).toHaveURL(/page=2/)
  await expect(page.locator('.travel-card h3')).not.toHaveText(before)
  await expect(
    page.getByRole('button', { name: 'Page 2', exact: true }),
  ).toHaveAttribute('aria-current', 'page')
  await page.getByLabel('Sort journeys').selectOption('duration_asc')
  const result = await apply(page, 'tourpackages')
  expect(result.page).toBe(1)
})

test('invalid ranges and malformed shared URLs make no invalid API request', async ({
  page,
}) => {
  const requests = []
  page.on('request', (req) => {
    if (req.url().includes('/api/tourpackages?')) requests.push(req.url())
  })
  await page.goto('/tours?minPrice=900&maxPrice=100&sort=not-a-sort&page=-1')
  await expect(
    page.getByRole('heading', { name: 'Check your search filters' }),
  ).toBeVisible()
  expect(requests).toEqual([])
  await page
    .locator('.browse-filters')
    .getByRole('button', { name: 'Clear filters' })
    .click()
  await expect(page.locator('.travel-card').first()).toBeVisible()
  const count = requests.length
  await page.getByLabel('Min days', { exact: true }).fill('10')
  await page.getByLabel('Max days', { exact: true }).fill('2')
  await page.getByRole('button', { name: 'Apply filters', exact: true }).click()
  await expect(
    page.getByText('Minimum days cannot exceed maximum days.'),
  ).toBeVisible()
  expect(requests.length).toBe(count)
  await page.goto('/destinations?page=99999')
  await expect(
    page.getByRole('button', { name: 'Back to first page' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Back to first page' }).click()
  await expect(page.locator('.destination-card')).toHaveCount(6)
})

test('destination picker searches and paginates API choices', async ({
  page,
}) => {
  await page.route('**/api/destinations?**', (route) => {
    const url = new URL(route.request().url())
    const current = Number(url.searchParams.get('page'))
    const title = url.searchParams.get('search')
      ? 'Searched option'
      : 'Option page ' + current
    return route.fulfill({
      json: {
        items: [{ id: current, name: title }],
        page: current,
        pageSize: 10,
        totalItems: 11,
        totalPages: 2,
      },
    })
  })
  await page.goto('/tours')
  await page.getByText('Find more destinations', { exact: true }).click()
  await page.getByRole('button', { name: 'Next options' }).click()
  await expect(
    page
      .getByLabel('Destination', { exact: true })
      .locator('option', { hasText: 'Option page 2' }),
  ).toHaveCount(1)
  await page.getByLabel('Find destination options').fill('Ella')
  await page.getByRole('button', { name: 'Find', exact: true }).click()
  await expect(
    page
      .getByLabel('Destination', { exact: true })
      .locator('option', { hasText: 'Searched option' }),
  ).toHaveCount(1)
  await expect(
    page.getByRole('button', { name: 'Previous options' }),
  ).toBeDisabled()
})

test('live details use embedded places, itinerary and reviews without duplicate requests', async ({
  page,
  request,
}) => {
  const tour = await liveTour(request)
  const details = await (
    await request.get(api + '/api/tourpackages/slug/' + tour.slug)
  ).json()
  const reviewRequests = []
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('request', (req) => {
    if (req.url().includes('/api/reviews/')) reviewRequests.push(req.url())
  })
  await page.goto('/tours/' + tour.slug)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(tour.title)
  await expect(page.locator('.detail-price')).toContainText(tour.currency)
  await expect(page.locator('.hero-journey-facts')).toContainText(
    tour.durationDays + ' days / ' + tour.durationNights + ' nights',
  )
  await expect(page.locator('.itinerary-day')).toHaveCount(
    details.itineraryDays.length,
  )
  await expect(page.locator('.included-places li')).toHaveCount(
    details.destinations.length,
  )
  const sorted = [...details.itineraryDays].sort(
    (a, b) => a.dayNumber - b.dayNumber,
  )
  await expect(page.locator('.itinerary-day h3')).toHaveText(
    sorted.map((day) => day.title),
  )
  await page.locator('.itinerary-day').nth(1).locator('summary').click()
  await expect(page.locator('.itinerary-day').nth(1)).toHaveAttribute(
    'open',
    '',
  )
  expect(reviewRequests).toEqual([])
  await page.locator('.included-places a').first().click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    details.destinations[0].name,
  )
  await expect(
    page.getByRole('link', { name: 'View all matching tours' }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'View all matching tours' }).click()
  await expect(page).toHaveURL(/destinationId=/)
  await expect(page.locator('.travel-card').first()).toBeVisible()
  expect(errors).toEqual([])
})

test('details distinguish 404, invalid slug, server and network errors with retry', async ({
  page,
  request,
}) => {
  for (const path of [
    '/destinations/not-a-real-place-984',
    '/tours/not-a-real-tour-984',
    '/tours/invalid%20slug',
  ]) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'We couldn’t find this',
    )
  }
  const tour = await liveTour(request)
  const route = '**/api/tourpackages/slug/' + tour.slug
  await page.route(route, (intercepted) =>
    intercepted.fulfill({
      status: 500,
      json: { trace: 'should-not-be-visible' },
    }),
  )
  await page.goto('/tours/' + tour.slug)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'This journey could not be loaded.',
  )
  await expect(page.getByText('should-not-be-visible')).toHaveCount(0)
  await page.unroute(route)
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(tour.title)
  await page.route('**/api/destinations/slug/*', (intercepted) =>
    intercepted.abort('failed'),
  )
  await page.goto('/destinations/sigiriya')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'This destination could not be loaded.',
  )
})

test('detail loading, empty itinerary/reviews/places and approved-review rendering', async ({
  page,
}) => {
  const fixture = {
    id: 901,
    slug: 'browser-fixture',
    title: 'Browser fixture journey',
    shortDescription: 'Test only',
    description: 'Test description',
    durationDays: 2,
    durationNights: 1,
    startingPrice: 1234.5,
    currency: 'EUR',
    heroImageUrl: null,
    destinations: [],
    itineraryDays: [],
    approvedReviews: [],
  }
  let release
  const gate = new Promise((resolve) => {
    release = resolve
  })
  await page.route(
    '**/api/tourpackages/slug/browser-fixture',
    async (route) => {
      await gate
      await route.fulfill({ json: fixture })
    },
  )
  await page.goto('/tours/browser-fixture')
  await expect(page.getByRole('status')).toHaveText('Loading journey…')
  release()
  await expect(
    page.getByText('No itinerary is available yet.', { exact: false }),
  ).toBeVisible()
  await expect(
    page.getByText('No approved reviews yet.', { exact: false }),
  ).toBeVisible()
  await expect(page.locator('.detail-price')).toContainText('EUR 1,234.5')
  await expect(page.locator('.detail-hero-image .image-note')).toHaveText(
    'Illustrative image',
  )
  await page.unroute('**/api/tourpackages/slug/browser-fixture')
  await page.route('**/api/tourpackages/slug/browser-fixture', (route) =>
    route.fulfill({
      json: {
        ...fixture,
        approvedReviews: [
          {
            id: 1,
            isApproved: true,
            customerName: 'Fixture reviewer',
            comment: 'Approved test fixture.',
            rating: 4,
            createdAt: '2026-01-10T12:00:00Z',
          },
          {
            id: 2,
            isApproved: false,
            customerName: 'Hidden reviewer',
            comment: 'Unapproved fixture.',
            rating: 5,
            createdAt: '2026-01-10T12:00:00Z',
          },
        ],
        destinations: [
          { id: 2, name: 'Second stop', slug: 'second-stop', visitOrder: 2 },
          { id: 1, name: 'First stop', slug: 'first-stop', visitOrder: 1 },
        ],
        itineraryDays: [
          { id: 2, dayNumber: 2, title: 'Second day', description: 'Second' },
          {
            id: 1,
            dayNumber: 1,
            title: 'First day',
            description: 'First',
            meals: 'Breakfast',
          },
        ],
      },
    }),
  )
  await page.reload()
  await expect(page.locator('.package-review')).toHaveCount(1)
  await expect(page.getByText('Unapproved fixture.')).toHaveCount(0)
  await expect(page.locator('.package-review time')).toHaveText('10 Jan 2026')
  await expect(page.locator('.itinerary-day h3')).toHaveText([
    'First day',
    'Second day',
  ])
  await expect(page.locator('.included-places a > span')).toHaveText([
    'First stop',
    'Second stop',
  ])
  await page.route('**/api/destinations/slug/browser-empty', (route) =>
    route.fulfill({
      json: {
        id: 33,
        name: 'Empty fixture',
        slug: 'browser-empty',
        description: 'Browser test only',
        tourPackages: [],
      },
    }),
  )
  await page.goto('/destinations/browser-empty')
  await expect(
    page.getByText('No tours are listed for this destination yet.', {
      exact: false,
    }),
  ).toBeVisible()
})

test('package prefill submits resolved ID, clearing keeps typed input, invalid slug cannot submit', async ({
  page,
  request,
}) => {
  const tour = await liveTour(request)
  await page.goto('/tours/' + tour.slug)
  await page
    .getByRole('link', { name: 'Contact us', exact: true })
    .first()
    .click()
  await expect(page).toHaveURL(new RegExp('package=' + tour.slug))
  await expect(page.locator('.enquiry-package strong')).toHaveText(tour.title)
  await fillContact(page)
  let payload
  await page.route('**/api/enquiries', (route) => {
    payload = route.request().postDataJSON()
    return route.fulfill({ status: 201, json: { id: 333 } })
  })
  await page.getByRole('button', { name: 'Send enquiry', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Your enquiry is on its way.' }),
  ).toBeVisible()
  expect(payload.tourPackageId).toBe(tour.id)
  await page.goto('/contact?package=missing-tour-999')
  await expect(page.getByText('We couldn’t find that journey.')).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Send enquiry', exact: true }),
  ).toBeDisabled()
  await fillContact(page)
  await page
    .getByRole('button', { name: 'Continue as a general enquiry' })
    .click()
  await expect(page.getByLabel('Your name')).toHaveValue(
    'Frontend verification',
  )
  await page.getByRole('button', { name: 'Send enquiry', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Your enquiry is on its way.' }),
  ).toBeVisible()
  expect(payload).not.toHaveProperty('tourPackageId')
})

for (const width of [360, 768, 1440]) {
  test(
    'Phase 2 responsive controls and details at ' + width + 'px',
    async ({ page, request }) => {
      const tour = await liveTour(request)
      await page.setViewportSize({ width, height: 900 })
      for (const route of [
        '/destinations',
        '/tours',
        '/destinations/sigiriya',
        '/tours/' + tour.slug,
        '/contact?package=' + tour.slug,
      ]) {
        await page.goto(route)
        await expect(page.locator('main h1')).toBeVisible()
        await expect(page.locator('main .loading')).toHaveCount(0)
        if (route.includes('/tours/'))
          await expect(page.locator('.itinerary-day').first()).toBeVisible()
        for (const image of await page.locator('main img:visible').all()) {
          await image.scrollIntoViewIfNeeded()
          await expect
            .poll(() =>
              image.evaluate((img) => img.complete && img.naturalWidth > 0),
            )
            .toBe(true)
        }
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true)
        if (
          route === '/tours' ||
          route.includes('/tours/') ||
          route.includes('/destinations/')
        ) {
          await page.evaluate(() => scrollTo(0, 0))
          await page.screenshot({
            path:
              'test-results/phase2-' +
              (route === '/tours'
                ? 'browse'
                : route.includes('/tours/')
                  ? 'tour'
                  : 'destination') +
              '-' +
              width +
              '.png',
            fullPage: true,
          })
        }
      }
    },
  )
}

test('live package enquiry stores the selected package ID', async ({
  page,
  request,
}) => {
  test.skip(
    process.env.CEYVORA_LIVE_ENQUIRY !== '1',
    'Opt-in marked record; clean up using test-results/live-enquiry.json.',
  )
  const tour = await liveTour(request)
  const email = 'ceyvora-frontend-' + Date.now() + '@example.invalid'
  mkdirSync('test-results', { recursive: true })
  writeFileSync('test-results/live-enquiry.json', JSON.stringify({ email }))
  await page.goto('/contact?package=' + tour.slug)
  await expect(page.locator('.enquiry-package strong')).toHaveText(tour.title)
  await fillContact(page, email)
  const response = page.waitForResponse(
    (r) =>
      r.url().endsWith('/api/enquiries') && r.request().method() === 'POST',
  )
  await page.getByRole('button', { name: 'Send enquiry', exact: true }).click()
  const result = await response
  expect(result.status()).toBe(201)
  const data = await result.json()
  writeFileSync(
    'test-results/live-enquiry.json',
    JSON.stringify({ email, id: data.id, tourPackageId: data.tourPackageId }),
  )
  expect(data.tourPackageId).toBe(tour.id)
  await expect(
    page.getByRole('heading', { name: 'Your enquiry is on its way.' }),
  ).toBeVisible()
})

test('clear filters also resets unapplied edits', async ({ page }) => {
  await page.goto('/tours')
  await page
    .getByLabel('Search tours', { exact: true })
    .fill('Unsubmitted search')
  await page.getByLabel('Min price', { exact: true }).fill('500')
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click()
  await expect(page.getByLabel('Search tours', { exact: true })).toHaveValue('')
  await expect(page.getByLabel('Min price', { exact: true })).toHaveValue('')
})
