using System.Buffers.Binary;
using System.Text.RegularExpressions;
using backend.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

// Local development storage. Original client filenames never become disk paths.
public class FileService(IWebHostEnvironment environment, AppDbContext db, ILogger<FileService> logger) : IFileService
{
    public const int MaxBytes = 5 * 1024 * 1024;
    public const int MaxRequestBytes = MaxBytes + 64 * 1024;
    private static readonly Dictionary<string, string> Types = new(StringComparer.OrdinalIgnoreCase)
    {
        [".jpg"] = "image/jpeg", [".jpeg"] = "image/jpeg",
        [".png"] = "image/png", [".webp"] = "image/webp"
    };

    public async Task<string> SaveImageAsync(IFormFile file, string category, CancellationToken ct)
    {
        if (category is not ("destinations" or "packages")) throw new ArgumentException("Unknown upload category.");
        if (file.Length == 0 || file.Length > MaxBytes)
            throw new ImageValidationException("Image must be nonempty and no larger than 5 MB.");
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!Types.TryGetValue(extension, out var mime) ||
            !string.Equals(file.ContentType, mime, StringComparison.OrdinalIgnoreCase))
            throw new ImageValidationException("Only JPG, JPEG, PNG and WebP images with matching content types are allowed.");

        await using var input = file.OpenReadStream();
        using var data = new MemoryStream();
        var buffer = new byte[81920];
        int read;
        while ((read = await input.ReadAsync(buffer.AsMemory(), ct)) > 0)
        {
            if (data.Length + read > MaxBytes) throw new ImageValidationException("Image cannot exceed 5 MB.");
            await data.WriteAsync(buffer.AsMemory(0, read), ct);
        }
        var bytes = data.ToArray();
        if (!HasImageSignature(bytes, extension))
            throw new ImageValidationException("File contents do not match the selected image format.");

        var url = $"/uploads/{category}/{Guid.NewGuid():N}{extension}";
        var path = ResolveLocalPath(url)!;
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        EnsureNoLinks(path);
        try
        {
            await using var output = new FileStream(path, FileMode.CreateNew, FileAccess.Write, FileShare.None, 81920, useAsync: true);
            await output.WriteAsync(bytes, ct);
        }
        catch
        {
            if (File.Exists(path)) File.Delete(path);
            throw;
        }
        return url;
    }

    public async Task DeleteImageIfUnusedAsync(string? url)
    {
        try
        {
            var path = ResolveLocalPath(url);
            if (path == null) return; // Never delete external URLs or arbitrary local paths.
            if (await db.Destinations.AsNoTracking().AnyAsync(d => d.ImageUrl == url) ||
                await db.TourPackages.AsNoTracking().AnyAsync(p => p.HeroImageUrl == url)) return;
            EnsureNoLinks(path);
            File.Delete(path);
        }
        catch (Exception ex)
        {
            // A failed cleanup must not turn a committed upload into an API failure.
            logger.LogWarning("Upload cleanup could not complete ({ErrorType}).", ex.GetType().Name);
        }
    }

    private string? ResolveLocalPath(string? url)
    {
        if (url == null || !Regex.IsMatch(url, @"^/uploads/(destinations|packages)/[a-f0-9]{32}\.(jpg|jpeg|png|webp)$"))
            return null;
        var root = Path.GetFullPath(environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot"));
        var path = Path.GetFullPath(Path.Combine(root, url.TrimStart('/').Replace('/', Path.DirectorySeparatorChar)));
        if (!path.StartsWith(root + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase)) return null;
        EnsureNoLinks(path);
        return path;
    }

    private void EnsureNoLinks(string path)
    {
        var root = Path.GetFullPath(environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot"));
        for (var current = path; current != null; current = Path.GetDirectoryName(current))
        {
            if ((File.Exists(current) || Directory.Exists(current)) &&
                (File.GetAttributes(current) & FileAttributes.ReparsePoint) != 0)
                throw new IOException("Upload paths must not contain symbolic links.");
            if (string.Equals(current, root, StringComparison.OrdinalIgnoreCase)) break;
        }
    }

    private static bool HasImageSignature(byte[] b, string extension)
    {
        if (extension is ".jpg" or ".jpeg")
            return b.Length >= 4 && b[0] == 0xff && b[1] == 0xd8 && b[2] == 0xff &&
                b[^2] == 0xff && b[^1] == 0xd9;
        if (extension == ".png")
            return b.Length >= 45 && b.AsSpan(0, 8).SequenceEqual(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 }) &&
                b.AsSpan(12, 4).SequenceEqual("IHDR"u8) && b.AsSpan(b.Length - 8, 4).SequenceEqual("IEND"u8);
        return b.Length >= 20 && b.AsSpan(0, 4).SequenceEqual("RIFF"u8) &&
            b.AsSpan(8, 4).SequenceEqual("WEBP"u8) &&
            BinaryPrimitives.ReadUInt32LittleEndian(b.AsSpan(4, 4)) == b.Length - 8 &&
            (b.AsSpan(12, 4).SequenceEqual("VP8 "u8) || b.AsSpan(12, 4).SequenceEqual("VP8L"u8) ||
             b.AsSpan(12, 4).SequenceEqual("VP8X"u8));
    }
}
