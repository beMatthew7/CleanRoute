namespace CleanRoute.Data;

public class LoopRouteRequest
{
    public required double[] Start { get; set; } // [lon, lat]
    public double DistanceInKm { get; set; } = 5.0;
    public string Profile { get; set; } = "foot-walking";
}
