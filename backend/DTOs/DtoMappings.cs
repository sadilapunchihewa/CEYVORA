using System.Linq.Expressions;
using backend.Models;

namespace backend.DTOs;

// Expressions let EF select only API fields, without loading navigation properties or secrets.
public static class DtoMappings
{
    public static readonly Expression<Func<Destination, DestinationDto>> Destination = d => new(
        d.Id, d.Name, d.Slug, d.ShortDescription, d.Description, d.District, d.Province,
        d.ImageUrl, d.IsFeatured, d.IsActive, d.CreatedAt);
    public static readonly Expression<Func<TourPackage, TourPackageDto>> TourPackage = p => new(
        p.Id, p.Title, p.Slug, p.ShortDescription, p.Description, p.DurationDays, p.DurationNights,
        p.StartingPrice, p.Currency, p.HeroImageUrl, p.IsFeatured, p.IsActive, p.CreatedAt);
    public static readonly Expression<Func<ItineraryDay, ItineraryDto>> Itinerary = i => new(
        i.Id, i.TourPackageId, i.DayNumber, i.Title, i.Description, i.Accommodation, i.Meals);
    public static readonly Expression<Func<Booking, BookingDto>> Booking = b => new(
        b.Id, b.UserId, b.TourPackageId, b.CustomerName, b.Email, b.Phone, b.Country,
        b.TravelDate, b.Adults, b.Children, b.SpecialRequests, b.TotalAmount, b.Status, b.CreatedAt);
    public static readonly Expression<Func<Enquiry, EnquiryDto>> Enquiry = e => new(
        e.Id, e.TourPackageId, e.Name, e.Email, e.Phone, e.Country, e.ArrivalDate,
        e.NumberOfTravellers, e.Message, e.Status, e.CreatedAt);
    public static readonly Expression<Func<Review, ReviewDto>> Review = r => new(
        r.Id, r.TourPackageId, r.CustomerName, r.Rating, r.Comment, r.IsApproved, r.CreatedAt);
}
