namespace CleanRoute.Data;

public class RouteRequest
{
    public required double[] Start { get; set; } // [lon, lat]
    public required double[] End { get; set; }   // [lon, lat]
}