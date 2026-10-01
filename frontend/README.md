# Ceyvora frontend

React + Vite, JavaScript. The existing ASP.NET Core backend supplies all destination, tour, review and enquiry data.

## Local setup

Use Node.js 24 and npm. From this directory:

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

In another terminal, start the configured backend:

```powershell
cd D:\Project\CEYVORA\backend
dotnet run --launch-profile http
```

Open http://localhost:5173. Vite uses this exact host/port because the backend development CORS policy allows it. The server fails clearly if the port is already occupied instead of silently moving to a disallowed origin.

`VITE_API_BASE_URL` defaults to `http://localhost:5111`. Set it to the API origin, without `/api`, in `.env.local` if needed, then restart Vite. For HTTPS, trust the backend development certificate first. All `VITE_` variables are public; never put database credentials, JWT signing keys or other secrets in them. Local env files are ignored; `.env.example` is tracked.

## Commands

```powershell
npm run build
npm run lint
npm run format
npm run dev
npm run preview
npm run test:e2e
```

The production build is written to `dist/`. Production hosting must rewrite unmatched application paths to `index.html` for React Router. Configure the backend CORS policy for the deployed frontend origin separately. `npm run preview` is a local bundle preview; its default port is not covered by the existing backend development CORS setting. To preview with real API access, stop the dev server and use `npm run preview -- --host localhost --port 5173`.

## Browser verification

Playwright tests use the installed Microsoft Edge browser by default. To use another installed Chromium browser, set `PLAYWRIGHT_CHANNEL` (for example `chrome`). Run the backend on port 5111 with its existing development demo records before the suite. The live list tests expect at least seven destinations and featured destinations/tours. Vite is started automatically if needed.

Tests combine real API reads with explicit browser-only fixtures for failure, empty, pending, review and pagination cases. Test fixtures never replace production services. `test-results/` and `playwright-report/` are ignored.

The write test is opt-in using `CEYVORA_LIVE_ENQUIRY=1`. It creates one clearly marked local enquiry and records the ID/email in `test-results/live-enquiry.json`. Delete only that exact test record after running it. The Phase 1 verification record was removed successfully. Normal test runs do not submit enquiries to the database.

## Structure

- `src/api`: shared Axios client and environment configuration.
- `src/services`: destination, package, enquiry and review requests.
- `src/hooks/useResource.js`: cancellable loading, error and retry state.
- `src/components/common`: buttons, headers, resource states, cards, image handling.
- `src/components/layout`: navigation, route focus/scroll handling and footer.
- `src/components/home`: the seven homepage feature sections and hero.
- `src/pages`: route pages and Phase 2 placeholders.
- `src/styles`: design tokens and responsive styling.
- `src/utils/images.js`: absolute/relative API image resolution, restricted to HTTP(S).
- `public/images`: optimized, licensed editorial imagery; see ASSETS.md.
- `e2e`: browser verification suite.

See PHASE1_REPORT.md for the verified scope and remaining Phase 2 work.

## Phase 2 browsing

Destination and tour listings now support submit-based search, filters, sorting (tours), server pagination and shareable URLs. Destination cards open `/destinations/:slug`; tour cards open full `/tours/:slug` details. The detail response supplies related places, itinerary and approved reviews. `/contact?package=SLUG` resolves the tour and submits its ID with the enquiry.

Apply filters also applies the selected sort order. Clear filters clears applied and unapplied values. Destination options use paginated API search; province/district filters match the backend's exact names. Prices are compared as stored without currency conversion.

See `PHASE2_REPORT.md` for completed features, endpoint limitations and verification. Phase 1 report is historical: tour-detail placeholders and advanced-filter limitations described there have now been replaced. The optional Phase 2 live-write test can be selected with `npm run test:e2e -- --grep "live package enquiry"` after setting `CEYVORA_LIVE_ENQUIRY=1`. Clean up the exact marked enquiry recorded in `test-results/live-enquiry.json` after such runs. Default test runs do not create enquiries.

## Phase 3 customer accounts

`/login` and `/register` connect to the existing authentication API. `/account`, `/account/profile`, `/account/bookings`, `/account/bookings/:id` and `/tours/:slug/book` require a verified session. Tour planning opens the booking request; the separate Contact us link retains the contextual enquiry flow. Customers can submit reviews for approval on tour details.

Only the issued access token is persisted, under `ceyvora.accessToken` in sessionStorage. It survives reloads in that tab; closing the tab ends persistence. Profiles are loaded from `/api/auth/me` and held only in memory. JavaScript can access this token, so this V1 approach is not an HttpOnly-cookie session. Passwords are held in form controls only and cleared after each authentication request. There is no refresh-token endpoint; an expired session requires signing in again. The backend remains authoritative for roles, identity and booking ownership.

The shared Axios client attaches Bearer tokens. A matching-session 401 clears authentication; 403 keeps the session and shows an access message. Account initialization has a retry state for temporary outages. Redirect destinations are restricted to local account/booking routes.

Run `npm install`, `npm run build`, `npm run lint`, then `npm run dev`. With the existing backend running on port 5111, `npm run test:e2e` runs the public and customer browser checks. The test runner starts and stops Vite when needed. Use only one Vite instance on port 5173.

Real customer writes are opt-in: set `CEYVORA_LIVE_CUSTOMER=1` and run `npm run test:e2e -- --grep "real customer"`. This creates uniquely marked `ceyvora-phase3-...@example.invalid` customers and related bookings/reviews. An ignored `.verification/customers.jsonl` ledger records the exact email addresses, never passwords or tokens. Remove only these test customers and their dependent reviews/bookings after verification. The ordinary suite uses API fixtures for customer data and does not create customers.

See `PHASE3_REPORT.md` for the endpoint contract, implementation scope and verified results.
