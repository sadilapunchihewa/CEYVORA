# Phase 3 — React integration contract

Phase 3 extends the existing backend. JWT, roles, booking ownership, public enquiries and review approval remain in place. No frontend, payment, external API or authentication-provider integration was added.

## Changes and file inventory

Created:

- DTOs/Common/PagedResultDto.cs: PageQuery, reusable PagedResultDto and EF paging extension.
- DTOs/QueryDtos.cs: destination, package, booking, enquiry and review query validation; VisitOrderDto.
- DTOs/DetailsDtos.cs: flat destination/package detail DTOs, including ordered package destinations.
- DTOs/ImageUploadDto.cs: multipart input and image URL response.
- Services/IFileService.cs, FileService.cs: local uploads, validation and safe cleanup.
- Services/DetailsService.cs: read-only related DTO projections.
- Services/SlugHelper.cs and SearchHelper.cs: normalized/generated slugs and literal search patterns.
- Services/ApiExceptionHandler.cs and ApiErrorFilter.cs: safe, consistent errors.
- Validation/ImageUrlAttribute.cs: HTTP(S) or generated application upload URLs.
- wwwroot/uploads/destinations/.gitkeep and wwwroot/uploads/packages/.gitkeep.
- Migrations/20260925155119_AddMediaAndIndexes.cs and its Designer.cs.
- PHASE3.md (this file).

Modified:

- Models/PackageDestination.cs: VisitOrder (default 0 for existing links).
- Data/AppDbContext.cs and Migrations/AppDbContextModelSnapshot.cs: unique slug and useful admin-filter indexes.
- DTOs/TourismDtos.cs: optional normalized slug, support for relative image URLs.
- DTOs/Auth/LoginDto.cs: unused import removed.
- Controllers/DestinationsController.cs and TourPackagesController.cs: search/filter/paging, details, image upload and normalized slug handling.
- Controllers/BookingsController.cs, EnquiriesController.cs, ReviewsController.cs: paginated admin filters.
- Controllers/PackageDestinationsController.cs: attach visit order, public ordering, admin order update.
- Program.cs: file/details services, exception handling, ProblemDetails and static files.
- ../.gitignore: runtime media excluded, folder placeholders retained.
- ../tests/Backend.SmokeTests/Program.cs: Phase 2 regression and Phase 3 integration/security tests.
- ../README.md: link to this contract.

No new model classes or NuGet packages were needed. One destination image and one package HeroImageUrl are retained for this version. Optional galleries are deferred to avoid introducing a second image-management workflow before React requirements are known.

## List response contract

These GET endpoints now return an object rather than the Phase 2 bare array:

- /api/destinations
- /api/tourpackages
- Admin /api/bookings, /api/enquiries, /api/reviews

```json
{
  "items": [],
  "page": 1,
  "pageSize": 12,
  "totalItems": 0,
  "totalPages": 0
}
```

React must read response.items. Defaults: page=1, pageSize=12. Allowed pageSize is 1–50; page is 1–1,000,000 to prevent integer overflow. Invalid input returns 400; a valid page beyond the results returns empty items with the correct counts. Queries use PostgreSQL Count/Skip/Take with deterministic ID tie-breakers, and AsNoTracking.

Existing /featured, customer /bookings/my, itinerary, package destinations and public package reviews remain arrays.

### Search/filter parameters

| Endpoint | Optional query parameters |
| --- | --- |
| Destinations | search, province, district, featured, page, pageSize |
| Tour packages | search, minPrice, maxPrice, minDays, maxDays, destinationId, featured, sort, page, pageSize |
| Admin bookings | status, search, fromDate, toDate, page, pageSize |
| Admin enquiries | status, search, page, pageSize |
| Admin reviews | approved, rating, packageId, page, pageSize |

Destination search checks name, short description, district and province; province/district filters are case-insensitive exact matches after trimming. Package search checks title and short description. Booking search checks customer name/email; enquiry search checks name/email/country. Search is case-insensitive. Percent, underscore and backslash are treated literally, not as wildcard syntax.

Package sort supports price_asc, price_desc, duration_asc, duration_desc and newest (default). Destinations sort by name. Admin lists sort newest first. All filters use LINQ/EF parameterized queries; arbitrary sort expressions are rejected.

Booking date filters apply to TravelDate, use YYYY-MM-DD and include both boundary dates in UTC. Minimum values cannot exceed maximum values. Status values remain those documented in PHASE2.md. Price filtering compares numeric StartingPrice; currency conversion is not performed.

## Details and ordering

Destination GET by ID or slug preserves its original fields and adds tourPackages: a bounded preview of the latest 12 active associated packages. Use /api/tourpackages?destinationId=ID for the complete paged result.

Package GET by ID or slug preserves its original fields and adds:

- destinations: active destinations, ordered by VisitOrder then destination ID; includes id, name, slug, imageUrl, visitOrder.
- itineraryDays: ordered by DayNumber then ID.
- approvedReviews: latest 50 approved reviews; the existing public review endpoint remains available.

Only DTOs are serialized; no EF navigation graphs, passwords or private account fields are exposed.

Attach destinations with POST /api/tourpackages/{packageId}/destinations/{destinationId}?visitOrder=2. Omitting order uses 0. Change it with PUT on the same path plus /order and body { "visitOrder": 2 }. Both mutations require Admin. Existing package-destination GET remains an array of destination DTOs, now ordered by VisitOrder; package details expose the order values.

## Images

Admin multipart endpoints:

- POST /api/destinations/{id}/image
- POST /api/tourpackages/{id}/image

Form field: file. Success is 200 with { "imageUrl": "/uploads/..." }. The destination ImageUrl or package HeroImageUrl is updated in PostgreSQL.

Validation checks nonempty content, a maximum of 5 MiB, extension, matching MIME type and format signatures for JPG/JPEG, PNG and WebP. Multipart request overhead has an additional 64 KiB allowance; requests beyond the request limit may return 413. SVG and arbitrary files are rejected. This is signature validation, not a full image decoder or image transformation pipeline.

Storage names are generated GUIDs. Original filenames never become filesystem paths. Database values contain public relative URLs only; file bytes live under wwwroot/uploads/destinations or packages. Use the API origin when resolving these URLs from React.

Static files are public, served with X-Content-Type-Options: nosniff. No directory browsing is enabled. For an upload replacing an old image, cleanup accepts only generated GUID paths in the application's two upload directories, rejects links/traversal/external URLs and checks that no destination/package still references the old URL. Concurrent upload updates use the previous image URL as a condition; a conflicting update returns 409 and cleans up its new file. Failed cleanup is logged without changing an already successful response.

Local media is ignored by Git. A crash between filesystem and database operations can leave an orphan file; there is no distributed file/database transaction. For production hosting, configure persistent storage and backups or replace the local file service with managed object storage. Public clients can view images, but only Admin can upload or replace them.

## Slugs and indexes

Slugs are trimmed and lowercased. Create requests may omit a slug; the server generates a Latin-letter/digit slug from Name/Title, stripping accents and collapsing separators. If the title cannot yield one, supply an explicit slug. Omitted slugs on updates preserve the existing link. Duplicates, including concurrent database conflicts, return 409. The application does not append random suffixes automatically.

Migration **20260925155119_AddMediaAndIndexes** adds:

- PackageDestination.VisitOrder.
- Unique indexes on Destination.Slug and TourPackage.Slug.
- Booking.Status, Booking.TravelDate and Enquiry.Status indexes.

Existing unique User.Email and foreign-key indexes remain. The migration checks existing normalized slugs before updating them; collisions or invalid old slugs cause an atomic failure with no records deleted. It trims/lowercases valid legacy slugs before creating the indexes. Normalization is not undone by a rollback. No previous migration was changed or deleted.

## Error responses and CORS

Errors use application/problem+json with status, title and traceId; validation errors additionally include errors by field. A typical internal error is:

```json
{
  "status": 500,
  "title": "An unexpected error occurred.",
  "traceId": "..."
}
```

Do not rely on the old anonymous-object message field. Unexpected client responses exclude exception details, PostgreSQL errors, paths and connection strings. The central handler logs the exception type and trace ID; normal ASP.NET logging remains available server-side. Invalid uploads return 400, request-size limits can return 413, missing records return 404, and slug/concurrency conflicts return 409.

Authentication remains 401 for missing/invalid tokens and 403 for insufficient role. Account deactivation, stale roles, ownership checks and customer-only review creation are unchanged.

The named React CORS policy permits http://localhost:5173 in Development, all methods and request headers including Authorization. Other origins are denied unless configured through Cors:AllowedOrigins. Production does not default to an open origin policy. No wildcard-origin/credentials combination is used.

## Full API route summary

All routes below begin with /api. PUBLIC needs no token. CUSTOMER means an authenticated account; the existing booking/profile endpoints also permit Admin. Review creation specifically requires the Customer role. ADMIN requires the Admin role.

### AUTH

| Method | Route | Access |
| --- | --- | --- |
| POST | /auth/register | PUBLIC |
| POST | /auth/login | PUBLIC |
| GET | /auth/me | CUSTOMER / ADMIN |

### DESTINATIONS

| Method | Route | Access |
| --- | --- | --- |
| GET | /destinations | PUBLIC, paginated |
| GET | /destinations/{id} | PUBLIC, details |
| GET | /destinations/slug/{slug} | PUBLIC, details |
| GET | /destinations/featured | PUBLIC |
| POST | /destinations | ADMIN |
| PUT | /destinations/{id} | ADMIN |
| DELETE | /destinations/{id} | ADMIN, soft delete |

### TOUR PACKAGES

| Method | Route | Access |
| --- | --- | --- |
| GET | /tourpackages | PUBLIC, paginated |
| GET | /tourpackages/{id} | PUBLIC, details |
| GET | /tourpackages/slug/{slug} | PUBLIC, details |
| GET | /tourpackages/featured | PUBLIC |
| POST | /tourpackages | ADMIN |
| PUT | /tourpackages/{id} | ADMIN |
| DELETE | /tourpackages/{id} | ADMIN, soft delete |
| GET | /tourpackages/{packageId}/destinations | PUBLIC |
| POST | /tourpackages/{packageId}/destinations/{destinationId} | ADMIN |
| PUT | /tourpackages/{packageId}/destinations/{destinationId}/order | ADMIN |
| DELETE | /tourpackages/{packageId}/destinations/{destinationId} | ADMIN |

### ITINERARIES

| Method | Route | Access |
| --- | --- | --- |
| GET | /tourpackages/{packageId}/itinerary | PUBLIC |
| POST | /tourpackages/{packageId}/itinerary | ADMIN |
| PUT | /itinerary/{id} | ADMIN |
| DELETE | /itinerary/{id} | ADMIN |

### BOOKINGS

| Method | Route | Access |
| --- | --- | --- |
| POST | /bookings | CUSTOMER / ADMIN |
| GET | /bookings/my | CUSTOMER / ADMIN, own only |
| GET | /bookings/my/{id} | CUSTOMER / ADMIN, own only |
| GET | /bookings | ADMIN, paginated |
| GET | /bookings/{id} | ADMIN |
| PUT | /bookings/{id}/status | ADMIN |

### ENQUIRIES

| Method | Route | Access |
| --- | --- | --- |
| POST | /enquiries | PUBLIC |
| GET | /enquiries | ADMIN, paginated |
| GET | /enquiries/{id} | ADMIN |
| PUT | /enquiries/{id}/status | ADMIN |

### REVIEWS

| Method | Route | Access |
| --- | --- | --- |
| POST | /reviews | CUSTOMER role only |
| GET | /reviews/package/{packageId} | PUBLIC, approved only |
| GET | /reviews | ADMIN, paginated |
| PUT | /reviews/{id}/approve | ADMIN |
| DELETE | /reviews/{id} | ADMIN |

### ADMIN / MANAGEMENT

All destination/package writes, itinerary writes, destination attachments/order, all-booking/enquiry/review lists, booking/enquiry status changes and review moderation are server-side Admin protected, as marked above.

### IMAGE / MEDIA

| Method | Route | Access |
| --- | --- | --- |
| POST | /destinations/{id}/image | ADMIN, multipart |
| POST | /tourpackages/{id}/image | ADMIN, multipart |
| GET | /uploads/destinations/{generatedFilename} | PUBLIC static file, outside /api |
| GET | /uploads/packages/{generatedFilename} | PUBLIC static file, outside /api |

## Swagger and verification

Swagger remains enabled in Development with the existing Bearer input. Start from backend with dotnet run --launch-profile http, visit http://localhost:5111/swagger, log in and enter Bearer TOKEN under Authorize. For image routes, choose Try it out and select the file field. Use an Admin token for upload/management and a Customer token to verify 403.

The repeatable suite runs from the repository root:

```powershell
dotnet run --project tests/Backend.SmokeTests
```

It starts the application with ephemeral credentials, exercises PostgreSQL and real HTTP/multipart calls, and removes its own fixtures and files. It never resets the database. In its sandbox child only, Windows Event Log is disabled because that provider is not writable.

Final verification completed successfully:

- dotnet build: 0 errors (NU1900 warnings for unreachable NuGet vulnerability metadata).
- dotnet ef database update: migration applied; final check reports database up to date.
- dotnet ef migrations has-pending-model-changes: no pending changes.
- dotnet run --no-build --launch-profile http: application started on localhost:5111.
- Swagger HTML returned HTTP 200; Swagger JSON contains Bearer and multipart definitions.
- 351 smoke-test checks passed, including the Phase 2 security regressions, requested search/filter requests, paginated counts, sort orders, detail projections, unique slugs, multipart image upload/replacement/rejection, traversal-safe cleanup, CORS and safe 500 handling.
- Temporary test records and uploaded files were removed.

Swagger HTTP/specification checks and authenticated HTTP tests were automated; the graphical Authorize dialog was not manually clicked. The sandbox also logged Windows DataProtection key-access warnings during startup; JWT and endpoint tests still passed. No local secrets, connection configuration or signing keys were changed.

## Before React integration

No additional backend feature is required for the scoped development integration. React should use the paginated items envelope, ProblemDetails errors, ISO date inputs, API-origin-prefixed image URLs and Authorization: Bearer TOKEN. Keep JWT/database secrets server-side.

Create your own development Admin using the Phase 2 instructions if needed; smoke-test admins are removed. Optional galleries remain deferred. Before production, configure your actual CORS origins, HTTPS, persistent media storage/backups and a reachable dependency vulnerability audit.
