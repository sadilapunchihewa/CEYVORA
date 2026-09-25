using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddMediaAndIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Normalize legacy slugs without deleting records. Abort atomically if collisions exist.
            migrationBuilder.Sql("""
                DO $$
                BEGIN
                    IF EXISTS (SELECT 1 FROM "Destinations" GROUP BY lower(btrim("Slug")) HAVING count(*) > 1)
                       OR EXISTS (SELECT 1 FROM "TourPackages" GROUP BY lower(btrim("Slug")) HAVING count(*) > 1) THEN
                        RAISE EXCEPTION 'Resolve duplicate normalized slugs before applying AddMediaAndIndexes.';
                    END IF;
                    IF EXISTS (SELECT 1 FROM "Destinations" WHERE lower(btrim("Slug")) !~ '^[a-z0-9]+(-[a-z0-9]+)*$')
                       OR EXISTS (SELECT 1 FROM "TourPackages" WHERE lower(btrim("Slug")) !~ '^[a-z0-9]+(-[a-z0-9]+)*$') THEN
                        RAISE EXCEPTION 'Resolve invalid legacy slugs before applying AddMediaAndIndexes.';
                    END IF;
                END $$;
                UPDATE "Destinations" SET "Slug" = lower(btrim("Slug")) WHERE "Slug" <> lower(btrim("Slug"));
                UPDATE "TourPackages" SET "Slug" = lower(btrim("Slug")) WHERE "Slug" <> lower(btrim("Slug"));
                """);
            migrationBuilder.AddColumn<int>(
                name: "VisitOrder",
                table: "PackageDestinations",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_TourPackages_Slug",
                table: "TourPackages",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Enquiries_Status",
                table: "Enquiries",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Destinations_Slug",
                table: "Destinations",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_Status",
                table: "Bookings",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_TravelDate",
                table: "Bookings",
                column: "TravelDate");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TourPackages_Slug",
                table: "TourPackages");

            migrationBuilder.DropIndex(
                name: "IX_Enquiries_Status",
                table: "Enquiries");

            migrationBuilder.DropIndex(
                name: "IX_Destinations_Slug",
                table: "Destinations");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_Status",
                table: "Bookings");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_TravelDate",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "VisitOrder",
                table: "PackageDestinations");
        }
    }
}
