using backend.Data;
using backend.DTOs;
using backend.DTOs.Common;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController, Route("api/destinations")]
public class DestinationsController(AppDbContext db, DetailsService details, IFileService files) : ControllerBase
{
    [HttpGet, AllowAnonymous]
    public async Task<IActionResult> All([FromQuery] DestinationQuery filter, CancellationToken ct, [FromQuery] bool includeInactive = false)
    {
        var query = db.Destinations.AsNoTracking();
        if (!includeInactive || !User.IsInRole(Roles.Admin)) query = query.Where(x => x.IsActive);
        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var pattern = SearchHelper.Pattern(filter.Search);
            query = query.Where(x => EF.Functions.ILike(x.Name, pattern) ||
                EF.Functions.ILike(x.ShortDescription, pattern) ||
                (x.District != null && EF.Functions.ILike(x.District, pattern)) ||
                (x.Province != null && EF.Functions.ILike(x.Province, pattern)));
        }
        if (!string.IsNullOrWhiteSpace(filter.Province))
        {
            var province = filter.Province.Trim().ToLowerInvariant();
            query = query.Where(x => x.Province != null && x.Province.ToLower() == province);
        }
        if (!string.IsNullOrWhiteSpace(filter.District))
        {
            var district = filter.District.Trim().ToLowerInvariant();
            query = query.Where(x => x.District != null && x.District.ToLower() == district);
        }
        if (filter.Featured.HasValue) query = query.Where(x => x.IsFeatured == filter.Featured.Value);
        return Ok(await query.OrderBy(x => x.Name).ThenBy(x => x.Id)
            .Select(DtoMappings.Destination).ToPageAsync(filter, ct));
    }

    [HttpGet("{id:int}"), AllowAnonymous]
    public async Task<IActionResult> Get(int id, CancellationToken ct, [FromQuery] bool includeInactive = false)
    {
        var item = await db.Destinations.AsNoTracking().Where(x => x.Id == id && (x.IsActive || (includeInactive && User.IsInRole(Roles.Admin))))
            .Select(DtoMappings.Destination).SingleOrDefaultAsync(ct);
        return item == null ? NotFound() : Ok(await details.DestinationAsync(item, ct));
    }

    [HttpGet("slug/{slug}"), AllowAnonymous]
    public async Task<IActionResult> BySlug(string slug, CancellationToken ct)
    {
        slug = SlugHelper.Normalize(slug);
        var item = await db.Destinations.AsNoTracking().Where(x => x.Slug == slug && x.IsActive)
            .Select(DtoMappings.Destination).SingleOrDefaultAsync(ct);
        return item == null ? NotFound() : Ok(await details.DestinationAsync(item, ct));
    }

    [HttpGet("featured"), AllowAnonymous]
    public async Task<IActionResult> Featured(CancellationToken ct) =>
        Ok(await db.Destinations.AsNoTracking().Where(x => x.IsActive && x.IsFeatured)
            .OrderBy(x => x.Name).ThenBy(x => x.Id).Select(DtoMappings.Destination).ToListAsync(ct));

    [HttpPost, Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Create(DestinationWriteDto dto, CancellationToken ct)
    {
        dto.Slug ??= SlugHelper.Generate(dto.Name);
        if (string.IsNullOrEmpty(dto.Slug))
            return BadRequest(new { message = "Supply a slug using lowercase Latin letters or digits." });
        if (await db.Destinations.AnyAsync(x => x.Slug == dto.Slug, ct))
            return Conflict(new { message = "Slug is already in use." });
        var item = new Destination();
        Apply(dto, item);
        db.Destinations.Add(item);
        await db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(Get), new { id = item.Id },
            await db.Destinations.AsNoTracking().Where(x => x.Id == item.Id).Select(DtoMappings.Destination).SingleAsync(ct));
    }

    [HttpPut("{id:int}"), Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Update(int id, DestinationWriteDto dto, CancellationToken ct)
    {
        var item = await db.Destinations.FindAsync(new object[] { id }, ct);
        if (item == null) return NotFound();
        // Omitted slug preserves existing links during edits.
        dto.Slug ??= item.Slug;
        if (await db.Destinations.AnyAsync(x => x.Slug == dto.Slug && x.Id != id, ct))
            return Conflict(new { message = "Slug is already in use." });
        var previousImage = item.ImageUrl;
        Apply(dto, item);
        await db.SaveChangesAsync(ct);
        if (previousImage != item.ImageUrl) await files.DeleteImageIfUnusedAsync(previousImage);
        return NoContent();
    }

    [HttpPost("{id:int}/image"), Authorize(Roles = Roles.Admin)]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(FileService.MaxRequestBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = FileService.MaxRequestBytes)]
    public async Task<IActionResult> UploadImage(int id, [FromForm] ImageUploadDto dto, CancellationToken ct)
    {
        var item = await db.Destinations.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, ct);
        if (item == null) return NotFound();
        var previousImage = item.ImageUrl;
        var imageUrl = await files.SaveImageAsync(dto.File, "destinations", ct);
        try
        {
            // Conditional update prevents simultaneous uploads overwriting each other silently.
            var updated = await db.Destinations.Where(x => x.Id == id && x.ImageUrl == previousImage)
                .ExecuteUpdateAsync(s => s.SetProperty(x => x.ImageUrl, imageUrl), ct);
            if (updated == 0)
            {
                await files.DeleteImageIfUnusedAsync(imageUrl);
                return Conflict(new { message = "Image changed. Reload and try again." });
            }
        }
        catch
        {
            await files.DeleteImageIfUnusedAsync(imageUrl);
            throw;
        }
        await files.DeleteImageIfUnusedAsync(previousImage);
        return Ok(new ImageUploadResponseDto(imageUrl));
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
        item.Name = dto.Name.Trim();
        item.Slug = dto.Slug!;
        item.ShortDescription = dto.ShortDescription.Trim();
        item.Description = dto.Description.Trim();
        item.District = dto.District;
        item.Province = dto.Province;
        item.ImageUrl = dto.ImageUrl;
        item.IsFeatured = dto.IsFeatured;
        item.IsActive = dto.IsActive;
    }
}

