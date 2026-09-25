namespace backend.DTOs;

public record PackageDestinationDto(int Id, string Name, string Slug, string? ImageUrl, int VisitOrder);

public record TourPackageDetailsDto : TourPackageDto
{
    public IReadOnlyList<PackageDestinationDto> Destinations { get; init; }
    public IReadOnlyList<ItineraryDto> ItineraryDays { get; init; }
    public IReadOnlyList<ReviewDto> ApprovedReviews { get; init; }

    public TourPackageDetailsDto(TourPackageDto p, IReadOnlyList<PackageDestinationDto> destinations,
        IReadOnlyList<ItineraryDto> itineraryDays, IReadOnlyList<ReviewDto> approvedReviews)
        : base(p.Id, p.Title, p.Slug, p.ShortDescription, p.Description, p.DurationDays, p.DurationNights,
            p.StartingPrice, p.Currency, p.HeroImageUrl, p.IsFeatured, p.IsActive, p.CreatedAt)
    {
        Destinations = destinations;
        ItineraryDays = itineraryDays;
        ApprovedReviews = approvedReviews;
    }
}

public record DestinationDetailsDto : DestinationDto
{
    public IReadOnlyList<TourPackageDto> TourPackages { get; init; }
    public DestinationDetailsDto(DestinationDto d, IReadOnlyList<TourPackageDto> tourPackages)
        : base(d.Id, d.Name, d.Slug, d.ShortDescription, d.Description, d.District,
            d.Province, d.ImageUrl, d.IsFeatured, d.IsActive, d.CreatedAt)
    {
        TourPackages = tourPackages;
    }
}
