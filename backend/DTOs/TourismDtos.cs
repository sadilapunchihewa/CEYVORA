using System.ComponentModel.DataAnnotations;
using backend.Validation;
using backend.Services;

namespace backend.DTOs;

public class DestinationWriteDto
{
    [Required, StringLength(150)] public string Name { get; set; } = string.Empty;
    [StringLength(180), RegularExpression(@"^[a-z0-9]+(?:-[a-z0-9]+)*$")]
    public string? Slug { get => _slug; set => _slug = string.IsNullOrWhiteSpace(value) ? null : SlugHelper.Normalize(value); }
    private string? _slug;
    [Required, StringLength(500)] public string ShortDescription { get; set; } = string.Empty;
    [Required, StringLength(10000)] public string Description { get; set; } = string.Empty;
    [StringLength(100)] public string? District { get; set; }
    [StringLength(100)] public string? Province { get; set; }
    [ImageUrl, StringLength(2000)] public string? ImageUrl { get; set; }
    public bool IsFeatured { get; set; }
    public bool IsActive { get; set; } = true;
}

public class TourPackageWriteDto : IValidatableObject
{
    [Required, StringLength(150)] public string Title { get; set; } = string.Empty;
    [StringLength(180), RegularExpression(@"^[a-z0-9]+(?:-[a-z0-9]+)*$")]
    public string? Slug { get => _slug; set => _slug = string.IsNullOrWhiteSpace(value) ? null : SlugHelper.Normalize(value); }
    private string? _slug;
    [Required, StringLength(500)] public string ShortDescription { get; set; } = string.Empty;
    [Required, StringLength(10000)] public string Description { get; set; } = string.Empty;
    [Range(1, 365)] public int DurationDays { get; set; }
    [Range(0, 365)] public int DurationNights { get; set; }
    [Range(typeof(decimal), "0", "100000000")] public decimal StartingPrice { get; set; }
    [Required, RegularExpression(@"^[A-Z]{3}$")] public string Currency { get; set; } = "USD";
    [ImageUrl, StringLength(2000)] public string? HeroImageUrl { get; set; }
    public bool IsFeatured { get; set; }
    public bool IsActive { get; set; } = true;
    public IEnumerable<ValidationResult> Validate(ValidationContext context)
    {
        if (DurationNights > DurationDays)
            yield return new ValidationResult("Nights cannot exceed days.", new[] { nameof(DurationNights) });
    }
}

public class ItineraryWriteDto
{
    [Range(1, 365)] public int DayNumber { get; set; }
    [Required, StringLength(150)] public string Title { get; set; } = string.Empty;
    [Required, StringLength(10000)] public string Description { get; set; } = string.Empty;
    [StringLength(500)] public string? Accommodation { get; set; }
    [StringLength(500)] public string? Meals { get; set; }
}

public class BookingCreateDto : IValidatableObject
{
    [Range(1, int.MaxValue)] public int TourPackageId { get; set; }
    [Required, Phone, StringLength(30)] public string Phone { get; set; } = string.Empty;
    [StringLength(100)] public string? Country { get; set; }
    public DateTimeOffset TravelDate { get; set; }
    [Range(1, 1000)] public int Adults { get; set; }
    [Range(0, 1000)] public int Children { get; set; }
    [StringLength(3000)] public string? SpecialRequests { get; set; }
    public IEnumerable<ValidationResult> Validate(ValidationContext context)
    {
        if (TravelDate.UtcDateTime.Date <= DateTime.UtcNow.Date)
            yield return new ValidationResult("Travel date must be a future date (UTC).", new[] { nameof(TravelDate) });
    }
}

public class BookingStatusDto
{
    [Required, RegularExpression("^(Pending|Confirmed|Cancelled|Completed)$")]
    public string Status { get; set; } = string.Empty;
}

public class EnquiryCreateDto
{
    [Range(1, int.MaxValue)] public int? TourPackageId { get; set; }
    [Required, StringLength(150)] public string Name { get; set; } = string.Empty;
    [Required, EmailAddress, StringLength(254)] public string Email { get; set; } = string.Empty;
    [Required, Phone, StringLength(30)] public string Phone { get; set; } = string.Empty;
    [StringLength(100)] public string? Country { get; set; }
    public DateTimeOffset? ArrivalDate { get; set; }
    [Range(1, 1000)] public int NumberOfTravellers { get; set; }
    [Required, StringLength(5000)] public string Message { get; set; } = string.Empty;
}

public class EnquiryStatusDto
{
    [Required, RegularExpression("^(New|InProgress|Resolved|Closed)$")]
    public string Status { get; set; } = string.Empty;
}

public class ReviewCreateDto
{
    [Range(1, int.MaxValue)] public int TourPackageId { get; set; }
    [Range(1, 5)] public int Rating { get; set; }
    [Required, StringLength(3000, MinimumLength = 3)] public string Comment { get; set; } = string.Empty;
}

public record DestinationDto(int Id, string Name, string Slug, string ShortDescription, string Description,
    string? District, string? Province, string? ImageUrl, bool IsFeatured, bool IsActive, DateTime CreatedAt);
public record TourPackageDto(int Id, string Title, string Slug, string ShortDescription, string Description,
    int DurationDays, int DurationNights, decimal StartingPrice, string Currency, string? HeroImageUrl,
    bool IsFeatured, bool IsActive, DateTime CreatedAt);
public record ItineraryDto(int Id, int TourPackageId, int DayNumber, string Title, string Description,
    string? Accommodation, string? Meals);
public record BookingDto(int Id, int? UserId, int TourPackageId, string CustomerName, string Email,
    string Phone, string? Country, DateTime TravelDate, int Adults, int Children, string? SpecialRequests,
    decimal? TotalAmount, string Status, DateTime CreatedAt);
public record EnquiryDto(int Id, int? TourPackageId, string Name, string Email, string Phone, string? Country,
    DateTime? ArrivalDate, int NumberOfTravellers, string Message, string Status, DateTime CreatedAt);
public record ReviewDto(int Id, int TourPackageId, string CustomerName, int Rating, string Comment,
    bool IsApproved, DateTime CreatedAt);
