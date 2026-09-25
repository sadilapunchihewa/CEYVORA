namespace backend.DTOs.Auth;

public record AuthResponseDto(int UserId, string FullName, string Email, string Role, string Token);
