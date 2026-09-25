using System.ComponentModel.DataAnnotations;
using backend.DTOs.Common;

namespace backend.DTOs;

public class DestinationQuery : PageQuery
{
    [StringLength(200)] public string? Search { get; set; }
    [StringLength(100)] public string? Province { get; set; }
    [StringLength(100)] public string? District { get; set; }
    public bool? Featured { get; set; }
}

public class PackageQuery : PageQuery, IValidatableObject
{
    [StringLength(200)] public string? Search { get; set; }
    [Range(typeof(decimal), "0", "100000000")] public decimal? MinPrice { get; set; }
    [Range(typeof(decimal), "0", "100000000")] public decimal? MaxPrice { get; set; }
    [Range(1, 365)] public int? MinDays { get; set; }
    [Range(1, 365)] public int? MaxDays { get; set; }
    [Range(1, int.MaxValue)] public int? DestinationId { get; set; }
    public bool? Featured { get; set; }
    [RegularExpression("^(price_asc|price_desc|duration_asc|duration_desc|newest)$")]
    public string Sort { get; set; } = "newest";
    public IEnumerable<ValidationResult> Validate(ValidationContext context)
    {
        if (MinPrice > MaxPrice) yield return new("Minimum price cannot exceed maximum price.", new[] { nameof(MinPrice) });
        if (MinDays > MaxDays) yield return new("Minimum days cannot exceed maximum days.", new[] { nameof(MinDays) });
    }
}

public class BookingQuery : PageQuery, IValidatableObject
{
    [RegularExpression("^(Pending|Confirmed|Cancelled|Completed)$")] public string? Status { get; set; }
    [StringLength(200)] public string? Search { get; set; }
    public DateOnly? FromDate { get; set; }
    public DateOnly? ToDate { get; set; }
    public IEnumerable<ValidationResult> Validate(ValidationContext context)
    {
        if (FromDate > ToDate) yield return new("FromDate cannot exceed ToDate.", new[] { nameof(FromDate) });
    }
}

public class EnquiryQuery : PageQuery
{
    [RegularExpression("^(New|InProgress|Resolved|Closed)$")] public string? Status { get; set; }
    [StringLength(200)] public string? Search { get; set; }
}

public class ReviewQuery : PageQuery
{
    public bool? Approved { get; set; }
    [Range(1, 5)] public int? Rating { get; set; }
    [Range(1, int.MaxValue)] public int? PackageId { get; set; }
}

public class VisitOrderDto
{
    [Range(0, 10000)] public int VisitOrder { get; set; }
}
