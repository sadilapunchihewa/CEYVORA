using System.Security.Claims;
using backend.DTOs.Auth;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace backend.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IAuthService auth) : ControllerBase
{
    [AllowAnonymous, HttpPost("register"), EnableRateLimiting("auth")]
    public async Task<IActionResult> Register(RegisterDto dto, CancellationToken cancellationToken)
    {
        var response = await auth.RegisterAsync(dto, cancellationToken);
        return response == null
            ? Conflict(new { message = "Unable to register with these details." })
            : StatusCode(StatusCodes.Status201Created, response);
    }

    [AllowAnonymous, HttpPost("login"), EnableRateLimiting("auth")]
    public async Task<IActionResult> Login(LoginDto dto, CancellationToken cancellationToken)
    {
        var response = await auth.LoginAsync(dto, cancellationToken);
        return response == null
            ? Unauthorized(new { message = "Invalid email or password." })
            : Ok(response);
    }

    [Authorize, HttpGet("me")]
    public async Task<IActionResult> Me(CancellationToken cancellationToken)
    {
        if (!int.TryParse(User.FindFirstValue("sub"), out var userId)) return Unauthorized();
        var profile = await auth.GetProfileAsync(userId, cancellationToken);
        return profile == null ? Unauthorized() : Ok(profile);
    }
}
