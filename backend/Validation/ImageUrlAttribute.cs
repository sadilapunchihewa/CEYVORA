using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace backend.Validation;

public sealed class ImageUrlAttribute : ValidationAttribute
{
    public ImageUrlAttribute() : base("Use an HTTP(S) image URL or an application upload URL.") { }
    public override bool IsValid(object? value)
    {
        if (value is null || value is string { Length: 0 }) return true;
        if (value is not string url) return false;
        if (Regex.IsMatch(url, @"^/uploads/(destinations|packages)/[a-f0-9]{32}\.(jpg|jpeg|png|webp)$")) return true;
        return Uri.TryCreate(url, UriKind.Absolute, out var uri) &&
            (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
    }
}
