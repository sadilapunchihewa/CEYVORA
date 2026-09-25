namespace backend.Models
{
    public class Booking
    {
        public int Id { get; set; }
        // Nullable to preserve bookings created before accounts existed.
        public int? UserId { get; set; }
        public User? User { get; set; }

        public int TourPackageId { get; set; }
        public TourPackage? TourPackage { get; set; }

        public string CustomerName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;

        public string? Country { get; set; }

        public DateTime TravelDate { get; set; }

        public int Adults { get; set; }
        public int Children { get; set; }

        public string? SpecialRequests { get; set; }

        public decimal? TotalAmount { get; set; }

        public string Status { get; set; } = "Pending";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
