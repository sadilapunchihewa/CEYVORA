using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<Destination> Destinations { get; set; }

        public DbSet<TourPackage> TourPackages { get; set; }

        public DbSet<ItineraryDay> ItineraryDays { get; set; }

        public DbSet<Booking> Bookings { get; set; }

        public DbSet<Enquiry> Enquiries { get; set; }

        public DbSet<Review> Reviews { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<PackageDestination> PackageDestinations { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.Entity<Destination>().HasIndex(d => d.Slug).IsUnique();
            modelBuilder.Entity<TourPackage>().HasIndex(p => p.Slug).IsUnique();
            modelBuilder.Entity<Booking>().HasIndex(b => b.Status);
            modelBuilder.Entity<Booking>().HasIndex(b => b.TravelDate);
            modelBuilder.Entity<Enquiry>().HasIndex(e => e.Status);
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasIndex(u => u.Email).IsUnique();
                entity.Property(u => u.Email).HasMaxLength(254);
                entity.Property(u => u.FullName).HasMaxLength(150);
                entity.Property(u => u.Role).HasMaxLength(20);
                entity.ToTable(t => t.HasCheckConstraint("CK_Users_Role", "\"Role\" IN ('Customer', 'Admin')"));
            });
            modelBuilder.Entity<Booking>().HasOne(b => b.User).WithMany(u => u.Bookings)
                .HasForeignKey(b => b.UserId).OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<Review>().HasOne(r => r.User).WithMany(u => u.Reviews)
                .HasForeignKey(r => r.UserId).OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<Booking>().HasOne(b => b.TourPackage).WithMany()
                .HasForeignKey(b => b.TourPackageId).OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<Review>().HasOne(r => r.TourPackage).WithMany()
                .HasForeignKey(r => r.TourPackageId).OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<Enquiry>().HasOne(e => e.TourPackage).WithMany()
                .HasForeignKey(e => e.TourPackageId).OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<PackageDestination>(entity =>
            {
                entity.HasKey(p => new { p.TourPackageId, p.DestinationId });
                entity.HasOne(p => p.TourPackage).WithMany().HasForeignKey(p => p.TourPackageId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(p => p.Destination).WithMany().HasForeignKey(p => p.DestinationId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }
    }
}
