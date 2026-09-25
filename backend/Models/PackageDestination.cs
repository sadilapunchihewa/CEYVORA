namespace backend.Models;

public class PackageDestination
{
    public int TourPackageId { get; set; }
    public TourPackage TourPackage { get; set; } = null!;
    public int DestinationId { get; set; }
    public int VisitOrder { get; set; }
    public Destination Destination { get; set; } = null!;
}
