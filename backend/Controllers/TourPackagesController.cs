using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController, Route("api/tourpackages")]
public class TourPackagesController(AppDbContext db) : ControllerBase
{
    [HttpGet, AllowAnonymous]
    public async Task<IActionResult> All(CancellationToken ct) =>
        Ok(await db.TourPackages.AsNoTracking().Where(x => x.IsActive).OrderBy(x => x.Title)
            .Select(DtoMappings.TourPackage).ToListAsync(ct));

    [HttpGet("{id:int}"), AllowAnonymous]
    public async Task<IActionResult> Get(int id, CancellationToken ct)
    {
        var item = await db.TourPackages.AsNoTracking().Where(x => x.Id == id && x.IsActive)
            .Select(DtoMappings.TourPackage).SingleOrDefaultAsync(ct);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpGet("slug/{slug}"), AllowAnonymous]
    public async Task<IActionResult> BySlug(string slug, CancellationToken ct)
    {
        var item = await db.TourPackages.AsNoTracking().Where(x => x.Slug == slug && x.IsActive)
            .Select(DtoMappings.TourPackage).FirstOrDefaultAsync(ct);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpGet("featured"), AllowAnonymous]
    public async Task<IActionResult> Featured(CancellationToken ct) =>
        Ok(await db.TourPackages.AsNoTracking().Where(x => x.IsActive && x.IsFeatured)
            .OrderBy(x => x.Title).Select(DtoMappings.TourPackage).ToListAsync(ct));

    [HttpPost, Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Create(TourPackageWriteDto dto, CancellationToken ct)
    {
        if (await db.TourPackages.AnyAsync(x => x.Slug == dto.Slug, ct))
            return Conflict(new { message = "Slug is already in use." });
        var item = new TourPackage();
        Apply(dto, item);
        db.TourPackages.Add(item);
        await db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(Get), new { id = item.Id },
            await db.TourPackages.Where(x => x.Id == item.Id).Select(DtoMappings.TourPackage).SingleAsync(ct));
    }

    [HttpPut("{id:int}"), Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Update(int id, TourPackageWriteDto dto, CancellationToken ct)
    {
        var item = await db.TourPackages.FindAsync(new object[] { id }, ct);
        if (item == null) return NotFound();
        if (await db.TourPackages.AnyAsync(x => x.Slug == dto.Slug && x.Id != id, ct))
            return Conflict(new { message = "Slug is already in use." });
        Apply(dto, item);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpDelete("{id:int}"), Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var item = await db.TourPackages.FindAsync(new object[] { id }, ct);
        if (item == null) return NotFound();
        item.IsActive = false;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    private static void Apply(TourPackageWriteDto dto, TourPackage item)
    {
        item.Title = dto.Title;
        item.Slug = dto.Slug;
        item.ShortDescription = dto.ShortDescription;
        item.Description = dto.Description;
        item.DurationDays = dto.DurationDays;
        item.DurationNights = dto.DurationNights;
        item.StartingPrice = dto.StartingPrice;
        item.Currency = dto.Currency;
        item.HeroImageUrl = dto.HeroImageUrl;
        item.IsFeatured = dto.IsFeatured;
        item.IsActive = dto.IsActive;
    }
}
