using backend.Data;
using backend.DTOs;
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
    public async Task<IActionResult> All(CancellationToken ct) =>
        Ok(await db.Enquiries.AsNoTracking().OrderByDescending(e => e.CreatedAt)
            .Select(DtoMappings.Enquiry).ToListAsync(ct));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id, CancellationToken ct)
    {
        var enquiry = await db.Enquiries.AsNoTracking().Where(e => e.Id == id)
            .Select(DtoMappings.Enquiry).SingleOrDefaultAsync(ct);
        return enquiry == null ? NotFound() : Ok(enquiry);
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
