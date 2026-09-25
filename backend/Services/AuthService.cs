using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using backend.Data;
using backend.DTOs.Auth;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Npgsql;

namespace backend.Services;

public class AuthService(AppDbContext db, IOptions<JwtOptions> options) : IAuthService
{
    // An unknown email still performs BCrypt work to reduce account enumeration by timing.
    private static readonly string DummyHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString(), workFactor: 12);

    public async Task<AuthResponseDto?> RegisterAsync(RegisterDto dto, CancellationToken cancellationToken)
    {
        var email = NormalizeEmail(dto.Email);
        if (await db.Users.AnyAsync(u => u.Email == email, cancellationToken))
            return null;

        var user = new User
        {
            FullName = dto.FullName.Trim(),
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password, workFactor: 12),
            Phone = dto.Phone?.Trim(),
            Country = dto.Country?.Trim(),
            Role = Roles.Customer
        };
        db.Users.Add(user);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException
            { SqlState: PostgresErrorCodes.UniqueViolation, ConstraintName: "IX_Users_Email" })
        {
            // The unique index also protects simultaneous registrations.
            db.Entry(user).State = EntityState.Detached;
            return null;
        }
        return CreateResponse(user);
    }

    public async Task<AuthResponseDto?> LoginAsync(LoginDto dto, CancellationToken cancellationToken)
    {
        if (Encoding.UTF8.GetByteCount(dto.Password) > 72 || dto.Password.Contains('\0'))
            return null;
        var email = NormalizeEmail(dto.Email);
        var user = await db.Users.AsNoTracking().SingleOrDefaultAsync(u => u.Email == email, cancellationToken);
        var validPassword = BCrypt.Net.BCrypt.Verify(dto.Password, user?.PasswordHash ?? DummyHash);
        if (user == null || !validPassword || !user.IsActive)
            return null;
        return CreateResponse(user);
    }

    public Task<UserProfileDto?> GetProfileAsync(int userId, CancellationToken cancellationToken) =>
        db.Users.AsNoTracking().Where(u => u.Id == userId && u.IsActive)
            .Select(u => new UserProfileDto(u.Id, u.FullName, u.Email, u.Role, u.Phone, u.Country, u.CreatedAt))
            .SingleOrDefaultAsync(cancellationToken);

    public static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();

    private AuthResponseDto CreateResponse(User user)
    {
        var jwt = options.Value;
        var now = DateTime.UtcNow;
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("name", user.FullName),
            new Claim("role", user.Role),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };
        var token = new JwtSecurityToken(jwt.Issuer, jwt.Audience, claims,
            notBefore: now, expires: now.AddMinutes(jwt.ExpiryMinutes),
            signingCredentials: new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key)), SecurityAlgorithms.HmacSha256));
        return new AuthResponseDto(user.Id, user.FullName, user.Email, user.Role,
            new JwtSecurityTokenHandler().WriteToken(token));
    }
}
