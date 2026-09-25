namespace backend.Services;

public interface IFileService
{
    Task<string> SaveImageAsync(IFormFile file, string category, CancellationToken ct);
    Task DeleteImageIfUnusedAsync(string? url);
}
