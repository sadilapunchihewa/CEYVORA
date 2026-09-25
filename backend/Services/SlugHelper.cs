using System.Text;
using System.Text.RegularExpressions;

namespace backend.Services;

public static class SlugHelper
{
    public static string Normalize(string value) => value.Trim().ToLowerInvariant();

    public static string Generate(string title)
    {
        var normalized = title.Normalize(NormalizationForm.FormD);
        normalized = Regex.Replace(normalized, @"\p{Mn}", "");
        var slug = Regex.Replace(normalized.ToLowerInvariant(), "[^a-z0-9]+", "-").Trim('-');
        return slug.Length > 180 ? slug[..180].TrimEnd('-') : slug;
    }
}
