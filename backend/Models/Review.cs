namespace backend.Models
{
    public class Review
    {
        public int Id { get; set; }
        public int? UserId { get; set; }
        public User? User { get; set; }

        public int TourPackageId { get; set; }
        public TourPackage? TourPackage { get; set; }

        public string CustomerName { get; set; } = string.Empty;

        public int Rating { get; set; }

        public string Comment { get; set; } = string.Empty;

        public bool IsApproved { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
