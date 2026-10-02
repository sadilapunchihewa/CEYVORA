using System.ComponentModel.DataAnnotations;
using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace backend.Controllers;

[ApiController, Route("api/tourpackages/{packageId:int}/destinations")]
public class PackageDestinationsController(AppDbContext db) : ControllerBase
{
    [HttpGet, AllowAnonymous]
    public async Task<IActionResult> Get(int packageId, CancellationToken ct, [FromQuery] bool includeInactive = false)
    {
        if (!await db.TourPackages.AnyAsync(p => p.Id == packageId && (p.IsActive || (includeInactive && User.IsInRole(Roles.Admin))), ct)) return NotFound();
        return Ok(await db.PackageDestinations.AsNoTracking()
            .Where(p => p.TourPackageId == packageId && (p.Destination.IsActive || (includeInactive && User.IsInRole(Roles.Admin))))
            .OrderBy(p => p.VisitOrder).ThenBy(p => p.DestinationId).Select(p => p.Destination).Select(DtoMappings.Destination).ToListAsync(ct));
    }

    [HttpPost("{destinationId:int}"), Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Attach(int packageId, int destinationId, CancellationToken ct,
        [FromQuery, Range(0, 10000)] int visitOrder = 0)
    {
        if (!await db.TourPackages.AnyAsync(p => p.Id == packageId, ct) ||
            !await db.Destinations.AnyAsync(d => d.Id == destinationId, ct)) return NotFound();
        if (await db.PackageDestinations.AnyAsync(p => p.TourPackageId == packageId && p.DestinationId == destinationId, ct))
            return Conflict(new { message = "Destination is already attached." });
        db.PackageDestinations.Add(new PackageDestination { TourPackageId = packageId, DestinationId = destinationId, VisitOrder = visitOrder });
        try { await db.SaveChangesAsync(ct); }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException
            { SqlState: PostgresErrorCodes.UniqueViolation })
        { return Conflict(new { message = "Destination is already attached." }); }
        return NoContent();
    }

    [HttpPut("{destinationId:int}/order"), Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> UpdateOrder(int packageId, int destinationId, VisitOrderDto dto, CancellationToken ct)
    {
        var item = await db.PackageDestinations.FindAsync(new object[] { packageId, destinationId }, ct);
        if (item == null) return NotFound();
        item.VisitOrder = dto.VisitOrder;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpDelete("{destinationId:int}"), Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Remove(int packageId, int destinationId, CancellationToken ct)
    {
        var item = await db.PackageDestinations.FindAsync(new object[] { packageId, destinationId }, ct);
        if (item == null) return NotFound();
        db.PackageDestinations.Remove(item);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }
}

