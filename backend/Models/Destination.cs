namespace backend.Models
{
    public class Destination
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;

        public string ShortDescription { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        public string? District { get; set; }
        public string? Province { get; set; }
        public string? ImageUrl { get; set; }

        public bool IsFeatured { get; set; } = false;
        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}