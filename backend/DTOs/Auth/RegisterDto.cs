using System.ComponentModel.DataAnnotations;
using backend.Validation;

namespace backend.DTOs.Auth;

public class RegisterDto
{
    [Required, StringLength(150)] public string FullName { get; set; } = string.Empty;
    [Required, EmailAddress, StringLength(254)] public string Email { get; set; } = string.Empty;
    [Required, Password] public string Password { get; set; } = string.Empty;
    [Phone, StringLength(30)] public string? Phone { get; set; }
    [StringLength(100)] public string? Country { get; set; }
}
