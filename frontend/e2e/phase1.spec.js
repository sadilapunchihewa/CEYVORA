import { test, expect } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'

async function fillEnquiry(page, email = 'browser-test@example.invalid') {
  await page.getByLabel('Your name').fill('Frontend verification')
  await page.getByLabel('Email address').fill(email)
  await page.getByLabel('Phone number').fill('+94 770000000')
  await page.getByLabel('Country (optional)').fill('Sri Lanka')
  await page.getByLabel('Arrival date (optional)').fill('2027-08-12')
  await page.getByLabel('Number of travellers').fill('3')
  await page
    .getByLabel('What would you love')
    .fill(
      'Automated Ceyvora frontend verification. Test enquiry; no travel arrangement requested.',
    )
}
async function expectNoOverflow(page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
}
async function loadLazyImages(page) {
  for (const image of await page.locator('img').all()) {
    await image.scrollIntoViewIfNeeded()
    await expect
      .poll(() => image.evaluate((img) => img.complete && img.naturalWidth > 0))
      .toBe(true)
  }
  await page.evaluate(() => scrollTo(0, 0))
}

test('live homepage APIs, images, navigation and console', async ({ page }) => {
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  const destinationsResponse = page.waitForResponse(
    (r) => r.url().endsWith('/api/destinations/featured') && r.status() === 200,
  )
  const toursResponse = page.waitForResponse(
    (r) => r.url().endsWith('/api/tourpackages/featured') && r.status() === 200,
  )
  await page.goto('/')
  const destinations = await (await destinationsResponse).json()
  const tours = await (await toursResponse).json()
  expect(Array.isArray(destinations)).toBe(true)
  expect(Array.isArray(tours)).toBe(true)
  expect(destinations.length).toBeGreaterThan(0)
  expect(tours.length).toBeGreaterThan(0)
  await expect(page.locator('.destination-card')).toHaveCount(
    Math.min(destinations.length, 4),
  )
  await expect(
    page.getByRole('heading', { name: destinations[0].name, exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: tours[0].title, exact: true }),
  ).toBeVisible()
  await expect(page.locator('.stories .loading')).toHaveCount(0)
  await loadLazyImages(page)
  await expectNoOverflow(page)
  await page.screenshot({
    path: 'test-results/home-desktop.png',
    fullPage: true,
  })
  await page.evaluate(() => scrollTo(0, 500))
  await expect(page.locator('.site-header')).toHaveClass(/is-solid/)
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Tours', exact: true })
    .click()
  await expect(page).toHaveURL(/\/tours$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Explore Our Journeys',
  )
  expect(errors).toEqual([])
})

test('live listings paginate and destination details link to matching tours', async ({
  page,
}) => {
  await page.goto('/destinations')
  await expect(page.locator('.destination-card')).toHaveCount(6)
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(page).toHaveURL(/page=2/)
  await expect(page.getByText('Page 2 of')).toBeVisible()
  await page.getByRole('button', { name: 'Previous', exact: true }).click()
  await expect(page.getByText('Page 1 of')).toBeVisible()
  await page.locator('.destination-card .text-link').first().click()
  await expect(page).toHaveURL(/\/destinations\/.+/)
  await page.getByRole('link', { name: 'Find journeys here' }).click()
  await expect(page).toHaveURL(/destinationId=/)
  await expect(page.locator('.travel-card').first()).toBeVisible()
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click()
  await expect(page).toHaveURL(/\/tours$/)
  await page.locator('.travel-card .text-link').first().click()
  await expect(
    page.getByRole('heading', { name: 'Your journey', exact: true }),
  ).toBeVisible()
})

for (const width of [360, 768, 1024]) {
  test('responsive layout at ' + width + 'px', async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await expect(page.locator('.destination-card').first()).toBeVisible()
    if (width <= 900) {
      await page.getByRole('button', { name: 'Menu' }).click()
      await expect(page.getByRole('button', { name: 'Close' })).toHaveAttribute(
        'aria-expanded',
        'true',
      )
      await page.keyboard.press('Escape')
      await expect(page.getByRole('button', { name: 'Menu' })).toBeFocused()
      await page.getByRole('button', { name: 'Menu' }).click()
      await page
        .getByRole('navigation', { name: 'Main navigation' })
        .getByRole('link', { name: 'Contact', exact: true })
        .click()
      await expect(page).toHaveURL(/\/contact$/)
      await expect(page.getByRole('button', { name: 'Menu' })).toHaveAttribute(
        'aria-expanded',
        'false',
      )
      await expectNoOverflow(page)
      await page.goto('/')
    }
    await loadLazyImages(page)
    await expectNoOverflow(page)
    await page.screenshot({
      path: 'test-results/home-' + width + '.png',
      fullPage: true,
    })
    for (const route of [
      '/destinations',
      '/tours',
      '/about',
      '/contact',
      '/login',
      '/not-a-page',
    ]) {
      await page.goto(route)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expectNoOverflow(page)
    }
    await page.goto('/contact')
    await page.screenshot({
      path: 'test-results/contact-' + width + '.png',
      fullPage: true,
    })
  })
}

test('loading, failure, retry and empty destinations', async ({ page }) => {
  let release
  const gate = new Promise((resolve) => {
    release = resolve
  })
  await page.route('**/api/destinations/featured', async (route) => {
    await gate
    await route.fulfill({ status: 503, json: {} })
  })
  await page.goto('/')
  await expect(
    page.getByRole('status').filter({ hasText: 'Loading destinations' }),
  ).toBeVisible()
  release()
  await expect(
    page.getByRole('heading', {
      name: 'Unable to load destinations right now.',
    }),
  ).toBeVisible()
  await page.unroute('**/api/destinations/featured')
  await page.route('**/api/destinations/featured', (route) =>
    route.fulfill({ json: [] }),
  )
  await page
    .getByRole('alert')
    .filter({ hasText: 'Unable to load destinations' })
    .getByRole('button', { name: 'Try again' })
    .click()
  await expect(
    page.getByRole('heading', { name: 'No destinations to show yet.' }),
  ).toBeVisible()
})

test('tour pagination respects response envelope; missing images recover', async ({
  page,
}) => {
  const item = {
    id: 900,
    title: 'Browser test journey',
    slug: 'browser-test',
    durationDays: 4,
    durationNights: 3,
    startingPrice: 450,
    currency: 'USD',
    shortDescription: 'Browser fixture only.',
    heroImageUrl: '/uploads/not-found-test.webp',
  }
  await page.route('**/uploads/not-found-test.webp', (route) =>
    route.fulfill({ status: 404 }),
  )
  await page.route('**/api/tourpackages?**', (route) => {
    const current = Number(
      new URL(route.request().url()).searchParams.get('page'),
    )
    return route.fulfill({
      json: {
        items: [{ ...item, title: item.title + ' ' + current }],
        page: current,
        pageSize: 6,
        totalItems: 7,
        totalPages: 2,
      },
    })
  })
  await page.goto('/tours')
  await expect(
    page.getByRole('heading', { name: 'Browser test journey 1' }),
  ).toBeVisible()
  await expect(page.getByText('Illustrative image')).toBeVisible()
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Browser test journey 2' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Next', exact: true }),
  ).toBeDisabled()
})

test('contact validation, server errors, pending and success', async ({
  page,
}) => {
  await page.goto('/contact')
  await page.getByRole('button', { name: 'Send enquiry', exact: true }).click()
  await expect(page.getByText('Please enter your name.')).toBeVisible()
  await expect(page.getByLabel('Your name')).toBeFocused()
  await fillEnquiry(page)
  await page.route('**/api/enquiries', (route) =>
    route.fulfill({
      status: 400,
      json: { errors: { Phone: ['Please check the phone number.'] } },
    }),
  )
  await page.getByRole('button', { name: 'Send enquiry', exact: true }).click()
  await expect(page.getByText('Please check the phone number.')).toBeVisible()
  await page.unroute('**/api/enquiries')
  await page.route('**/api/enquiries', (route) =>
    route.fulfill({ status: 500, json: { title: 'Internal error' } }),
  )
  await page.getByRole('button', { name: 'Send enquiry', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('We couldn’t confirm')
  await expect(page.getByLabel('Your name')).toHaveValue(
    'Frontend verification',
  )
  await page.unroute('**/api/enquiries')
  let release
  let payload
  let calls = 0
  const gate = new Promise((resolve) => {
    release = resolve
  })
  await page.route('**/api/enquiries', async (route) => {
    payload = route.request().postDataJSON()
    calls++
    await gate
    await route.fulfill({ status: 201, json: { id: 999, status: 'New' } })
  })
  await page.getByRole('button', { name: 'Send enquiry', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Sending enquiry…' }),
  ).toBeDisabled()
  release()
  await expect(
    page.getByRole('heading', { name: 'Your enquiry is on its way.' }),
  ).toBeVisible()
  expect(calls).toBe(1)
  expect(payload.numberOfTravellers).toBe(3)
  expect(payload.arrivalDate).toBe('2027-08-12T00:00:00.000Z')
  expect(payload).not.toHaveProperty('password')
  await page.getByRole('button', { name: 'Send another enquiry' }).click()
  await expect(page.getByLabel('Your name')).toHaveValue('')
})

test('approved reviews render without displaying unapproved content', async ({
  page,
}) => {
  await page.route('**/api/reviews/package/*', (route) =>
    route.fulfill({
      json: [
        {
          id: Number(route.request().url().split('/').pop()),
          isApproved: true,
          rating: 4,
          customerName: 'Browser test reviewer',
          comment: 'Approved browser test fixture, not a real testimonial.',
        },
        {
          id: 9999,
          isApproved: false,
          rating: 5,
          customerName: 'Hidden test reviewer',
          comment: 'Unapproved test content.',
        },
      ],
    }),
  )
  await page.goto('/')
  await expect(page.locator('.review')).toHaveCount(3)
  await expect(page.getByText('Unapproved test content.')).toHaveCount(0)
})

test('keyboard entry, route focus and reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.keyboard.press('Tab')
  await expect(
    page.getByRole('link', { name: 'Skip to content' }),
  ).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('main')).toBeFocused()
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'About', exact: true })
    .click()
  await expect(page.locator('main')).toBeFocused()
  expect(
    await page
      .locator('.site-header')
      .evaluate((el) => getComputedStyle(el).transitionDuration),
  ).toBe('0s')
})

test('live enquiry reaches the backend', async ({ page }) => {
  test.skip(
    process.env.CEYVORA_LIVE_ENQUIRY !== '1',
    'Opt-in: creates one marked enquiry. Clean up using the recorded ID/email after verification.',
  )
  const email = 'ceyvora-frontend-' + Date.now() + '@example.invalid'
  mkdirSync('test-results', { recursive: true })
  writeFileSync('test-results/live-enquiry.json', JSON.stringify({ email }))
  await page.goto('/contact')
  await fillEnquiry(page, email)
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
    JSON.stringify({ email, id: data.id }),
  )
  expect(data.email).toBe(email)
  expect(data.numberOfTravellers).toBe(3)
  await expect(
    page.getByRole('heading', { name: 'Your enquiry is on its way.' }),
  ).toBeVisible()
})
