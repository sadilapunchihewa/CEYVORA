namespace backend.Models
{
    public class ItineraryDay
    {
        public int Id { get; set; }

        public int TourPackageId { get; set; }

        public TourPackage? TourPackage { get; set; }

        public int DayNumber { get; set; }

        public string Title { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public string? Accommodation { get; set; }

        public string? Meals { get; set; }
    }
}