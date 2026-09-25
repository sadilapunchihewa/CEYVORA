using backend.Data;
using backend.DTOs;
using backend.DTOs.Common;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController, Route("api/tourpackages")]
public class TourPackagesController(AppDbContext db, DetailsService details, IFileService files) : ControllerBase
{
    [HttpGet, AllowAnonymous]
    public async Task<IActionResult> All([FromQuery] PackageQuery filter, CancellationToken ct)
    {
        var query = db.TourPackages.AsNoTracking().Where(x => x.IsActive);
        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var pattern = SearchHelper.Pattern(filter.Search);
            query = query.Where(x => EF.Functions.ILike(x.Title, pattern) ||
                EF.Functions.ILike(x.ShortDescription, pattern));
        }
        if (filter.MinPrice.HasValue) query = query.Where(x => x.StartingPrice >= filter.MinPrice.Value);
        if (filter.MaxPrice.HasValue) query = query.Where(x => x.StartingPrice <= filter.MaxPrice.Value);
        if (filter.MinDays.HasValue) query = query.Where(x => x.DurationDays >= filter.MinDays.Value);
        if (filter.MaxDays.HasValue) query = query.Where(x => x.DurationDays <= filter.MaxDays.Value);
        if (filter.Featured.HasValue) query = query.Where(x => x.IsFeatured == filter.Featured.Value);
        if (filter.DestinationId.HasValue)
            query = query.Where(x => db.PackageDestinations.Any(d => d.TourPackageId == x.Id &&
                d.DestinationId == filter.DestinationId.Value && d.Destination.IsActive));
        var sorted = filter.Sort switch
        {
            "price_asc" => query.OrderBy(x => x.StartingPrice).ThenBy(x => x.Id),
            "price_desc" => query.OrderByDescending(x => x.StartingPrice).ThenBy(x => x.Id),
            "duration_asc" => query.OrderBy(x => x.DurationDays).ThenBy(x => x.Id),
            "duration_desc" => query.OrderByDescending(x => x.DurationDays).ThenBy(x => x.Id),
            _ => query.OrderByDescending(x => x.CreatedAt).ThenByDescending(x => x.Id)
        };
        return Ok(await sorted.Select(DtoMappings.TourPackage).ToPageAsync(filter, ct));
    }

    [HttpGet("{id:int}"), AllowAnonymous]
    public async Task<IActionResult> Get(int id, CancellationToken ct)
    {
        var item = await db.TourPackages.AsNoTracking().Where(x => x.Id == id && x.IsActive)
            .Select(DtoMappings.TourPackage).SingleOrDefaultAsync(ct);
        return item == null ? NotFound() : Ok(await details.PackageAsync(item, ct));
    }

    [HttpGet("slug/{slug}"), AllowAnonymous]
    public async Task<IActionResult> BySlug(string slug, CancellationToken ct)
    {
        slug = SlugHelper.Normalize(slug);
        var item = await db.TourPackages.AsNoTracking().Where(x => x.Slug == slug && x.IsActive)
            .Select(DtoMappings.TourPackage).SingleOrDefaultAsync(ct);
        return item == null ? NotFound() : Ok(await details.PackageAsync(item, ct));
    }

    [HttpGet("featured"), AllowAnonymous]
    public async Task<IActionResult> Featured(CancellationToken ct) =>
        Ok(await db.TourPackages.AsNoTracking().Where(x => x.IsActive && x.IsFeatured)
            .OrderBy(x => x.Title).ThenBy(x => x.Id).Select(DtoMappings.TourPackage).ToListAsync(ct));

    [HttpPost, Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Create(TourPackageWriteDto dto, CancellationToken ct)
    {
        dto.Slug ??= SlugHelper.Generate(dto.Title);
        if (string.IsNullOrEmpty(dto.Slug))
            return BadRequest(new { message = "Supply a slug using lowercase Latin letters or digits." });
        if (await db.TourPackages.AnyAsync(x => x.Slug == dto.Slug, ct))
            return Conflict(new { message = "Slug is already in use." });
        var item = new TourPackage();
        Apply(dto, item);
        db.TourPackages.Add(item);
        await db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(Get), new { id = item.Id },
            await db.TourPackages.AsNoTracking().Where(x => x.Id == item.Id).Select(DtoMappings.TourPackage).SingleAsync(ct));
    }

    [HttpPut("{id:int}"), Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Update(int id, TourPackageWriteDto dto, CancellationToken ct)
    {
        var item = await db.TourPackages.FindAsync(new object[] { id }, ct);
        if (item == null) return NotFound();
        // Omitted slug preserves existing links during edits.
        dto.Slug ??= item.Slug;
        if (await db.TourPackages.AnyAsync(x => x.Slug == dto.Slug && x.Id != id, ct))
            return Conflict(new { message = "Slug is already in use." });
        if (await db.ItineraryDays.AnyAsync(i => i.TourPackageId == id && i.DayNumber > dto.DurationDays, ct))
            return BadRequest(new { message = "Duration cannot exclude existing itinerary days." });
        var previousImage = item.HeroImageUrl;
        Apply(dto, item);
        await db.SaveChangesAsync(ct);
        if (previousImage != item.HeroImageUrl) await files.DeleteImageIfUnusedAsync(previousImage);
        return NoContent();
    }

    [HttpPost("{id:int}/image"), Authorize(Roles = Roles.Admin)]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(FileService.MaxRequestBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = FileService.MaxRequestBytes)]
    public async Task<IActionResult> UploadImage(int id, [FromForm] ImageUploadDto dto, CancellationToken ct)
    {
        var item = await db.TourPackages.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, ct);
        if (item == null) return NotFound();
        var previousImage = item.HeroImageUrl;
        var imageUrl = await files.SaveImageAsync(dto.File, "packages", ct);
        try
        {
            // Conditional update prevents simultaneous uploads overwriting each other silently.
            var updated = await db.TourPackages.Where(x => x.Id == id && x.HeroImageUrl == previousImage)
                .ExecuteUpdateAsync(s => s.SetProperty(x => x.HeroImageUrl, imageUrl), ct);
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
        var item = await db.TourPackages.FindAsync(new object[] { id }, ct);
        if (item == null) return NotFound();
        item.IsActive = false;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    private static void Apply(TourPackageWriteDto dto, TourPackage item)
    {
        item.Title = dto.Title.Trim();
        item.Slug = dto.Slug!;
        item.ShortDescription = dto.ShortDescription.Trim();
        item.Description = dto.Description.Trim();
        item.DurationDays = dto.DurationDays;
        item.DurationNights = dto.DurationNights;
        item.StartingPrice = dto.StartingPrice;
        item.Currency = dto.Currency;
        item.HeroImageUrl = dto.HeroImageUrl;
        item.IsFeatured = dto.IsFeatured;
        item.IsActive = dto.IsActive;
    }
}
