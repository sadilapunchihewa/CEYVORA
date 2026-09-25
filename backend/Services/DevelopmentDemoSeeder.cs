using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public static class DevelopmentDemoSeeder
{
    public static async Task SeedAsync(IServiceProvider services, IConfiguration configuration,
        IHostEnvironment environment, CancellationToken ct = default)
    {
        if (!environment.IsDevelopment() || !configuration.GetValue<bool>("DemoData:Enabled")) return;
        await using var scope = services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        // Serialize cooperating startup seeders; stable slugs make subsequent runs idempotent.
        await db.Database.ExecuteSqlRawAsync("SELECT pg_advisory_xact_lock(48492501)", ct);
        var destinations = new[]
        {
            Place("Sigiriya", "Matale", "Central Province",
                "Explore rock-fortress landscapes and the heritage of the Cultural Triangle.", true),
            Place("Kandy", "Kandy", "Central Province",
                "Discover lakeside walks, traditional arts and the city's cultural heritage.", true),
            Place("Ella", "Badulla", "Uva Province",
                "Enjoy tea-country scenery, gentle hikes and views around the Nine Arch Bridge.", true),
            Place("Yala", "Hambantota", "Southern Province",
                "Discover dry-zone landscapes and guided wildlife drives in the Yala area.", true),
            Place("Mirissa", "Matara", "Southern Province",
                "Relax by the southern coast with beach time and village walks.", true),
            Place("Nuwara Eliya", "Nuwara Eliya", "Central Province",
                "Visit tea estates, cool-climate gardens and hill-country viewpoints.", false),
            Place("Galle", "Galle", "Southern Province",
                "Walk the historic fort streets and explore the southern coast.", true),
            Place("Colombo", "Colombo", "Western Province",
                "Experience the capital's markets, waterfront and diverse food traditions.", false)
        };
        var slugs = destinations.Select(d => d.Slug).ToArray();
        var existing = await db.Destinations.Where(d => slugs.Contains(d.Slug)).ToDictionaryAsync(d => d.Slug, ct);
        foreach (var destination in destinations)
        {
            if (existing.ContainsKey(destination.Slug)) continue; // Preserve existing content and active status.
            db.Destinations.Add(destination);
            existing.Add(destination.Slug, destination);
        }
        await db.SaveChangesAsync(ct);

        // Do not insert sample packages into an already curated package catalogue.
        if (!await db.TourPackages.AnyAsync(ct))
        {
            AddPackage(db, existing, "Cultural Triangle Explorer", 650m,
                new[] { "colombo", "sigiriya", "kandy" },
                new[] { "Colombo arrival and waterfront walk", "Travel to Sigiriya and village visit",
                    "Sigiriya heritage exploration", "Kandy culture and lakeside walk", "Return transfer and departure" });
            AddPackage(db, existing, "Hill Country Escape", 420m,
                new[] { "kandy", "nuwara-eliya", "ella" },
                new[] { "Kandy arrival and local exploration", "Tea-country journey to Nuwara Eliya",
                    "Scenic transfer to Ella and a gentle hike", "Ella viewpoints and departure transfer" });
            AddPackage(db, existing, "Wildlife & Beach Adventure", 790m,
                new[] { "yala", "mirissa", "galle" },
                new[] { "Arrival and transfer to the Yala area", "Guided wildlife drive and leisure time",
                    "Journey to Mirissa", "Beach leisure and coastal village walk",
                    "Galle Fort exploration", "Return transfer and departure" });
            AddPackage(db, existing, "Classic Sri Lanka Tour", 1450m,
                new[] { "colombo", "sigiriya", "kandy", "nuwara-eliya", "ella", "yala", "mirissa", "galle" },
                new[] { "Colombo arrival and city walk", "Journey to Sigiriya", "Cultural Triangle exploration",
                    "Kandy heritage and local arts", "Tea estates around Nuwara Eliya", "Hill-country journey to Ella",
                    "Travel to Yala and leisure time", "Guided wildlife drive and transfer to Mirissa",
                    "Galle Fort and coast", "Return transfer and departure" });
            await db.SaveChangesAsync(ct);
        }
        await transaction.CommitAsync(ct);
    }

    private static Destination Place(string name, string district, string province, string description, bool featured) => new()
    {
        Name = name, Slug = SlugHelper.Generate(name), District = district, Province = province,
        ShortDescription = description,
        Description = description + " Development demo content for the Ceyvora catalogue; confirm arrangements before offering a real itinerary.",
        IsFeatured = featured
    };

    private static void AddPackage(AppDbContext db, Dictionary<string, Destination> destinations,
        string title, decimal samplePrice, string[] stops, string[] days)
    {
        var package = new TourPackage
        {
            Title = title, Slug = SlugHelper.Generate(title), DurationDays = days.Length,
            DurationNights = days.Length - 1, StartingPrice = samplePrice, Currency = "USD", IsFeatured = true,
            ShortDescription = $"A {days.Length}-day sample journey through Sri Lanka.",
            Description = "Development demo itinerary with an illustrative per-person starting price, not a live quotation. " +
                "Accommodation, transport, activities and availability must be confirmed separately."
        };
        for (var i = 0; i < days.Length; i++)
            package.ItineraryDays.Add(new ItineraryDay
            {
                DayNumber = i + 1, Title = days[i],
                Description = days[i] + ". Sample schedule with time for local exploration and rest.",
                Accommodation = i == days.Length - 1 ? null : "Sample guesthouse or hotel; subject to confirmation",
                Meals = "To be confirmed"
            });
        db.TourPackages.Add(package);
        for (var i = 0; i < stops.Length; i++)
            db.PackageDestinations.Add(new PackageDestination
            {
                TourPackage = package, Destination = destinations[stops[i]], VisitOrder = i + 1
            });
    }
}
