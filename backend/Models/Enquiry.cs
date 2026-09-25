namespace backend.Models
{
    public class Enquiry
    {
        public int Id { get; set; }

        public int? TourPackageId { get; set; }
        public TourPackage? TourPackage { get; set; }

        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;

        public string? Country { get; set; }

        public DateTime? ArrivalDate { get; set; }

        public int NumberOfTravellers { get; set; }

        public string Message { get; set; } = string.Empty;

        public string Status { get; set; } = "New";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}