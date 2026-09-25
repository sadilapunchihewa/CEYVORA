using backend.DTOs.Auth;

namespace backend.Services;

public interface IAuthService
{
    Task<AuthResponseDto?> RegisterAsync(RegisterDto dto, CancellationToken cancellationToken);
    Task<AuthResponseDto?> LoginAsync(LoginDto dto, CancellationToken cancellationToken);
    Task<UserProfileDto?> GetProfileAsync(int userId, CancellationToken cancellationToken);
}
