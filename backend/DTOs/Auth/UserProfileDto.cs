namespace backend.DTOs.Auth;

public record UserProfileDto(int UserId, string FullName, string Email, string Role,
    string? Phone, string? Country, DateTime CreatedAt);
