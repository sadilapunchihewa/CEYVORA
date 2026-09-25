using backend.Data;
using backend.DTOs;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class DetailsService(AppDbContext db)
{
    public async Task<TourPackageDetailsDto> PackageAsync(TourPackageDto package, CancellationToken ct)
    {
        var destinations = await db.PackageDestinations.AsNoTracking()
            .Where(p => p.TourPackageId == package.Id && p.Destination.IsActive)
            .OrderBy(p => p.VisitOrder).ThenBy(p => p.DestinationId)
            .Select(p => new PackageDestinationDto(p.DestinationId, p.Destination.Name,
                p.Destination.Slug, p.Destination.ImageUrl, p.VisitOrder)).ToListAsync(ct);
        var itinerary = await db.ItineraryDays.AsNoTracking().Where(i => i.TourPackageId == package.Id)
            .OrderBy(i => i.DayNumber).ThenBy(i => i.Id).Select(DtoMappings.Itinerary).ToListAsync(ct);
        var reviews = await db.Reviews.AsNoTracking().Where(r => r.TourPackageId == package.Id && r.IsApproved)
            .OrderByDescending(r => r.CreatedAt).ThenByDescending(r => r.Id)
            .Take(50).Select(DtoMappings.Review).ToListAsync(ct);
        return new(package, destinations, itinerary, reviews);
    }

    public async Task<DestinationDetailsDto> DestinationAsync(DestinationDto destination, CancellationToken ct)
    {
        // Keep this embedded preview bounded. The package list endpoint supports destinationId and paging.
        var packages = await db.PackageDestinations.AsNoTracking()
            .Where(p => p.DestinationId == destination.Id && p.TourPackage.IsActive)
            .Select(p => p.TourPackage).OrderByDescending(p => p.CreatedAt).ThenByDescending(p => p.Id)
            .Take(12).Select(DtoMappings.TourPackage).ToListAsync(ct);
        return new(destination, packages);
    }
}
