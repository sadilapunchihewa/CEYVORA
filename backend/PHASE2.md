# Ceyvora backend — Phase 2

Implemented against the existing ASP.NET Core 8 / PostgreSQL project. Existing models and both original migrations were retained. No database reset, connection change, frontend, payment, or AI implementation was performed.

## Configuration and local startup

The existing appsettings files were not edited. JWT settings are loaded through the normal ASP.NET configuration providers. The project now has a UserSecretsId so development secrets can be stored outside the repository.

From the backend directory, set a private random signing key of at least 32 bytes using user secrets or the Jwt__Key environment variable. For example, run this locally and substitute your own values (the placeholders below are not usable credentials):

```powershell
dotnet user-secrets set "Jwt:Key" "<your-private-random-signing-key>"
dotnet user-secrets set "Jwt:Issuer" "CeyvoraAPI"
dotnet user-secrets set "Jwt:Audience" "CeyvoraClient"
dotnet user-secrets set "Jwt:ExpiryMinutes" "120"
dotnet ef database update
dotnet run --launch-profile http
```

Issuer, audience and expiry already default to CeyvoraAPI, CeyvoraClient and 120 minutes. Startup fails with a configuration message if a signing key is missing or too short. No real signing key was written to source or local settings during implementation. The smoke runner uses an ephemeral key for its child process.

Development CORS permits http://localhost:5173, including the Authorization header. Production has no allowed origins by default; set Cors:AllowedOrigins using deployment configuration for your actual frontend origins. Use HTTPS for deployment.

### Initial development admin

In Development only, configure CEYVORA_ADMIN_EMAIL and CEYVORA_ADMIN_PASSWORD using environment variables or user secrets:

```powershell
dotnet user-secrets set "CEYVORA_ADMIN_EMAIL" "<your-admin-email>"
dotnet user-secrets set "CEYVORA_ADMIN_PASSWORD" "<your-private-admin-password>"
dotnet run --launch-profile http
```

The password must contain at least 8 characters, a letter and digit, and at most 72 UTF-8 bytes. The seeder hashes it with BCrypt. It creates an initial admin only if none exists, never promotes an existing customer, and never resets an existing password. Remove the seed settings after successful creation. The seeder does not run in Production, and there is no public admin-registration endpoint. Production admin provisioning must use a trusted operator process.

## Architecture and security

- User has normalized lowercase email, a unique email index, BCrypt password hash (work factor 12), profile fields, role, active flag and UTC creation time.
- AuthService owns registration, credential verification, profile projection and signed JWT creation; AuthController handles HTTP results.
- Public registration always assigns Customer. Unknown request fields such as Role or UserId cannot change server-owned values.
- PasswordHash has a serialization guard and is excluded from every API DTO.
- JWT includes subject/user ID, email, full name, role and a unique token ID. Issuer, audience, signature, HS256 algorithm and expiry are validated.
- Every authenticated request verifies that its user still exists, is active and still has the token's role. Old tokens stop working after deactivation or role changes.
- Unknown account, wrong password and inactive account login return the same 401 message. Unknown-email login still performs BCrypt verification work. Duplicate registration returns a generic 409 message.
- Authentication routes have an IP-based limit of 20 requests per minute per application instance. Configure trusted proxy handling and distributed limits separately if deploying behind a proxy or across multiple instances.
- Authorization defaults to requiring authentication; public routes are explicitly marked AllowAnonymous.
- Booking/review ownership is assigned from the validated token. Booking customer name/email and review name come from the database account.
- Legacy UserId values stay nullable. Existing unowned records remain visible to admins, but are never assigned to a customer by matching an email.
- User/history foreign keys use Restrict; package relationships to bookings, reviews and enquiries also use Restrict. The existing package-to-itinerary relationship remains intact.
- Destination/package DELETE now soft-deactivates records. Public ID/slug/list/featured reads hide inactive entries.
- Booking total amount remains null until a pricing workflow is implemented; request amounts and statuses are ignored.
- API inputs have validation for required fields, bounded strings, email/phone, positive IDs, travellers, ratings and future travel dates.
- Generic exception responses avoid exposing database or configuration details to clients.

## Endpoint access

All routes below are under /api.

| Access | Method and route |
| --- | --- |
| Public | POST auth/register, POST auth/login |
| Authenticated | GET auth/me |
| Authenticated (Customer or Admin) | POST bookings, GET bookings/my, GET bookings/my/{id} |
| Customer role | POST reviews |
| Admin | GET bookings, GET bookings/{id}, PUT bookings/{id}/status |
| Public | GET destinations, GET destinations/{id}, GET destinations/slug/{slug}, GET destinations/featured |
| Admin | POST destinations, PUT destinations/{id}, DELETE destinations/{id} |
| Public | GET tourpackages, GET tourpackages/{id}, GET tourpackages/slug/{slug}, GET tourpackages/featured |
| Admin | POST tourpackages, PUT tourpackages/{id}, DELETE tourpackages/{id} |
| Public | GET tourpackages/{packageId}/itinerary |
| Admin | POST tourpackages/{packageId}/itinerary, PUT itinerary/{id}, DELETE itinerary/{id} |
| Public | GET tourpackages/{packageId}/destinations |
| Admin | POST and DELETE tourpackages/{packageId}/destinations/{destinationId} |
| Public | POST enquiries |
| Admin | GET enquiries, GET enquiries/{id}, PUT enquiries/{id}/status |
| Public | GET reviews/package/{packageId} (approved reviews only) |
| Admin | GET reviews, PUT reviews/{id}/approve, DELETE reviews/{id} |

Booking statuses: Pending, Confirmed, Cancelled, Completed.

Enquiry statuses: New, InProgress, Resolved, Closed. Only the New model default existed before this phase; this bounded set was chosen for the newly added management endpoint.

Tour package details, itinerary and destinations have separate read endpoints. Date inputs accept ISO 8601 timestamps and are stored in UTC; booking travel dates must be later than today's UTC date.

## Swagger testing

1. Start the Development profile and open http://localhost:5111/swagger.
2. POST /api/auth/register with fullName, email, password and optional phone/country.
3. POST /api/auth/login with email/password.
4. Copy the token. Click Authorize and enter **Bearer TOKEN**, including the prefix.
5. GET /api/auth/me; POST /api/bookings with tourPackageId, phone, future travelDate, adults and children; then GET /api/bookings/my.
6. Customer tokens receive 403 for management endpoints. Anonymous protected requests receive 401. Other customers' booking IDs return 404 through the /my route.
7. Log in with the configured development admin and replace the Swagger token to test management.
8. Public enquiry submission and public tourism reads need no token.

Swagger is enabled only in Development. Its global Bearer input is also displayed on public operations; this does not make those operations protected.

## Files created

- Models/User.cs, Models/PackageDestination.cs
- DTOs/Auth/RegisterDto.cs, LoginDto.cs, AuthResponseDto.cs, UserProfileDto.cs
- DTOs/TourismDtos.cs, DTOs/DtoMappings.cs
- Validation/PasswordAttribute.cs
- Services/IAuthService.cs, AuthService.cs, JwtOptions.cs, DevelopmentAdminSeeder.cs
- Controllers/AuthController.cs, BookingsController.cs, EnquiriesController.cs, ReviewsController.cs, TourPackagesController.cs, ItineraryController.cs, PackageDestinationsController.cs
- Migrations/20260925152904_AddAuthenticationAndUsers.cs and its Designer.cs
- PHASE2.md
- ../tests/Backend.SmokeTests/Backend.SmokeTests.csproj and Program.cs

## Files modified

- Models/Booking.cs, Models/Review.cs
- Data/AppDbContext.cs
- Controllers/DestinationsController.cs
- Program.cs, backend.csproj
- Migrations/AppDbContextModelSnapshot.cs

## Packages added

- Microsoft.AspNetCore.Authentication.JwtBearer 8.0.29
- BCrypt.Net-Next 4.2.0

No other direct packages were added. Existing package versions were preserved.

## Migration and verification

Migration: **20260925152904_AddAuthenticationAndUsers**. It adds Users, nullable ownership columns, PackageDestinations, unique email index, a role constraint and Restrict history foreign keys. Both previous migrations are unchanged.

Executed successfully:

- dotnet build: zero compilation errors.
- dotnet ef database update: migration applied to the existing PostgreSQL database.
- Application startup, Swagger HTML and Swagger JSON requests.
- Live smoke suite: **208 checks passed**, covering all eight requested scenarios plus every admin route's anonymous/customer restrictions, cross-customer booking access, spoofed fields, review moderation, validation, expired/tampered tokens, disabled users, stale roles, CORS and soft-delete history preservation.
- Test fixtures were removed; no permanent test customer or admin was left behind.

Run the repeatable smoke suite from the repository root:

```powershell
dotnet run --project tests/Backend.SmokeTests
```

It starts its own backend on a temporary local port, uses the configured development database, creates uniquely named fixtures, and removes only those fixtures. It never resets the database. It disables Windows Event Log in its child process because the execution sandbox cannot write to that provider.

NuGet emitted NU1900 because the vulnerability metadata service was unreachable. Package restore and compilation succeeded; a current vulnerability audit was not completed. This folder was not a Git repository, so no Git diff, commit or ignore-rule verification was available. Existing configuration files were left untouched.
