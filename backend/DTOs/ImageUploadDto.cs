using System.ComponentModel.DataAnnotations;

namespace backend.DTOs;

public class ImageUploadDto
{
    [Required] public IFormFile File { get; set; } = null!;
}

public record ImageUploadResponseDto(string ImageUrl);
