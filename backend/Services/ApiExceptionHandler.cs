using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace backend.Services;

public sealed class ApiExceptionHandler(ILogger<ApiExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken ct)
    {
        var (status, message) = exception switch
        {
            ImageValidationException e => (400, e.Message),
            BadHttpRequestException e => (e.StatusCode, "Invalid request or request body too large."),
            DbUpdateConcurrencyException => (409, "The resource changed. Reload and try again."),
            DbUpdateException { InnerException: PostgresException { SqlState: PostgresErrorCodes.UniqueViolation,
                ConstraintName: "IX_Destinations_Slug" or "IX_TourPackages_Slug" } } =>
                (409, "Slug is already in use."),
            _ => (500, "An unexpected error occurred.")
        };
        // Log type and correlation ID, without request bodies, tokens or connection details.
        logger.LogError("Request failed: {ErrorType}; trace {TraceId}.", exception.GetType().Name, context.TraceIdentifier);
        context.Response.StatusCode = status;
        await context.Response.WriteAsJsonAsync(new ProblemDetails
        {
            Status = status, Title = message, Extensions = { ["traceId"] = context.TraceIdentifier }
        }, options: (System.Text.Json.JsonSerializerOptions?)null, contentType: "application/problem+json", cancellationToken: ct);
        return true;
    }
}
