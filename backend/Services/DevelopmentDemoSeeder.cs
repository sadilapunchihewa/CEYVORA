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
            AddPackage(db, existing, "Courtyards & Verandahs", 1250m,
                new[] { "colombo", "kandy", "galle" },
                new[] { "Arrival in Colombo & Galle Face Heritage Walk", "Tropical Modernism tour: Geoffrey Bawa's legacy",
                    "Scenic drive to Kandy & Lunuganga gardens", "Kandy heritage, Temple of the Tooth & Botanical Gardens",
                    "Journey to Galle Fort via Bentota coastal estate", "Galle Fort architectural stroll & sunset ramparts", "Departure transfer" },
                "Authentic Ceylon", "Sri Lanka’s most renowned architect Geoffrey Bawa redefined South-East Asian architecture. Experience his timeless courtyard and verandah creations across tropical estates.");

            AddPackage(db, existing, "Beyond the Ordinary Sri Lanka", 1850m,
                new[] { "colombo", "sigiriya", "kandy", "ella", "mirissa" },
                new[] { "Welcome to Colombo: Secret food tours & city walk", "Transfer to Sigiriya & Minneriya Elephant Gathering",
                    "Ascend Sigiriya Rock Fortress at dawn & village lunch", "Royal Botanical Gardens & Kandy cultural evening",
                    "Scenic hill country train ride to Ella", "Little Adam's Peak hike & Nine Arch Bridge sunset",
                    "Descent to Southern Coast & Mirissa beach leisure", "Whale watching expedition & quiet beach cove",
                    "Galle Fort exploration & artisan workshops", "Return to Colombo & evening farewell" },
                "Join a Group", "Curated for curious travellers seeking deep connection. Explore iconic UNESCO fortresses, highland railways, secret culinary walks, and pristine southern beaches.");

            AddPackage(db, existing, "Cycling in Sri Lanka Tour", 980m,
                new[] { "sigiriya", "kandy", "nuwara-eliya", "ella" },
                new[] { "Arrival & bike fitting in Sigiriya countryside", "Pedal through ancient reservoir paths & Polonnaruwa ruins",
                    "Country road cycle to Knuckles foothills", "Kandy lake cycle & spice garden trail",
                    "Highland cycle through Nuwara Eliya tea estates", "Mountain pass ride down to Ella gap",
                    "Ravana Falls trail ride & sunset viewpoint", "Final valley cycle & return transfer" },
                "Adventurous Spirit", "How you journey in search of Sri Lanka's hidden treasures is an adventure in itself. Pedal along quiet village tank paths, tea estates, and misty mountain passes.");

            AddPackage(db, existing, "Love Songs of Ceylon", 1420m,
                new[] { "kandy", "nuwara-eliya", "mirissa", "galle" },
                new[] { "Romantic arrival in Kandy & private bungalow check-in", "Candlelit dinner overlooking Kandy Lake",
                    "Highland tea bungalow escape in Nuwara Eliya", "Private tea tasting & misty garden walks",
                    "Coastal transfer to Mirissa beach villa", "Sunset catamaran cruise & private beach dining",
                    "Galle Fort stroll & boutique shopping", "Farewell champagne breakfast & departure" },
                "Romantic Serendipity", "There may be no better place on earth for love than Ceylon. Intimate boutique retreats, misty tea gardens, sunset cruises, and private coastal dining.");

            AddPackage(db, existing, "Meditation & Yoga Holiday", 890m,
                new[] { "kandy", "ella", "mirissa" },
                new[] { "Arrival & welcome ceremony at wellness sanctuary", "Morning Hatha yoga & guided Buddhist mindfulness",
                    "Ayurvedic consultation & herbal wellness therapy", "Scenic retreat transfer to Ella highlands",
                    "Sunrise meditation over Nine Arch valley", "Descent to coastal sanctuary & oceanfront pranayama" },
                "Island of Wellness", "Devote yourself to healing mind, body, and soul amidst serene hill-country gardens, ancient Buddhist meditation paths, and oceanfront sanctuaries.");

            AddPackage(db, existing, "Following the Wild", 1650m,
                new[] { "sigiriya", "yala", "mirissa" },
                new[] { "Arrival & transfer to Wilpattu wilderness boundary", "Dawn jeep safari in search of leopards & sloth bears",
                    "Transfer to Sigiriya & eco-lodge birdwatching", "Minneriya National Park elephant gathering safari",
                    "Journey south to Yala National Park", "Full day deep wilderness safari in Yala Block 1",
                    "Coastal safari to Bundala wetland bird reserve", "Mirissa ocean safari: blue whales & dolphins", "Return transfer" },
                "Following the Wild", "Track leopards through dry zone scrublands, witness grand elephant gatherings, and sail into the deep blue ocean to meet blue whales.");

            AddPackage(db, existing, "Barefoot Luxury Escape", 2100m,
                new[] { "colombo", "nuwara-eliya", "yala", "galle" },
                new[] { "Helicopter transfer from Colombo to highland tea resort", "Private butler service & high tea in Nuwara Eliya",
                    "Luxury tented safari lodge check-in at Yala", "Private night safari & firelit dinner in the bush",
                    "Private coastal villa check-in near Galle Fort", "Exclusive spa treatments & sunset yacht charter", "Private airport transfer" },
                "Barefoot Luxury", "Seamless luxury blended with untouched nature. Stay in world-class tea bungalows, luxury safari camps, and private cliffside villas.");

            AddPackage(db, existing, "Experiential East", 1150m,
                new[] { "sigiriya", "kandy", "galle" },
                new[] { "Arrival & eastern heritage orientation", "Explore Trincomalee harbour & Swami Rock",
                    "Pigeon Island marine national park snorkelling", "Pasikuda bay relaxation & calm lagoon waters",
                    "Batticaloa lagoon eco-boat safari", "Cultural heritage walk in ancient Polonnaruwa",
                    "Return scenic drive through Knuckles range", "Colombo departure" },
                "Authentic Ceylon", "Discover Sri Lanka's pristine eastern coastline, turquoise lagoons, marine parks, and undisturbed cultural traditions.");

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
        string title, decimal samplePrice, string[] stops, string[] days,
        string category = "Authentic Ceylon", string? shortDesc = null)
    {
        var descText = shortDesc ?? $"A {days.Length}-day journey through Sri Lanka's finest landscapes.";
        var package = new TourPackage
        {
            Title = title, Slug = SlugHelper.Generate(title), DurationDays = days.Length,
            DurationNights = days.Length - 1, StartingPrice = samplePrice, Currency = "USD", IsFeatured = true,
            ShortDescription = $"[{category}] {descText}",
            Description = descText + " Experience luxury, comfort, and authentic Sri Lankan hospitality with Ceyvora."
        };
        for (var i = 0; i < days.Length; i++)
            package.ItineraryDays.Add(new ItineraryDay
            {
                DayNumber = i + 1, Title = days[i],
                Description = days[i] + ". Carefully arranged itinerary featuring guided excursions and comfortable stays.",
                Accommodation = i == days.Length - 1 ? null : "Boutique hotel or luxury eco-resort",
                Meals = i == 0 ? "Dinner" : "Breakfast & Dinner"
            });
        db.TourPackages.Add(package);
        for (var i = 0; i < stops.Length; i++)
            if (destinations.TryGetValue(stops[i], out var dest))
            {
                db.PackageDestinations.Add(new PackageDestination
                {
                    TourPackage = package, Destination = dest, VisitOrder = i + 1
                });
            }
    }
}
