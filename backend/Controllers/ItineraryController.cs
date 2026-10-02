using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
public class ItineraryController(AppDbContext db) : ControllerBase
{
    [HttpGet("api/tourpackages/{packageId:int}/itinerary"), AllowAnonymous]
    public async Task<IActionResult> Get(int packageId, CancellationToken ct, [FromQuery] bool includeInactive = false)
    {
        if (!await db.TourPackages.AnyAsync(p => p.Id == packageId && (p.IsActive || (includeInactive && User.IsInRole(Roles.Admin))), ct)) return NotFound();
        return Ok(await db.ItineraryDays.AsNoTracking().Where(i => i.TourPackageId == packageId)
            .OrderBy(i => i.DayNumber).Select(DtoMappings.Itinerary).ToListAsync(ct));
    }

    [HttpPost("api/tourpackages/{packageId:int}/itinerary"), Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Create(int packageId, ItineraryWriteDto dto, CancellationToken ct)
    {
        var package = await db.TourPackages.FindAsync(new object[] { packageId }, ct);
        if (package == null) return NotFound();
        if (dto.DayNumber > package.DurationDays) return BadRequest(new { message = "Day exceeds package duration." });
        if (await db.ItineraryDays.AnyAsync(i => i.TourPackageId == packageId && i.DayNumber == dto.DayNumber, ct))
            return Conflict(new { message = "This itinerary day already exists." });
        var item = new ItineraryDay { TourPackageId = packageId };
        Apply(dto, item);
        db.ItineraryDays.Add(item);
        await db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(Get), new { packageId },
            await db.ItineraryDays.Where(i => i.Id == item.Id).Select(DtoMappings.Itinerary).SingleAsync(ct));
    }

    [HttpPut("api/itinerary/{id:int}"), Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Update(int id, ItineraryWriteDto dto, CancellationToken ct)
    {
        var item = await db.ItineraryDays.Include(i => i.TourPackage).SingleOrDefaultAsync(i => i.Id == id, ct);
        if (item == null) return NotFound();
        if (dto.DayNumber > item.TourPackage!.DurationDays) return BadRequest(new { message = "Day exceeds package duration." });
        if (await db.ItineraryDays.AnyAsync(i => i.TourPackageId == item.TourPackageId && i.DayNumber == dto.DayNumber && i.Id != id, ct))
            return Conflict(new { message = "This itinerary day already exists." });
        Apply(dto, item);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpDelete("api/itinerary/{id:int}"), Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var item = await db.ItineraryDays.FindAsync(new object[] { id }, ct);
        if (item == null) return NotFound();
        db.ItineraryDays.Remove(item);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    private static void Apply(ItineraryWriteDto dto, ItineraryDay item)
    {
        item.DayNumber = dto.DayNumber;
        item.Title = dto.Title;
        item.Description = dto.Description;
        item.Accommodation = dto.Accommodation;
        item.Meals = dto.Meals;
    }
}

