namespace CleanRoute.Domain;

public class AirQualityData : Entity<long>
{
    //Real-time air quality information.
    public int Aqi { get; set; }
    public string StationName { get; set; } = "";
    public double Lat { get; set; }
    public double Lon { get; set; }
    public double? Pm25 { get; set; }
    public double? Pm10 { get; set; }
    public double? No2 { get; set; }
    public double? O3 { get; set; }
    public string MeasuredAt { get; set; } = "";
}