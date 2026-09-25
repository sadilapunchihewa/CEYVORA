namespace backend.Models
{
    public class TourPackage
    {
        public int Id { get; set; }

        public string Title { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;

        public string ShortDescription { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        public int DurationDays { get; set; }
        public int DurationNights { get; set; }

        public decimal StartingPrice { get; set; }

        public string Currency { get; set; } = "USD";

        public string? HeroImageUrl { get; set; }

        public bool IsFeatured { get; set; } = false;
        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<ItineraryDay> ItineraryDays { get; set; }
            = new List<ItineraryDay>();
    }
}