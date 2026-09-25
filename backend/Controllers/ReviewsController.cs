using System.Security.Claims;
using backend.Data;
using backend.DTOs;
using backend.DTOs.Common;
using backend.Services;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController, Route("api/reviews")]
public class ReviewsController(AppDbContext db) : ControllerBase
{
    [HttpPost, Authorize(Roles = Roles.Customer)]
    public async Task<IActionResult> Create(ReviewCreateDto dto, CancellationToken ct)
    {
        if (!await db.TourPackages.AnyAsync(p => p.Id == dto.TourPackageId && p.IsActive, ct))
            return NotFound();
        var userId = int.Parse(User.FindFirstValue("sub")!);
        var name = await db.Users.Where(u => u.Id == userId).Select(u => u.FullName).SingleAsync(ct);
        var review = new Review
        {
            TourPackageId = dto.TourPackageId, UserId = userId, CustomerName = name,
            Rating = dto.Rating, Comment = dto.Comment.Trim(), IsApproved = false
        };
        db.Reviews.Add(review);
        await db.SaveChangesAsync(ct);
        return StatusCode(StatusCodes.Status201Created,
            await db.Reviews.Where(r => r.Id == review.Id).Select(DtoMappings.Review).SingleAsync(ct));
    }

    [HttpGet("package/{packageId:int}"), AllowAnonymous]
    public async Task<IActionResult> Package(int packageId, CancellationToken ct)
    {
        if (!await db.TourPackages.AnyAsync(p => p.Id == packageId && p.IsActive, ct))
            return NotFound();
        return Ok(await db.Reviews.AsNoTracking().Where(r => r.TourPackageId == packageId && r.IsApproved)
            .OrderByDescending(r => r.CreatedAt).Select(DtoMappings.Review).ToListAsync(ct));
    }

    [HttpGet, Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> All([FromQuery] ReviewQuery filter, CancellationToken ct)
    {
        var query = db.Reviews.AsNoTracking();
        if (filter.Approved.HasValue) query = query.Where(r => r.IsApproved == filter.Approved.Value);
        if (filter.Rating.HasValue) query = query.Where(r => r.Rating == filter.Rating.Value);
        if (filter.PackageId.HasValue) query = query.Where(r => r.TourPackageId == filter.PackageId.Value);
        return Ok(await query.OrderByDescending(r => r.CreatedAt).ThenByDescending(r => r.Id)
            .Select(DtoMappings.Review).ToPageAsync(filter, ct));
    }

    [HttpPut("{id:int}/approve"), Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Approve(int id, CancellationToken ct)
    {
        var review = await db.Reviews.FindAsync(new object[] { id }, ct);
        if (review == null) return NotFound();
        review.IsApproved = true;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpDelete("{id:int}"), Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var review = await db.Reviews.FindAsync(new object[] { id }, ct);
        if (review == null) return NotFound();
        db.Reviews.Remove(review);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }
}
