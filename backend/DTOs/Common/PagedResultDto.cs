using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace backend.DTOs.Common;

public class PageQuery
{
    // Bound page as well as size so Skip cannot overflow an int.
    [Range(1, 1000000)] public int Page { get; set; } = 1;
    [Range(1, 50)] public int PageSize { get; set; } = 12;
}

public record PagedResultDto<T>(IReadOnlyList<T> Items, int Page, int PageSize, int TotalItems, int TotalPages);

public static class Pagination
{
    public static async Task<PagedResultDto<T>> ToPageAsync<T>(
        this IQueryable<T> query, PageQuery page, CancellationToken ct)
    {
        var total = await query.CountAsync(ct);
        var items = await query.Skip((page.Page - 1) * page.PageSize).Take(page.PageSize).ToListAsync(ct);
        return new(items, page.Page, page.PageSize, total, (int)Math.Ceiling(total / (double)page.PageSize));
    }
}
