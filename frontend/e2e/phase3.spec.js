import { test, expect } from '@playwright/test'
import { appendFileSync, mkdirSync } from 'node:fs'
const api = 'http://localhost:5111'
const user = {
  userId: 901,
  fullName: 'Maya Traveller',
  email: 'maya@example.invalid',
  role: 'Customer',
  phone: '+94770000000',
  country: 'Sri Lanka',
}
test('registration validation, password toggle, duplicate and unavailable service messages', async ({
  page,
}) => {
  await page.goto('/register')
  await page
    .getByRole('button', { name: 'Create account', exact: true })
    .click()
  await expect(page.getByText('Enter your full name.')).toBeVisible()
  await page.getByLabel('Full name', { exact: true }).fill('Maya Traveller')
  await page.getByLabel('Email', { exact: true }).fill('maya@example.invalid')
  await page.getByLabel('Password', { exact: true }).fill('Journey123')
  await page
    .getByLabel('Confirm password', { exact: true })
    .fill('Different123')
  await page.getByRole('button', { name: 'Show password', exact: true }).click()
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute(
    'type',
    'text',
  )
  await page
    .getByRole('button', { name: 'Create account', exact: true })
    .click()
  await expect(page.getByText('Passwords must match.')).toBeVisible()
  await page.getByLabel('Confirm password', { exact: true }).fill('Journey123')
  await page.route('**/api/auth/register', (route) => {
    const payload = route.request().postDataJSON()
    expect(payload).not.toHaveProperty('role')
    expect(payload).not.toHaveProperty('confirmPassword')
    return route.fulfill({ status: 409 })
  })
  await page
    .getByRole('button', { name: 'Create account', exact: true })
    .click()
  await expect(page.getByRole('alert')).toContainText('Try signing in')
  await expect(page.getByLabel('Password', { exact: true })).toHaveValue('')
  await page.goto('/login')
  await page.route('**/api/auth/login', (r) => r.fulfill({ status: 500 }))
  await page.getByLabel('Email', { exact: true }).fill('maya@example.invalid')
  await page.getByLabel('Password', { exact: true }).fill('Journey123')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('right now')
})
test('booking empty, retry, unavailable detail and review errors', async ({
  page,
  request,
}) => {
  await fixtureAuth(page)
  await page.route('**/api/bookings/my', (r) => r.fulfill({ status: 500 }))
  await page.goto('/account/bookings')
  await expect(page.getByRole('alert')).toContainText(
    'couldn’t load your bookings',
  )
  await page.route('**/api/bookings/my', (r) => r.fulfill({ json: [] }))
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(
    page.getByRole('heading', { name: 'No journeys booked yet.' }),
  ).toBeVisible()
  await page.route('**/api/bookings/my/999', (r) => r.fulfill({ status: 404 }))
  await page.goto('/account/bookings/999')
  await expect(
    page.getByRole('heading', { name: 'Booking not found' }),
  ).toBeVisible()
  const tour = (
    await (await request.get(api + '/api/tourpackages/featured')).json()
  )[0]
  await page.goto('/tours/' + tour.slug)
  await page.route('**/api/reviews', (r) => r.fulfill({ status: 403 }))
  await page
    .getByLabel('Your review')
    .fill('A lovely journey around Sri Lanka.')
  await page.getByRole('button', { name: 'Submit review' }).click()
  await expect(page.getByRole('alert')).toContainText('does not have access')
  await expect(
    page.getByRole('button', { name: 'Logout', exact: true }),
  ).toBeVisible()
})
async function fixtureAuth(page) {
  await page.addInitScript(() =>
    sessionStorage.setItem('ceyvora.accessToken', 'fixture-token'),
  )
  await page.route('**/api/auth/me', (route) => route.fulfill({ json: user }))
}
test('real customer registration, login, booking, private ownership, review and logout', async ({
  page,
  request,
}) => {
  test.skip(
    process.env.CEYVORA_LIVE_CUSTOMER !== '1',
    'Explicit opt-in for real temporary customer records',
  )
  test.setTimeout(90000)
  const email = `ceyvora-phase3-${Date.now()}@example.invalid`
  const password = 'Journey' + crypto.randomUUID() + '8'
  mkdirSync('.verification', { recursive: true })
  appendFileSync(
    '.verification/customers.jsonl',
    JSON.stringify({ email }) + '\n',
  )
  await page.goto('/')
  await page.goto('/register')
  await page
    .getByLabel('Full name', { exact: true })
    .fill('Phase Three Traveller')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByLabel('Confirm password', { exact: true }).fill(password)
  const registration = page.waitForResponse((r) =>
    r.url().endsWith('/api/auth/register'),
  )
  await page
    .getByRole('button', { name: 'Create account', exact: true })
    .click()
  expect((await registration).status()).toBe(201)
  await expect(page).toHaveURL(/\/account$/)
  await expect(
    page.getByRole('heading', { name: 'Welcome back, Phase' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Logout', exact: true }).click()
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page
    .getByLabel('Password', { exact: true })
    .fill('IncorrectPassword123')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText(
    'Check your email and password',
  )
  const duplicate = await request.post(api + '/api/auth/register', {
    data: { fullName: 'Phase Three Traveller', email, password },
  })
  expect(duplicate.status()).toBe(409)
  const tour = (
    await (await request.get(api + '/api/tourpackages/featured')).json()
  )[0]
  await page.goto('/tours/' + tour.slug)
  await page
    .getByRole('link', { name: 'Plan this journey', exact: true })
    .first()
    .click()
  await expect(page).toHaveURL(/\/login$/)
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page).toHaveURL(new RegExp('/tours/' + tour.slug + '/book$'))
  await expect(
    page.getByRole('link', { name: 'My account', exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Send travel request' }).click()
  await expect(page.getByText('Choose a future travel date.')).toBeVisible()
  await page
    .getByLabel('Travel date')
    .fill(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10))
  await page.getByLabel('Phone', { exact: true }).fill('+94770000000')
  await page
    .getByLabel('Special requests (optional)')
    .fill('Automated Phase 3 verification; temporary test record.')
  const created = page.waitForResponse(
    (r) => r.url().endsWith('/api/bookings') && r.request().method() === 'POST',
  )
  await page.getByRole('button', { name: 'Send travel request' }).click()
  const response = await created
  expect(response.status()).toBe(201)
  const booking = await response.json()
  expect(booking.status).toBe('Pending')
  expect(booking.totalAmount).toBeNull()
  expect(response.request().postDataJSON()).not.toHaveProperty('userId')
  await page.getByRole('link', { name: 'View my bookings' }).click()
  await expect(page.getByRole('heading', { name: tour.title })).toBeVisible()
  await page.getByRole('link', { name: 'View booking', exact: true }).click()
  await expect(
    page.getByText('Your request is awaiting review.', { exact: false }),
  ).toBeVisible()
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Booking details' }),
  ).toBeVisible()
  const otherEmail = email.replace('@', '-other@')
  appendFileSync(
    '.verification/customers.jsonl',
    JSON.stringify({ email: otherEmail }) + '\n',
  )
  const otherResponse = await request.post(api + '/api/auth/register', {
    data: { fullName: 'Phase Three Other', email: otherEmail, password },
  })
  expect(otherResponse.status()).toBe(201)
  const other = await otherResponse.json()
  const forbidden = await request.get(api + '/api/bookings/my/' + booking.id, {
    headers: { Authorization: 'Bearer ' + other.token },
  })
  expect(forbidden.status()).toBe(404)
  const storage = await page.evaluate(() => ({
    session: Object.keys(sessionStorage),
    local: Object.keys(localStorage),
  }))
  expect(storage.session).toEqual(['ceyvora.accessToken'])
  expect(storage.local).toEqual([])
  await page.goto('/tours/' + tour.slug)
  await page.getByLabel('Your rating').selectOption('4')
  await page
    .getByLabel('Your review')
    .fill('Automated Phase 3 verification review; please remove.')
  const reviewResponse = page.waitForResponse(
    (r) => r.url().endsWith('/api/reviews') && r.request().method() === 'POST',
  )
  await page.getByRole('button', { name: 'Submit review' }).click()
  const review = await (await reviewResponse).json()
  expect(review.isApproved).toBe(false)
  await expect(page.getByRole('status')).toContainText('submitted for approval')
  const publicReviews = await (
    await request.get(api + '/api/reviews/package/' + tour.id)
  ).json()
  expect(publicReviews.some((r) => r.id === review.id)).toBe(false)
  await page.getByRole('button', { name: 'Logout', exact: true }).click()
  await page.goto('/account/bookings')
  await expect(page).toHaveURL(/\/login$/)
})
test('invalid token clears session; forbidden booking keeps session', async ({
  page,
}) => {
  await fixtureAuth(page)
  await page.route('**/api/bookings/my/99', (r) => r.fulfill({ status: 403 }))
  await page.goto('/account/bookings/99')
  await expect(page.getByRole('alert')).toContainText(
    'isn’t available to your account',
  )
  expect(
    await page.evaluate(() => sessionStorage.getItem('ceyvora.accessToken')),
  ).toBe('fixture-token')
  await page.route('**/api/bookings/my', (r) => r.fulfill({ status: 401 }))
  await page.goto('/account/bookings')
  await expect(page).toHaveURL(/\/login$/)
  expect(
    await page.evaluate(() => sessionStorage.getItem('ceyvora.accessToken')),
  ).toBeNull()
  await page.route('**/api/auth/me', (r) => r.fulfill({ status: 401 }))
  await page.goto('/account/profile')
  await expect(page).toHaveURL(/\/login$/)
})
test('customer pages responsive and mobile logout works', async ({
  page,
  request,
}) => {
  test.setTimeout(90000)
  const tour = (
    await (await request.get(api + '/api/tourpackages/featured')).json()
  )[0]
  const booking = {
    id: 99,
    tourPackageId: tour.id,
    customerName: user.fullName,
    email: user.email,
    phone: user.phone,
    travelDate: '2027-04-15T00:00:00Z',
    createdAt: '2026-09-29T00:00:00Z',
    adults: 2,
    children: 0,
    status: 'Pending',
    totalAmount: null,
  }
  await page.route('**/api/bookings/my', (r) => r.fulfill({ json: [booking] }))
  await page.route('**/api/bookings/my/99', (r) => r.fulfill({ json: booking }))
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    for (const path of ['/login', '/register']) {
      await page.goto(path)
      await expect(page.locator('main h1')).toBeVisible()
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true)
    }
  }
  await fixtureAuth(page)
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    for (const path of [
      '/account',
      '/account/profile',
      '/account/bookings',
      '/account/bookings/99',
      '/tours/' + tour.slug + '/book',
      '/tours/' + tour.slug,
    ]) {
      await page.goto(path)
      await expect(page.locator('main h1')).toBeVisible()
      await expect(page.locator('main .loading')).toHaveCount(0)
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        path + ' at ' + width,
      ).toBe(true)
    }
    await page.goto('/account')
    await page.screenshot({
      path: `test-results/account-${width}.png`,
      fullPage: true,
    })
  }
  await page.setViewportSize({ width: 360, height: 800 })
  await page.getByRole('button', { name: 'Menu' }).click()
  await expect(
    page.getByRole('link', { name: 'My account', exact: true }).first(),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Logout', exact: true }).click()
  await expect(page).toHaveURL(/\/login$/)
})
