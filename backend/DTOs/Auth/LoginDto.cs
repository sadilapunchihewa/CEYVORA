using System.ComponentModel.DataAnnotations;


namespace backend.DTOs.Auth;

public class LoginDto
{
    [Required, EmailAddress, StringLength(254)] public string Email { get; set; } = string.Empty;
    [Required, StringLength(72)] public string Password { get; set; } = string.Empty;
}
