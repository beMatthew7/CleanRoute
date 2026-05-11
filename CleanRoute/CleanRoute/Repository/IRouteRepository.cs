namespace CleanRoute.Repository;

public interface IRouteRepository
{
    Task<string> GetRouteGeoJsonAsync(double[] start, double[] end);
    Task<string> GetLoopRouteGeoJsonAsync(double[][] coordinates, string profile = "foot-walking");
}