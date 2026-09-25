namespace backend.Services;

public static class SearchHelper
{
    // Search text is literal; PostgreSQL LIKE wildcards are escaped.
    public static string Pattern(string value) => "%" + value.Trim()
        .Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_") + "%";
}
