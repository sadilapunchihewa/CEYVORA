using System.ComponentModel.DataAnnotations;
using backend.Data;
using backend.Models;
using backend.Validation;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public static class DevelopmentAdminSeeder
{
    public static async Task SeedAsync(IServiceProvider services, IConfiguration configuration,
        IHostEnvironment environment)
    {
        if (!environment.IsDevelopment()) return;
        var email = configuration["CEYVORA_ADMIN_EMAIL"];
        var password = configuration["CEYVORA_ADMIN_PASSWORD"];
        if (string.IsNullOrWhiteSpace(email) && string.IsNullOrWhiteSpace(password)) return;
        if (string.IsNullOrWhiteSpace(email) || email.Trim().Length > 254
            || !new EmailAddressAttribute().IsValid(email.Trim()) || !new PasswordAttribute().IsValid(password))
            throw new InvalidOperationException("Development admin configuration requires a valid email and a valid password.");

        await using var scope = services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var normalizedEmail = AuthService.NormalizeEmail(email);
        var existing = await db.Users.SingleOrDefaultAsync(u => u.Email == normalizedEmail);
        if (existing != null)
        {
            if (existing.Role != Roles.Admin)
                throw new InvalidOperationException("Admin seed email belongs to an existing customer. Use a different email.");
            return; // Never overwrite an existing password or promote a customer.
        }
        if (await db.Users.AnyAsync(u => u.Role == Roles.Admin)) return;
        db.Users.Add(new User
        {
            FullName = "Development Admin",
            Email = normalizedEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password!, workFactor: 12),
            Role = Roles.Admin
        });
        await db.SaveChangesAsync();
    }
}
