using backend.Data;
using backend.DTOs;
using backend.DTOs.Common;
using backend.Services;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController, Route("api/enquiries"), Authorize(Roles = Roles.Admin)]
public class EnquiriesController(AppDbContext db) : ControllerBase
{
    [HttpPost, AllowAnonymous]
    public async Task<IActionResult> Create(EnquiryCreateDto dto, CancellationToken ct)
    {
        if (dto.TourPackageId.HasValue && !await db.TourPackages.AnyAsync(
            p => p.Id == dto.TourPackageId && p.IsActive, ct)) return NotFound();
        var enquiry = new Enquiry
        {
            TourPackageId = dto.TourPackageId, Name = dto.Name.Trim(), Email = dto.Email.Trim().ToLowerInvariant(),
            Phone = dto.Phone.Trim(), Country = dto.Country?.Trim(), ArrivalDate = dto.ArrivalDate?.UtcDateTime,
            NumberOfTravellers = dto.NumberOfTravellers, Message = dto.Message.Trim()
        };
        db.Enquiries.Add(enquiry);
        await db.SaveChangesAsync(ct);
        return StatusCode(StatusCodes.Status201Created,
            await db.Enquiries.Where(e => e.Id == enquiry.Id).Select(DtoMappings.Enquiry).SingleAsync(ct));
    }

    [HttpGet]
    public async Task<IActionResult> All([FromQuery] EnquiryQuery filter, CancellationToken ct)
    {
        var query = db.Enquiries.AsNoTracking();
        if (filter.Status != null) query = query.Where(e => e.Status == filter.Status);
        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var pattern = SearchHelper.Pattern(filter.Search);
            query = query.Where(e => EF.Functions.ILike(e.Name, pattern) || EF.Functions.ILike(e.Email, pattern) ||
                EF.Functions.ILike(e.Message, pattern) ||
                (e.Country != null && EF.Functions.ILike(e.Country, pattern)));
        }
        return Ok(await query.OrderByDescending(e => e.CreatedAt).ThenByDescending(e => e.Id)
            .Select(DtoMappings.Enquiry).ToPageAsync(filter, ct));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id, CancellationToken ct)
    {
        var enquiry = await db.Enquiries.AsNoTracking().Where(e => e.Id == id)
            .Select(DtoMappings.Enquiry).SingleOrDefaultAsync(ct);
        return enquiry == null ? NotFound() : Ok(enquiry);
    }

    [HttpGet("summary")]
    public async Task<IActionResult> Summary(CancellationToken ct)
    {
        var today = DateTime.UtcNow.Date;
        var start = today.AddDays(-13);
        var daily = await db.Enquiries.AsNoTracking().Where(e => e.CreatedAt >= start)
            .GroupBy(e => e.CreatedAt.Date)
            .Select(g => new { Date = g.Key, Count = g.Count() }).ToListAsync(ct);
        var countries = await db.Enquiries.AsNoTracking()
            .GroupBy(e => e.Country == null || e.Country == "" ? "Not provided" : e.Country)
            .Select(g => new { Country = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count).Take(5).ToListAsync(ct);
        return Ok(new {
            total = await db.Enquiries.CountAsync(ct),
            recentCount = daily.Sum(x => x.Count),
            travellers = await db.Enquiries.SumAsync(e => (long)e.NumberOfTravellers, ct),
            daily = Enumerable.Range(0, 14).Select(i => new {
                date = start.AddDays(i).ToString("yyyy-MM-dd"),
                count = daily.FirstOrDefault(x => x.Date == start.AddDays(i))?.Count ?? 0
            }), countries
        });
    }

    [HttpPut("{id:int}/status")]
    public async Task<IActionResult> Status(int id, EnquiryStatusDto dto, CancellationToken ct)
    {
        var enquiry = await db.Enquiries.FindAsync(new object[] { id }, ct);
        if (enquiry == null) return NotFound();
        enquiry.Status = dto.Status;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }
}
