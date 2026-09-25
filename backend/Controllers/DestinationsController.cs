using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController, Route("api/destinations")]
public class DestinationsController(AppDbContext db) : ControllerBase
{
    [HttpGet, AllowAnonymous]
    public async Task<IActionResult> All(CancellationToken ct) =>
        Ok(await db.Destinations.AsNoTracking().Where(x => x.IsActive).OrderBy(x => x.Name)
            .Select(DtoMappings.Destination).ToListAsync(ct));

    [HttpGet("{id:int}"), AllowAnonymous]
    public async Task<IActionResult> Get(int id, CancellationToken ct)
    {
        var item = await db.Destinations.AsNoTracking().Where(x => x.Id == id && x.IsActive)
            .Select(DtoMappings.Destination).SingleOrDefaultAsync(ct);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpGet("slug/{slug}"), AllowAnonymous]
    public async Task<IActionResult> BySlug(string slug, CancellationToken ct)
    {
        var item = await db.Destinations.AsNoTracking().Where(x => x.Slug == slug && x.IsActive)
            .Select(DtoMappings.Destination).FirstOrDefaultAsync(ct);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpGet("featured"), AllowAnonymous]
    public async Task<IActionResult> Featured(CancellationToken ct) =>
        Ok(await db.Destinations.AsNoTracking().Where(x => x.IsActive && x.IsFeatured)
            .OrderBy(x => x.Name).Select(DtoMappings.Destination).ToListAsync(ct));

    [HttpPost, Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Create(DestinationWriteDto dto, CancellationToken ct)
    {
        if (await db.Destinations.AnyAsync(x => x.Slug == dto.Slug, ct))
            return Conflict(new { message = "Slug is already in use." });
        var item = new Destination();
        Apply(dto, item);
        db.Destinations.Add(item);
        await db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(Get), new { id = item.Id },
            await db.Destinations.Where(x => x.Id == item.Id).Select(DtoMappings.Destination).SingleAsync(ct));
    }

    [HttpPut("{id:int}"), Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Update(int id, DestinationWriteDto dto, CancellationToken ct)
    {
        var item = await db.Destinations.FindAsync(new object[] { id }, ct);
        if (item == null) return NotFound();
        if (await db.Destinations.AnyAsync(x => x.Slug == dto.Slug && x.Id != id, ct))
            return Conflict(new { message = "Slug is already in use." });
        Apply(dto, item);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpDelete("{id:int}"), Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var item = await db.Destinations.FindAsync(new object[] { id }, ct);
        if (item == null) return NotFound();
        item.IsActive = false;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    private static void Apply(DestinationWriteDto dto, Destination item)
    {
        item.Name = dto.Name;
        item.Slug = dto.Slug;
        item.ShortDescription = dto.ShortDescription;
        item.Description = dto.Description;
        item.District = dto.District;
        item.Province = dto.Province;
        item.ImageUrl = dto.ImageUrl;
        item.IsFeatured = dto.IsFeatured;
        item.IsActive = dto.IsActive;
    }
}
