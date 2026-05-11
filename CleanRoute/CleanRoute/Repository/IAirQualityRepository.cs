using CleanRoute.Domain;

namespace CleanRoute.Repository;

public interface IAirQualityRepository
{
    Task<AirQualityData?> GetByCoordinatesAsync(double lat, double lon);
    Task<List<AirQualityData>> GetByBoundsAsync(double lat1, double lon1, double lat2, double lon2);
    Task<List<AirQualityData>> GetAllAsync();
}