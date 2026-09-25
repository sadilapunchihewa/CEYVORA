using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace backend.Services;

// Normalize controller validation/business errors to ProblemDetails.
public sealed class ApiErrorFilter : IAlwaysRunResultFilter
{
    public void OnResultExecuting(ResultExecutingContext context)
    {
        if (context.Result is not ObjectResult { StatusCode: >= 400 } result) return;
        if (result.Value is ProblemDetails problem)
        {
            problem.Extensions["traceId"] = context.HttpContext.TraceIdentifier;
            return;
        }
        var message = result.Value?.GetType().GetProperty("message")?.GetValue(result.Value) as string;
        context.Result = new ObjectResult(new ProblemDetails
        {
            Status = result.StatusCode, Title = message ?? "The request could not be completed.",
            Extensions = { ["traceId"] = context.HttpContext.TraceIdentifier }
        }) { StatusCode = result.StatusCode, ContentTypes = { "application/problem+json" } };
    }
    public void OnResultExecuted(ResultExecutedContext context) { }
}
