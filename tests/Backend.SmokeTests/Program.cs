using Microsoft.Extensions.DependencyInjection;
using System.Diagnostics;
using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Net.Sockets;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

// Run from the repository root. This uses the configured database, never resets it,
// and removes only the uniquely named records created by this run.
var backendPath = Path.GetFullPath(args.FirstOrDefault() ?? "backend");
var configuration = new ConfigurationBuilder().SetBasePath(backendPath)
    .AddJsonFile("appsettings.json").AddJsonFile("appsettings.Development.json", optional: true)
    .AddUserSecrets<backend.Services.AuthService>(optional: true).AddEnvironmentVariables().Build();
await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
    .UseNpgsql(configuration.GetConnectionString("DefaultConnection")).Options);
var runId = Guid.NewGuid().ToString("N");
var adminEmail = $"smoke-admin-{runId}@example.invalid";
var email1 = $"smoke-one-{runId}@example.invalid";
var email2 = $"smoke-two-{runId}@example.invalid";
var seedEmail = $"smoke-seed-{runId}@example.invalid";
var emails = new[] { adminEmail, email1, email2, seedEmail };
var password = "Smoke9!" + Convert.ToHexString(RandomNumberGenerator.GetBytes(16));
var key = Convert.ToBase64String(RandomNumberGenerator.GetBytes(48));
var packageIds = new List<int>();
var destinationIds = new List<int>();
var enquiryIds = new List<int>();
var uploadedUrls = new List<string>();
var sentinelFiles = new List<string>();
var listener = new TcpListener(IPAddress.Loopback, 0);
listener.Start();
var port = ((IPEndPoint)listener.LocalEndpoint).Port;
listener.Stop();
var start = new ProcessStartInfo("dotnet")
{
    WorkingDirectory = backendPath,
    UseShellExecute = false, CreateNoWindow = true,
    RedirectStandardOutput = true, RedirectStandardError = true
};
start.ArgumentList.Add(Path.Combine(backendPath, "bin", "Debug", "net8.0", "backend.dll"));
start.Environment["ASPNETCORE_ENVIRONMENT"] = "Development";
start.Environment["ASPNETCORE_URLS"] = $"http://127.0.0.1:{port}";
start.Environment["Jwt__Key"] = key;
start.Environment["Jwt__Issuer"] = "CeyvoraAPI";
start.Environment["Jwt__Audience"] = "CeyvoraClient";
start.Environment["Jwt__ExpiryMinutes"] = "120";
start.Environment["CEYVORA_ADMIN_EMAIL"] = seedEmail;
start.Environment["CEYVORA_ADMIN_PASSWORD"] = password;
start.Environment["Logging__LogLevel__Default"] = "Warning";
start.Environment["Logging__EventLog__LogLevel__Default"] = "None";
Process? app = null;
Task<string>? appOutput = null;
Task<string>? appError = null;
var checks = 0;
void Check(bool condition, string description)
{
    if (!condition) throw new InvalidOperationException("FAIL: " + description);
    checks++;
    Console.WriteLine("PASS: " + description);
}
using var http = new HttpClient { BaseAddress = new Uri($"http://127.0.0.1:{port}"), Timeout = TimeSpan.FromSeconds(15) };
async Task<JsonElement> Request(string method, string path, HttpStatusCode expected, object? body = null, string? token = null)
{
    using var request = new HttpRequestMessage(new HttpMethod(method), path);
    if (body != null) request.Content = JsonContent.Create(body);
    if (token != null) request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
    using var response = await http.SendAsync(request);
    Check(response.StatusCode == expected, $"{method} {path} -> {(int)expected}");
    var text = await response.Content.ReadAsStringAsync();
    Check(!text.Contains("passwordHash", StringComparison.OrdinalIgnoreCase) && !text.Contains(key),
        "Response excludes password hash and signing key");
    if (string.IsNullOrWhiteSpace(text)) return default;
    return JsonDocument.Parse(text).RootElement.Clone();
}

async Task<string?> Upload(string path, byte[] bytes, string filename, string mime, HttpStatusCode expected, string? token = null)
{
    using var form = new MultipartFormDataContent();
    using var content = new ByteArrayContent(bytes);
    content.Headers.ContentType = new MediaTypeHeaderValue(mime);
    form.Add(content, "file", filename);
    using var request = new HttpRequestMessage(HttpMethod.Post, path) { Content = form };
    if (token != null) request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
    using var response = await http.SendAsync(request);
    Check(response.StatusCode == expected, $"Upload {filename} -> {(int)expected}");
    var body = await response.Content.ReadAsStringAsync();
    Check(!body.Contains("StackTrace", StringComparison.OrdinalIgnoreCase) && !body.Contains(key), "Upload response exposes no internals");
    if (!response.IsSuccessStatusCode) return null;
    var url = JsonDocument.Parse(body).RootElement.GetProperty("imageUrl").GetString()!;
    uploadedUrls.Add(url);
    return url;
}

try
{
    var hadAdmin = await db.Users.AnyAsync(u => u.Role == Roles.Admin);
    app = Process.Start(start) ?? throw new InvalidOperationException("Unable to start backend.");
    // Drain logs without printing any configuration or credentials.
    appOutput = app.StandardOutput.ReadToEndAsync();
    appError = app.StandardError.ReadToEndAsync();
    var ready = false;
    for (var attempt = 0; attempt < 60; attempt++)
    {
        if (app.HasExited) throw new InvalidOperationException("Backend exited before readiness.");
        try
        {
            using var response = await http.GetAsync("/swagger/index.html");
            if (response.IsSuccessStatusCode) { ready = true; break; }
        }
        catch (HttpRequestException) { }
        await Task.Delay(250);
    }
    Check(ready, "Application starts and Swagger UI loads");
    var swagger = await Request("GET", "/swagger/v1/swagger.json", HttpStatusCode.OK);
    Check(swagger.GetProperty("components").GetProperty("securitySchemes").TryGetProperty("Bearer", out _),
        "Swagger exposes Bearer authorization");
    Check(hadAdmin || await db.Users.AnyAsync(u => u.Email == seedEmail && u.Role == Roles.Admin),
        "Development seeder creates initial admin when no admin exists");
    var admin = new User { FullName = "Smoke Admin", Email = adminEmail,
        PasswordHash = BCrypt.Net.BCrypt.HashPassword(password, workFactor: 12), Role = Roles.Admin };
    db.Users.Add(admin);
    await db.SaveChangesAsync();

    var registration = new { fullName = "Smoke Customer One", email = email1.ToUpperInvariant(),
        password, phone = "+94770000000", country = "Sri Lanka", role = "Admin", userId = admin.Id };
    var first = await Request("POST", "/api/auth/register", HttpStatusCode.Created, registration);
    var firstId = first.GetProperty("userId").GetInt32();
    Check(first.GetProperty("role").GetString() == Roles.Customer, "Public registration cannot assign Admin");
    Check(first.GetProperty("email").GetString() == email1, "Email is normalized");
    var stored = await db.Users.AsNoTracking().SingleAsync(u => u.Id == firstId);
    Check(stored.PasswordHash != password && BCrypt.Net.BCrypt.Verify(password, stored.PasswordHash),
        "PostgreSQL stores a verified BCrypt hash");
    await Request("POST", "/api/auth/register", HttpStatusCode.Conflict, registration);
    await Request("POST", "/api/auth/register", HttpStatusCode.BadRequest,
        new { fullName = "Invalid", email = "invalid", password = "short" });
    await Request("POST", "/api/auth/login", HttpStatusCode.Unauthorized,
        new { email = email1, password = "Wrong12345" });
    await Request("POST", "/api/auth/login", HttpStatusCode.Unauthorized,
        new { email = $"missing-{runId}@example.invalid", password });
    var login = await Request("POST", "/api/auth/login", HttpStatusCode.OK, new { email = email1, password });
    var token1 = login.GetProperty("token").GetString()!;
    var second = await Request("POST", "/api/auth/register", HttpStatusCode.Created,
        new { fullName = "Smoke Customer Two", email = email2, password });
    var token2 = second.GetProperty("token").GetString()!;
    var secondId = second.GetProperty("userId").GetInt32();
    var adminLogin = await Request("POST", "/api/auth/login", HttpStatusCode.OK, new { email = adminEmail, password });
    var adminToken = adminLogin.GetProperty("token").GetString()!;
    var me = await Request("GET", "/api/auth/me", HttpStatusCode.OK, token: token1);
    Check(me.GetProperty("userId").GetInt32() == firstId, "Profile matches authenticated customer");
    await Request("GET", "/api/auth/me", HttpStatusCode.Unauthorized);
    await Request("GET", "/api/auth/me", HttpStatusCode.Unauthorized, token: token1 + "tampered");
    var expired = new JwtSecurityToken("CeyvoraAPI", "CeyvoraClient",
        new[] { new Claim("sub", firstId.ToString()), new Claim("role", "Customer") },
        DateTime.UtcNow.AddHours(-2), DateTime.UtcNow.AddHours(-1),
        new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)), SecurityAlgorithms.HmacSha256));
    await Request("GET", "/api/auth/me", HttpStatusCode.Unauthorized,
        token: new JwtSecurityTokenHandler().WriteToken(expired));

    var destinationBody = new { name = "Smoke Destination", slug = "smoke-" + runId,
        shortDescription = "Test destination", description = "Temporary integration test", isFeatured = true };
    await Request("POST", "/api/destinations", HttpStatusCode.Unauthorized, destinationBody);
    await Request("POST", "/api/destinations", HttpStatusCode.Forbidden, destinationBody, token1);
    var destination = await Request("POST", "/api/destinations", HttpStatusCode.Created, destinationBody, adminToken);
    var destinationId = destination.GetProperty("id").GetInt32();
    destinationIds.Add(destinationId);
    await Request("GET", $"/api/destinations/{destinationId}", HttpStatusCode.OK);
    await Request("GET", "/api/destinations/slug/smoke-" + runId, HttpStatusCode.OK);
    await Request("GET", "/api/destinations/featured", HttpStatusCode.OK);
    var package = await Request("POST", "/api/tourpackages", HttpStatusCode.Created,
        new { title = "Smoke Package", slug = "smoke-" + runId, shortDescription = "Test",
            description = "Temporary integration test", durationDays = 3, durationNights = 2,
            startingPrice = 100, currency = "USD" }, adminToken);
    var packageId = package.GetProperty("id").GetInt32();
    packageIds.Add(packageId);
    await Request("GET", $"/api/tourpackages/{packageId}", HttpStatusCode.OK);
    await Request("POST", $"/api/tourpackages/{packageId}/destinations/{destinationId}", HttpStatusCode.NoContent, token: adminToken);
    await Request("GET", $"/api/tourpackages/{packageId}/destinations", HttpStatusCode.OK);
    var itinerary = await Request("POST", $"/api/tourpackages/{packageId}/itinerary", HttpStatusCode.Created,
        new { dayNumber = 1, title = "Arrival", description = "Test arrival" }, adminToken);
    var itineraryId = itinerary.GetProperty("id").GetInt32();
    await Request("GET", $"/api/tourpackages/{packageId}/itinerary", HttpStatusCode.OK);

    var enquiry = await Request("POST", "/api/enquiries", HttpStatusCode.Created,
        new { tourPackageId = packageId, name = "Smoke Visitor", email = email1, phone = "+94770000000",
            numberOfTravellers = 2, message = "Test public enquiry" });
    var enquiryId = enquiry.GetProperty("id").GetInt32();
    enquiryIds.Add(enquiryId);
    await Request("POST", "/api/enquiries", HttpStatusCode.BadRequest,
        new { name = "", email = "invalid", numberOfTravellers = 0 });
    var bookingBody = new { tourPackageId = packageId, travelDate = DateTimeOffset.UtcNow.AddDays(7),
        adults = 2, children = 0, phone = "+94770000000", userId = secondId,
        customerName = "Spoofed", email = email2, status = "Confirmed", totalAmount = 1 };
    await Request("POST", "/api/bookings", HttpStatusCode.Unauthorized, bookingBody);
    var booking = await Request("POST", "/api/bookings", HttpStatusCode.Created, bookingBody, token1);
    var bookingId = booking.GetProperty("id").GetInt32();
    Check(booking.GetProperty("userId").GetInt32() == firstId, "Booking ignores client UserId");
    Check(booking.GetProperty("customerName").GetString() == "Smoke Customer One"
        && booking.GetProperty("status").GetString() == "Pending"
        && booking.GetProperty("totalAmount").ValueKind == JsonValueKind.Null,
        "Booking identity, status and price cannot be spoofed");
    var mine = await Request("GET", "/api/bookings/my", HttpStatusCode.OK, token: token1);
    Check(mine.EnumerateArray().All(b => b.GetProperty("userId").GetInt32() == firstId), "Only own bookings are listed");
    var others = await Request("GET", "/api/bookings/my", HttpStatusCode.OK, token: token2);
    Check(others.GetArrayLength() == 0, "Other customer cannot list first customer's booking");
    await Request("GET", $"/api/bookings/my/{bookingId}", HttpStatusCode.OK, token: token1);
    await Request("GET", $"/api/bookings/my/{bookingId}", HttpStatusCode.NotFound, token: token2);
    await Request("POST", "/api/bookings", HttpStatusCode.BadRequest,
        new { tourPackageId = packageId, adults = 0, children = -1, travelDate = DateTimeOffset.UtcNow.AddDays(-1),
            phone = "+94770000000" }, token1);
    await Request("PUT", $"/api/bookings/{bookingId}/status", HttpStatusCode.BadRequest, new { status = "Paid" }, adminToken);
    await Request("PUT", $"/api/bookings/{bookingId}/status", HttpStatusCode.NoContent, new { status = "Confirmed" }, adminToken);

    var review = await Request("POST", "/api/reviews", HttpStatusCode.Created,
        new { tourPackageId = packageId, rating = 5, comment = "Integration test review",
            userId = secondId, customerName = "Spoofed", isApproved = true }, token1);
    var reviewId = review.GetProperty("id").GetInt32();
    Check(review.GetProperty("customerName").GetString() == "Smoke Customer One" &&
        !review.GetProperty("isApproved").GetBoolean(), "Review name and moderation state cannot be spoofed");
    Check(await db.Reviews.AnyAsync(r => r.Id == reviewId && r.UserId == firstId), "Review owner comes from token");
    var pending = await Request("GET", $"/api/reviews/package/{packageId}", HttpStatusCode.OK);
    Check(pending.GetArrayLength() == 0, "Unapproved reviews are hidden publicly");
    await Request("PUT", $"/api/reviews/{reviewId}/approve", HttpStatusCode.NoContent, token: adminToken);
    var approved = await Request("GET", $"/api/reviews/package/{packageId}", HttpStatusCode.OK);
    Check(approved.GetArrayLength() == 1, "Approved review is public");
    await Request("POST", "/api/reviews", HttpStatusCode.Unauthorized, new { });
    await Request("POST", "/api/reviews", HttpStatusCode.Forbidden, new { }, adminToken);
    await Request("POST", "/api/reviews", HttpStatusCode.BadRequest,
        new { tourPackageId = packageId, rating = 6, comment = "Invalid rating" }, token1);

    // Exercise every admin route as both anonymous and Customer.
    var adminRoutes = new (string Method, string Path)[]
    {
        ("POST", "/api/destinations"), ("PUT", $"/api/destinations/{destinationId}"),
        ("DELETE", $"/api/destinations/{destinationId}"), ("POST", "/api/tourpackages"),
        ("PUT", $"/api/tourpackages/{packageId}"), ("DELETE", $"/api/tourpackages/{packageId}"),
        ("POST", $"/api/tourpackages/{packageId}/itinerary"), ("PUT", $"/api/itinerary/{itineraryId}"),
        ("DELETE", $"/api/itinerary/{itineraryId}"),
        ("POST", $"/api/tourpackages/{packageId}/destinations/{destinationId}"),
        ("DELETE", $"/api/tourpackages/{packageId}/destinations/{destinationId}"),
        ("GET", "/api/bookings"), ("GET", $"/api/bookings/{bookingId}"),
        ("PUT", $"/api/bookings/{bookingId}/status"), ("GET", "/api/enquiries"),
        ("GET", $"/api/enquiries/{enquiryId}"), ("PUT", $"/api/enquiries/{enquiryId}/status"),
        ("GET", "/api/reviews"), ("PUT", $"/api/reviews/{reviewId}/approve"),
        ("DELETE", $"/api/reviews/{reviewId}")
    };
    foreach (var (method, path) in adminRoutes)
    {
        await Request(method, path, HttpStatusCode.Unauthorized, new { });
        await Request(method, path, HttpStatusCode.Forbidden, new { }, token1);
    }
    await Request("GET", "/api/bookings", HttpStatusCode.OK, token: adminToken);
    await Request("GET", $"/api/bookings/{bookingId}", HttpStatusCode.OK, token: adminToken);
    await Request("GET", "/api/enquiries", HttpStatusCode.OK, token: adminToken);
    await Request("GET", $"/api/enquiries/{enquiryId}", HttpStatusCode.OK, token: adminToken);
    await Request("GET", "/api/reviews", HttpStatusCode.OK, token: adminToken);
    await db.Users.Where(u => u.Id == firstId).ExecuteUpdateAsync(s => s.SetProperty(u => u.IsActive, false));
    await Request("GET", "/api/auth/me", HttpStatusCode.Unauthorized, token: token1);
    await Request("POST", "/api/auth/login", HttpStatusCode.Unauthorized, new { email = email1, password });
    await db.Users.Where(u => u.Id == firstId).ExecuteUpdateAsync(s => s.SetProperty(u => u.IsActive, true));
    await db.Users.Where(u => u.Id == admin.Id).ExecuteUpdateAsync(s => s.SetProperty(u => u.Role, Roles.Customer));
    await Request("GET", "/api/bookings", HttpStatusCode.Unauthorized, token: adminToken);
    await db.Users.Where(u => u.Id == admin.Id).ExecuteUpdateAsync(s => s.SetProperty(u => u.Role, Roles.Admin));
    using (var corsRequest = new HttpRequestMessage(HttpMethod.Options, "/api/bookings"))
    {
        corsRequest.Headers.Add("Origin", "http://localhost:5173");
        corsRequest.Headers.Add("Access-Control-Request-Method", "POST");
        corsRequest.Headers.Add("Access-Control-Request-Headers", "authorization,content-type");
        using var cors = await http.SendAsync(corsRequest);
        Check(cors.Headers.TryGetValues("Access-Control-Allow-Origin", out var origins)
            && origins.Contains("http://localhost:5173"), "React Authorization preflight is allowed");
    }
    using (var corsRequest = new HttpRequestMessage(HttpMethod.Options, "/api/bookings"))
    {
        corsRequest.Headers.Add("Origin", "https://untrusted.example");
        corsRequest.Headers.Add("Access-Control-Request-Method", "POST");
        using var cors = await http.SendAsync(corsRequest);
        Check(!cors.Headers.Contains("Access-Control-Allow-Origin"), "Unconfigured CORS origin is denied");
    }

    // Exercise the central 500 response without adding a public crash endpoint.
    var errorContext = new Microsoft.AspNetCore.Http.DefaultHttpContext();
    await using var errorBody = new MemoryStream();
    errorContext.Response.Body = errorBody;
    errorContext.RequestServices = new Microsoft.Extensions.DependencyInjection.ServiceCollection().BuildServiceProvider();
    var handler = new backend.Services.ApiExceptionHandler(
        Microsoft.Extensions.Logging.Abstractions.NullLogger<backend.Services.ApiExceptionHandler>.Instance);
    await handler.TryHandleAsync(errorContext, new InvalidOperationException("private-database-details"),
        CancellationToken.None);
    errorBody.Position = 0;
    var safeError = await new StreamReader(errorBody).ReadToEndAsync();
    Check(errorContext.Response.StatusCode == 500 && !safeError.Contains("private-database-details") &&
        safeError.Contains("An unexpected error occurred."), "Global 500 handler conceals exception details");

    // Phase 3: database-side queries and frontend DTOs.
    var page = await Request("GET", "/api/destinations?page=1&pageSize=5", HttpStatusCode.OK);
    Check(page.GetProperty("pageSize").GetInt32() == 5 && page.GetProperty("items").GetArrayLength() <= 5,
        "Destination paging envelope is bounded");
    await Request("GET", "/api/destinations?search=ella", HttpStatusCode.OK);
    await Request("GET", "/api/tourpackages?page=1&pageSize=5", HttpStatusCode.OK);
    await Request("GET", "/api/tourpackages?minPrice=100&maxPrice=2000", HttpStatusCode.OK);
    await Request("GET", "/api/tourpackages?sort=price_asc", HttpStatusCode.OK);
    await Request("GET", "/api/destinations?page=0", HttpStatusCode.BadRequest);
    await Request("GET", "/api/destinations?pageSize=51", HttpStatusCode.BadRequest);
    await Request("GET", "/api/tourpackages?minPrice=300&maxPrice=100", HttpStatusCode.BadRequest);
    await Request("GET", "/api/tourpackages?minDays=10&maxDays=2", HttpStatusCode.BadRequest);
    await Request("GET", "/api/tourpackages?sort=DROP%20TABLE", HttpStatusCode.BadRequest);
    var emptyPage = await Request("GET", "/api/destinations?page=1000000&pageSize=50", HttpStatusCode.OK);
    Check(emptyPage.GetProperty("items").GetArrayLength() == 0, "Out-of-range page returns an empty list");

    var marker = "filter-" + runId;
    var destinations = new[]
    {
        new Destination { Name = marker + " Ella", Slug = marker + "-ella", Province = "Central Province",
            District = "Kandy", ShortDescription = "Hill country", Description = "Test", IsFeatured = true },
        new Destination { Name = marker + " Coast", Slug = marker + "-coast", Province = "Southern",
            District = "Galle", ShortDescription = "Coastal", Description = "Test" },
        new Destination { Name = marker + " Hidden", Slug = marker + "-hidden", IsActive = false }
    };
    db.Destinations.AddRange(destinations);
    var packages = new[]
    {
        new TourPackage { Title = marker + " Budget", Slug = marker + "-budget", StartingPrice = 150, DurationDays = 2, DurationNights = 1 },
        new TourPackage { Title = marker + " Premium", Slug = marker + "-premium", StartingPrice = 900, DurationDays = 8, DurationNights = 7, IsFeatured = true },
        new TourPackage { Title = marker + " Hidden", Slug = marker + "-hidden", StartingPrice = 100, DurationDays = 1, IsActive = false }
    };
    db.TourPackages.AddRange(packages);
    await db.SaveChangesAsync();
    destinationIds.AddRange(destinations.Select(d => d.Id));
    packageIds.AddRange(packages.Select(p => p.Id));
    await Request("POST", $"/api/tourpackages/{packageId}/destinations/{destinations[0].Id}?visitOrder=5",
        HttpStatusCode.NoContent, token: adminToken);
    await Request("PUT", $"/api/tourpackages/{packageId}/destinations/{destinationId}/order",
        HttpStatusCode.NoContent, new { visitOrder = 10 }, adminToken);
    await Request("PUT", $"/api/tourpackages/{packageId}/destinations/{destinationId}/order",
        HttpStatusCode.Forbidden, new { visitOrder = 0 }, token1);
    db.PackageDestinations.Add(new PackageDestination { TourPackageId = packages[1].Id, DestinationId = destinations[0].Id });
    await db.SaveChangesAsync();
    var filtered = await Request("GET", $"/api/destinations?search={marker.ToUpperInvariant()}&province=central%20province&district=kandy&featured=true",
        HttpStatusCode.OK);
    Check(filtered.GetProperty("totalItems").GetInt32() == 1 &&
        filtered.GetProperty("items")[0].GetProperty("id").GetInt32() == destinations[0].Id,
        "Destination search, province, district and featured combine case-insensitively");
    var firstPage = await Request("GET", $"/api/destinations?search={marker}&pageSize=1", HttpStatusCode.OK);
    var nextPage = await Request("GET", $"/api/destinations?search={marker}&page=2&pageSize=1", HttpStatusCode.OK);
    Check(firstPage.GetProperty("totalItems").GetInt32() == 2 && firstPage.GetProperty("totalPages").GetInt32() == 2 &&
        firstPage.GetProperty("items")[0].GetProperty("id").GetInt32() != nextPage.GetProperty("items")[0].GetProperty("id").GetInt32(),
        "Pagination is stable and excludes inactive destinations");
    foreach (var sort in new[] { "price_asc", "price_desc", "duration_asc", "duration_desc", "newest" })
    {
        var sorted = await Request("GET", $"/api/tourpackages?search={marker}&sort={sort}", HttpStatusCode.OK);
        Check(sorted.GetProperty("totalItems").GetInt32() == 2, "Package list excludes inactive records");
        var expectedId = sort.EndsWith("_asc") ? packages[0].Id : packages[1].Id;
        Check(sorted.GetProperty("items")[0].GetProperty("id").GetInt32() == expectedId, "Correct predefined sorting: " + sort);
    }
    var packageFilter = await Request("GET",
        $"/api/tourpackages?search={marker}&minPrice=500&maxPrice=1000&minDays=5&maxDays=10&destinationId={destinations[0].Id}&featured=true",
        HttpStatusCode.OK);
    Check(packageFilter.GetProperty("totalItems").GetInt32() == 1 &&
        packageFilter.GetProperty("items")[0].GetProperty("id").GetInt32() == packages[1].Id,
        "Package price, duration, destination and featured filters combine");
    var literal = await Request("GET", $"/api/tourpackages?search={marker}%25", HttpStatusCode.OK);
    Check(literal.GetProperty("totalItems").GetInt32() == 0, "Search percent sign is literal, not an SQL wildcard");
    await Request("GET", "/api/destinations?search=%27%3B%20DROP%20TABLE%20Users%3B--", HttpStatusCode.OK);

    var details = await Request("GET", $"/api/tourpackages/{packageId}", HttpStatusCode.OK);
    Check(details.GetProperty("destinations")[0].GetProperty("id").GetInt32() == destinations[0].Id,
        "Package details order destinations by VisitOrder");
    Check(details.GetProperty("itineraryDays")[0].GetProperty("id").GetInt32() == itineraryId &&
        details.GetProperty("approvedReviews").GetArrayLength() == 1, "Package details include itinerary and approved reviews");
    var hiddenReview = new Review { TourPackageId = packageId, UserId = firstId, CustomerName = "Hidden",
        Rating = 3, Comment = "Hidden review", IsApproved = false };
    db.Reviews.Add(hiddenReview);
    await db.SaveChangesAsync();
    details = await Request("GET", "/api/tourpackages/slug/smoke-" + runId, HttpStatusCode.OK);
    Check(details.GetProperty("approvedReviews").GetArrayLength() == 1, "Details do not expose unapproved reviews");
    var destinationDetails = await Request("GET", "/api/destinations/slug/" + destinations[0].Slug, HttpStatusCode.OK);
    Check(destinationDetails.GetProperty("tourPackages").GetArrayLength() == 2, "Destination details include related active packages");

    var normalized = await Request("POST", "/api/destinations", HttpStatusCode.Created,
        new { name = "Normalized", slug = "  NORMALIZED-" + runId.ToUpperInvariant() + "  ", shortDescription = "Test", description = "Test" }, adminToken);
    destinationIds.Add(normalized.GetProperty("id").GetInt32());
    Check(normalized.GetProperty("slug").GetString() == "normalized-" + runId, "Slugs trim and lowercase");
    await Request("POST", "/api/destinations", HttpStatusCode.Conflict,
        new { name = "Duplicate", slug = "NORMALIZED-" + runId.ToUpperInvariant(), shortDescription = "Test", description = "Test" }, adminToken);
    var generated = await Request("POST", "/api/tourpackages", HttpStatusCode.Created,
        new { title = "Beautiful Sri Lanka " + runId, shortDescription = "Test", description = "Test",
            durationDays = 2, durationNights = 1, startingPrice = 250 }, adminToken);
    packageIds.Add(generated.GetProperty("id").GetInt32());
    Check(generated.GetProperty("slug").GetString() == "beautiful-sri-lanka-" + runId, "Missing slug is generated from title");
    await Request("POST", "/api/tourpackages", HttpStatusCode.Conflict,
        new { title = "Beautiful Sri Lanka " + runId, shortDescription = "Test", description = "Test",
            durationDays = 2, durationNights = 1, startingPrice = 250 }, adminToken);
    var duplicateEntity = new Destination { Name = "Duplicate", Slug = destinations[0].Slug };
    db.Destinations.Add(duplicateEntity);
    var uniqueProtected = false;
    try { await db.SaveChangesAsync(); }
    catch (DbUpdateException ex) when (ex.InnerException is Npgsql.PostgresException { SqlState: "23505" })
    { uniqueProtected = true; db.Entry(duplicateEntity).State = EntityState.Detached; }
    Check(uniqueProtected, "Database unique slug index prevents concurrent duplicates");

    var bookingFilter = await Request("GET", $"/api/bookings?search={email1}&status=Confirmed&fromDate={DateTime.UtcNow:yyyy-MM-dd}&toDate={DateTime.UtcNow.AddDays(30):yyyy-MM-dd}&pageSize=5",
        HttpStatusCode.OK, token: adminToken);
    Check(bookingFilter.GetProperty("totalItems").GetInt32() == 1, "Admin booking search/status/travel-date filtering");
    var enquiryFilter = await Request("GET", $"/api/enquiries?search={email1}&status=New&pageSize=5", HttpStatusCode.OK, token: adminToken);
    Check(enquiryFilter.GetProperty("totalItems").GetInt32() == 1, "Admin enquiry search and status filtering");
    var reviewFilter = await Request("GET", $"/api/reviews?approved=false&rating=3&packageId={packageId}", HttpStatusCode.OK, token: adminToken);
    Check(reviewFilter.GetProperty("totalItems").GetInt32() == 1, "Admin review approval/rating/package filtering");
    await Request("GET", "/api/bookings?fromDate=2028-01-01&toDate=2027-01-01", HttpStatusCode.BadRequest, token: adminToken);
    await Request("GET", "/api/reviews?rating=6", HttpStatusCode.BadRequest, token: adminToken);

    // Multipart uploads and static media delivery, using an actual one-pixel PNG.
    var png = Convert.FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=");
    Check(swagger.GetProperty("paths").GetProperty("/api/destinations/{id}/image").GetProperty("post")
        .GetProperty("requestBody").GetProperty("content").TryGetProperty("multipart/form-data", out _),
        "Swagger describes multipart image upload");
    await Upload($"/api/destinations/{destinationId}/image", png, "test.png", "image/png", HttpStatusCode.Unauthorized);
    await Upload($"/api/destinations/{destinationId}/image", png, "test.png", "image/png", HttpStatusCode.Forbidden, token1);
    await Upload($"/api/tourpackages/{packageId}/image", png, "test.png", "image/png", HttpStatusCode.Forbidden, token1);
    await Upload("/api/destinations/2147483647/image", png, "test.png", "image/png", HttpStatusCode.NotFound, adminToken);
    await Upload($"/api/destinations/{destinationId}/image", Encoding.UTF8.GetBytes("<svg></svg>"), "bad.svg", "image/svg+xml", HttpStatusCode.BadRequest, adminToken);
    await Upload($"/api/destinations/{destinationId}/image", Encoding.UTF8.GetBytes("Not an image"), "bad.png", "image/png", HttpStatusCode.BadRequest, adminToken);
    await Upload($"/api/destinations/{destinationId}/image", png, "bad.png", "text/plain", HttpStatusCode.BadRequest, adminToken);
    await Upload($"/api/destinations/{destinationId}/image", Array.Empty<byte>(), "empty.png", "image/png", HttpStatusCode.BadRequest, adminToken);
    await Upload($"/api/destinations/{destinationId}/image", new byte[5 * 1024 * 1024 + 1], "large.png", "image/png", HttpStatusCode.BadRequest, adminToken);
    var image1 = await Upload($"/api/destinations/{destinationId}/image", png, "../../outside.png", "image/png", HttpStatusCode.OK, adminToken);
    Check(System.Text.RegularExpressions.Regex.IsMatch(image1!, "^/uploads/destinations/[a-f0-9]{32}\\.png$"),
        "Storage filename is a generated GUID despite traversal in original filename");
    using (var imageResponse = await http.GetAsync(image1))
    {
        Check(imageResponse.IsSuccessStatusCode && imageResponse.Content.Headers.ContentType?.MediaType == "image/png",
            "Uploaded image is served publicly with correct content type");
        Check((await imageResponse.Content.ReadAsByteArrayAsync()).SequenceEqual(png), "Stored bytes match uploaded image");
        Check(imageResponse.Headers.GetValues("X-Content-Type-Options").Contains("nosniff"), "Static image disables MIME sniffing");
    }
    var image2 = await Upload($"/api/destinations/{destinationId}/image", png, "replacement.png", "image/png", HttpStatusCode.OK, adminToken);
    Check(image1 != image2 && !File.Exists(Path.Combine(backendPath, "wwwroot", image1!.TrimStart('/'))),
        "Replacing image removes old application-owned file");
    var hero = await Upload($"/api/tourpackages/{packageId}/image", png, "hero.png", "image/png", HttpStatusCode.OK, adminToken);
    var heroDetails = await Request("GET", $"/api/tourpackages/{packageId}", HttpStatusCode.OK);
    Check(heroDetails.GetProperty("heroImageUrl").GetString() == hero, "Package hero URL persists in PostgreSQL");
    await Request("PUT", $"/api/destinations/{destinationId}", HttpStatusCode.NoContent,
        new { name = "Smoke Destination", shortDescription = "Updated", description = "Updated", imageUrl = image2 }, adminToken);
    Check(File.Exists(Path.Combine(backendPath, "wwwroot", image2!.TrimStart('/'))), "DTO accepts valid relative upload URL");

    // A fake old URL outside uploads must never be deleted.
    var sentinelPath = Path.Combine(backendPath, "wwwroot", "sentinel-" + runId + ".txt");
    await File.WriteAllTextAsync(sentinelPath, "test-owned sentinel");
    sentinelFiles.Add(sentinelPath);
    await db.Destinations.Where(d => d.Id == destinationId)
        .ExecuteUpdateAsync(s => s.SetProperty(d => d.ImageUrl, "/uploads/destinations/../../sentinel-" + runId + ".txt"));
    await Upload($"/api/destinations/{destinationId}/image", png, "safe.png", "image/png", HttpStatusCode.OK, adminToken);
    Check(File.Exists(sentinelPath), "Replacement refuses deletion outside application upload namespace");

    var missingProblem = await Request("GET", "/api/destinations/2147483647", HttpStatusCode.NotFound);
    Check(missingProblem.GetProperty("status").GetInt32() == 404 && missingProblem.TryGetProperty("traceId", out _),
        "Errors use ProblemDetails with a trace ID");

    await Request("DELETE", $"/api/destinations/{destinationId}", HttpStatusCode.NoContent, token: adminToken);
    await Request("GET", $"/api/destinations/{destinationId}", HttpStatusCode.NotFound);
    await Request("DELETE", $"/api/tourpackages/{packageId}", HttpStatusCode.NoContent, token: adminToken);
    await Request("GET", $"/api/tourpackages/{packageId}", HttpStatusCode.NotFound);
    Check(await db.Bookings.AnyAsync(b => b.Id == bookingId), "Soft deletion preserves booking history");
    Console.WriteLine($"SUCCESS: {checks} checks passed.");
}
catch (Exception ex)
{
    Console.Error.WriteLine(ex.Message);
    Environment.ExitCode = 1;
}
finally
{
    if (app is { HasExited: false }) { app.Kill(entireProcessTree: true); await app.WaitForExitAsync(); }
    if (checks < 6 && appError != null)
    {
        var diagnostic = await appError + (appOutput == null ? "" : await appOutput);
        diagnostic = diagnostic.Replace(key, "[redacted]").Replace(password, "[redacted]");
        var connection = configuration.GetConnectionString("DefaultConnection");
        if (!string.IsNullOrEmpty(connection)) diagnostic = diagnostic.Replace(connection, "[redacted]");
        Console.WriteLine(diagnostic.Length > 6000 ? diagnostic[^6000..] : diagnostic);
    }
    app?.Dispose();
    // Only delete fixtures owned by this run; no existing data or migrations are removed.
    await using var cleanup = await db.Database.BeginTransactionAsync();
    var userIds = await db.Users.Where(u => emails.Contains(u.Email)).Select(u => u.Id).ToListAsync();
    await db.PackageDestinations.Where(p => packageIds.Contains(p.TourPackageId)).ExecuteDeleteAsync();
    await db.ItineraryDays.Where(i => packageIds.Contains(i.TourPackageId)).ExecuteDeleteAsync();
    await db.Reviews.Where(r => r.UserId.HasValue && userIds.Contains(r.UserId.Value)).ExecuteDeleteAsync();
    await db.Bookings.Where(b => b.UserId.HasValue && userIds.Contains(b.UserId.Value)).ExecuteDeleteAsync();
    await db.Enquiries.Where(e => enquiryIds.Contains(e.Id) || e.Email == email1).ExecuteDeleteAsync();
    await db.TourPackages.Where(p => packageIds.Contains(p.Id) || p.Slug == "smoke-" + runId).ExecuteDeleteAsync();
    await db.Destinations.Where(d => destinationIds.Contains(d.Id) || d.Slug == "smoke-" + runId).ExecuteDeleteAsync();
    await db.Users.Where(u => emails.Contains(u.Email)).ExecuteDeleteAsync();
    await cleanup.CommitAsync();
    foreach (var url in uploadedUrls)
    {
        var mediaPath = Path.GetFullPath(Path.Combine(backendPath, "wwwroot", url.TrimStart('/')));
        var uploadRoot = Path.GetFullPath(Path.Combine(backendPath, "wwwroot", "uploads")) + Path.DirectorySeparatorChar;
        if (!mediaPath.StartsWith(uploadRoot, StringComparison.OrdinalIgnoreCase)) throw new InvalidOperationException("Unsafe cleanup path.");
        File.Delete(mediaPath);
    }
    foreach (var sentinel in sentinelFiles) File.Delete(sentinel);
    Console.WriteLine("Temporary smoke-test records and media removed.");
}
