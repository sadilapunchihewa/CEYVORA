import { expect, test } from '@playwright/test'

const destination = {
  id: 1,
  name: 'Kandy',
  slug: 'kandy',
  shortDescription: 'A hill city shaped by culture.',
  description:
    'Kandy brings together gardens, temples and the cool rhythm of the hills.',
  district: 'Kandy',
  province: 'Central Province',
  imageUrl: null,
  isFeatured: true,
  isActive: true,
  createdAt: '2026-01-01T00:00:00Z',
  tourPackages: [],
}
const tour = {
  id: 1,
  title: 'Hill Country Passage',
  slug: 'hill-country-passage',
  shortDescription: 'A measured journey through the highlands.',
  description: 'Travel from historic Kandy into tea country.',
  durationDays: 4,
  durationNights: 3,
  startingPrice: 850,
  currency: 'USD',
  heroImageUrl: null,
  isFeatured: true,
  isActive: true,
  createdAt: '2026-01-01T00:00:00Z',
  destinations: [destination],
  itineraryDays: [
    {
      id: 1,
      tourPackageId: 1,
      dayNumber: 1,
      title: 'Arrive in Kandy',
      description: 'Settle into the hills.',
      accommodation: 'Kandy',
      meals: 'Breakfast',
    },
  ],
  approvedReviews: [],
}
const pageResult = (items) => ({
  items,
  page: 1,
  pageSize: 6,
  totalItems: items.length,
  totalPages: 1,
})

async function mockPublic(page) {
  await page.route('**/api/destinations/featured', (r) =>
    r.fulfill({ json: [destination] }),
  )
  await page.route('**/api/tourpackages/featured', (r) =>
    r.fulfill({ json: [tour] }),
  )
  await page.route('**/api/reviews/package/*', (r) => r.fulfill({ json: [] }))
  await page.route('**/api/destinations/slug/*', (r) =>
    r.fulfill({ json: destination }),
  )
  await page.route('**/api/tourpackages/slug/*', (r) =>
    r.fulfill({ json: tour }),
  )
  await page.route('**/api/destinations?**', (r) =>
    r.fulfill({ json: pageResult([destination]) }),
  )
  await page.route('**/api/tourpackages?**', (r) =>
    r.fulfill({ json: pageResult([tour]) }),
  )
}

const noOverflow = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)

for (const width of [320, 375, 390, 430, 768, 820, 1024, 1280, 1440, 1920]) {
  test(`final public layout has no overflow at ${width}px`, async ({
    page,
  }) => {
    await mockPublic(page)
    await page.setViewportSize({ width, height: 900 })
    for (const route of [
      '/',
      '/destinations',
      '/tours',
      '/destinations/kandy',
      '/tours/hill-country-passage',
      '/about',
      '/contact',
      '/login',
      '/register',
      '/missing',
    ]) {
      await page.goto(route)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      expect(await noOverflow(page), route).toBe(true)
    }
    if (width === 390 || width === 1440) {
      await page.goto('/')
      await page.screenshot({
        path: `test-results/final-home-${width}.png`,
        fullPage: true,
      })
    }
  })
}

test('titles, mobile navigation and logged-out guards', async ({ page }) => {
  await mockPublic(page)
  await page.goto('/')
  await expect(page).toHaveTitle('Ceyvora | Discover Sri Lanka')
  await page.goto('/tours')
  await expect(page).toHaveTitle('Sri Lanka Tours | Ceyvora')
  await page.goto('/destinations/kandy')
  await expect(page).toHaveTitle('Kandy | Ceyvora')
  await page.setViewportSize({ width: 375, height: 800 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Menu' }).click()
  await expect(page.locator('body')).toHaveClass(/mobile-menu-open/)
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Tours', exact: true })
    .click()
  await expect(page).toHaveURL(/\/tours$/)
  await expect(page.locator('body')).not.toHaveClass(/mobile-menu-open/)
  await page.goto('/account')
  await expect(page).toHaveURL(/\/login$/)
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/login$/)
})

test('editorial journey discovery keeps every tour control functional', async ({
  page,
}) => {
  await mockPublic(page)
  await page.goto('/tours')
  await expect(
    page.getByRole('heading', {
      name: 'Find your way through Sri Lanka.',
    }),
  ).toBeVisible()
  await expect(page.getByText('1 journey', { exact: true })).toBeVisible()
  await expect(
    page.getByLabel('Route: Kandy').getByText('Kandy', { exact: true }),
  ).toBeVisible()
  await page.screenshot({
    path: 'test-results/final-tours-1440.png',
    fullPage: true,
  })

  await page.getByRole('button', { name: '6–10 days' }).click()
  await expect(page).toHaveURL(/minDays=6/)
  await expect(page).toHaveURL(/maxDays=10/)

  await page.getByLabel('Sort by').selectOption('price_asc')
  await expect(page).toHaveURL(/sort=price_asc/)

  await page.getByRole('button', { name: 'Filters +' }).click()
  await expect(page.getByLabel('Min price')).toBeVisible()
  await page.getByLabel('Min price').fill('500')
  await page.getByRole('button', { name: 'Apply filters' }).click()
  await expect(page).toHaveURL(/minPrice=500/)

  await page.getByRole('button', { name: 'All journeys' }).click()
  await expect(page).not.toHaveURL(/minDays=/)
  await expect(page).not.toHaveURL(/maxDays=/)

  await page.getByLabel('Where do you want to go?').fill('Kandy')
  await page.getByRole('button', { name: 'Search journeys' }).click()
  await expect(page).toHaveURL(/search=Kandy/)
  await expect(
    page.getByRole('link', { name: /Explore journey/ }),
  ).toHaveAttribute('href', '/tours/hill-country-passage')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/tours')
  await page.screenshot({
    path: 'test-results/final-tours-390.png',
    fullPage: true,
  })
  expect(await noOverflow(page)).toBe(true)
})

test('customer role receives branded admin access denied without logout', async ({
  page,
}) => {
  await page.addInitScript(() =>
    sessionStorage.setItem('ceyvora.accessToken', 'customer-token'),
  )
  await page.route('**/api/auth/me', (r) =>
    r.fulfill({
      json: {
        userId: 4,
        fullName: 'Test Traveller',
        email: 'traveller@example.invalid',
        role: 'Customer',
      },
    }),
  )
  await page.goto('/admin')
  await expect(
    page.getByRole('heading', { name: 'Access denied' }),
  ).toBeVisible()
  expect(
    await page.evaluate(() => sessionStorage.getItem('ceyvora.accessToken')),
  ).toBe('customer-token')
})

test('admin dashboard renders real response counts and responsive drawer', async ({
  page,
}) => {
  await page.addInitScript(() =>
    sessionStorage.setItem('ceyvora.accessToken', 'admin-token'),
  )
  await page.route('**/api/auth/me', (r) =>
    r.fulfill({
      json: {
        userId: 1,
        fullName: 'Ceyvora Admin',
        email: 'admin@example.invalid',
        role: 'Admin',
      },
    }),
  )
  await page.route('**/api/destinations?**', (r) =>
    r.fulfill({ json: { ...pageResult([destination]), totalItems: 8 } }),
  )
  await page.route('**/api/tourpackages?**', (r) =>
    r.fulfill({ json: { ...pageResult([tour]), totalItems: 5 } }),
  )
  await page.route('**/api/bookings?**', (r) =>
    r.fulfill({ json: { ...pageResult([]), totalItems: 2 } }),
  )
  await page.route('**/api/enquiries?**', (r) =>
    r.fulfill({ json: { ...pageResult([]), totalItems: 3 } }),
  )
  await page.route('**/api/reviews?**', (r) =>
    r.fulfill({ json: { ...pageResult([]), totalItems: 4 } }),
  )
  await page.setViewportSize({ width: 375, height: 800 })
  await page.goto('/admin')
  await expect(
    page.getByRole('heading', { name: 'Ceyvora Admin' }),
  ).toBeVisible()
  await expect(page.getByText('8', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Open navigation' }).click()
  await expect(
    page.getByRole('navigation', { name: 'Admin navigation' }),
  ).toBeVisible()
  expect(await noOverflow(page)).toBe(true)
})
