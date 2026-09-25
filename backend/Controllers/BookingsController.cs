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

[ApiController, Route("api/bookings"), Authorize]
public class BookingsController(AppDbContext db) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create(BookingCreateDto dto, CancellationToken ct)
    {
        var userId = int.Parse(User.FindFirstValue("sub")!);
        var user = await db.Users.SingleAsync(u => u.Id == userId, ct);
        if (!await db.TourPackages.AnyAsync(p => p.Id == dto.TourPackageId && p.IsActive, ct))
            return NotFound();
        var booking = new Booking
        {
            UserId = userId, TourPackageId = dto.TourPackageId,
            CustomerName = user.FullName, Email = user.Email, Phone = dto.Phone.Trim(),
            Country = dto.Country?.Trim(), TravelDate = dto.TravelDate.UtcDateTime,
            Adults = dto.Adults, Children = dto.Children, SpecialRequests = dto.SpecialRequests?.Trim()
            // TotalAmount remains unset until a pricing workflow exists.
        };
        db.Bookings.Add(booking);
        await db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(MyBooking), new { id = booking.Id },
            await db.Bookings.Where(b => b.Id == booking.Id).Select(DtoMappings.Booking).SingleAsync(ct));
    }

    [HttpGet("my")]
    public async Task<IActionResult> MyBookings(CancellationToken ct)
    {
        var userId = int.Parse(User.FindFirstValue("sub")!);
        return Ok(await db.Bookings.AsNoTracking().Where(b => b.UserId == userId)
            .OrderByDescending(b => b.CreatedAt).Select(DtoMappings.Booking).ToListAsync(ct));
    }

    [HttpGet("my/{id:int}")]
    public async Task<IActionResult> MyBooking(int id, CancellationToken ct)
    {
        var userId = int.Parse(User.FindFirstValue("sub")!);
        var booking = await db.Bookings.AsNoTracking().Where(b => b.Id == id && b.UserId == userId)
            .Select(DtoMappings.Booking).SingleOrDefaultAsync(ct);
        return booking == null ? NotFound() : Ok(booking);
    }

    [HttpGet, Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> All([FromQuery] BookingQuery filter, CancellationToken ct)
    {
        var query = db.Bookings.AsNoTracking();
        if (filter.Status != null) query = query.Where(b => b.Status == filter.Status);
        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var pattern = SearchHelper.Pattern(filter.Search);
            query = query.Where(b => EF.Functions.ILike(b.CustomerName, pattern) || EF.Functions.ILike(b.Email, pattern));
        }
        if (filter.FromDate.HasValue)
        {
            var from = filter.FromDate.Value.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            query = query.Where(b => b.TravelDate >= from);
        }
        if (filter.ToDate.HasValue)
        {
            var to = filter.ToDate.Value.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);
            query = query.Where(b => b.TravelDate <= to);
        }
        return Ok(await query.OrderByDescending(b => b.CreatedAt).ThenByDescending(b => b.Id)
            .Select(DtoMappings.Booking).ToPageAsync(filter, ct));
    }

    [HttpGet("{id:int}"), Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Get(int id, CancellationToken ct)
    {
        var booking = await db.Bookings.AsNoTracking().Where(b => b.Id == id)
            .Select(DtoMappings.Booking).SingleOrDefaultAsync(ct);
        return booking == null ? NotFound() : Ok(booking);
    }

    [HttpPut("{id:int}/status"), Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Status(int id, BookingStatusDto dto, CancellationToken ct)
    {
        var booking = await db.Bookings.FindAsync(new object[] { id }, ct);
        if (booking == null) return NotFound();
        booking.Status = dto.Status;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }
}
