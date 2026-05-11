using System.Globalization;
using System.Text.Json;
using System.IO;
using Microsoft.AspNetCore.Hosting;
using CleanRoute.Domain;
namespace CleanRoute.Repository;

public class AirQualityRepository : IAirQualityRepository
{
    private readonly HttpClient _http;
    private readonly string _token;
    private readonly string _scraperPath;

    public AirQualityRepository(HttpClient http, IConfiguration config, IWebHostEnvironment env)
    {
        _http = http;
        _token = config["AirQualityOpenDataPlatform:Token"] ?? "";
        _scraperPath = Path.Combine(env.ContentRootPath, "Scraper", "date_aer.json");
    }

    public async Task<AirQualityData?> GetByCoordinatesAsync(double lat, double lon)
    {
        var latStr = lat.ToString("F6", CultureInfo.InvariantCulture);
        var lonStr = lon.ToString("F6", CultureInfo.InvariantCulture);
        
        var url = $"https://api.waqi.info/feed/geo:{latStr};{lonStr}/?token={_token}";

        var response = await _http.GetAsync(url);
        var content = await response.Content.ReadAsStringAsync();

        var json = JsonDocument.Parse(content).RootElement;

        if (json.GetProperty("status").GetString() != "ok")
            return null;

        var data = json.GetProperty("data");
        var city = data.GetProperty("city");
        var geo = city.GetProperty("geo");
        var iaqi = data.GetProperty("iaqi");

        return new AirQualityData
        {
            Aqi = data.GetProperty("aqi").GetInt32(),
            StationName = city.GetProperty("name").GetString() ?? "",
            Lat = geo[0].GetDouble(),
            Lon = geo[1].GetDouble(),
            Pm25 = GetIaqiValue(iaqi, "pm25"),
            Pm10 = GetIaqiValue(iaqi, "pm10"),
            No2 = GetIaqiValue(iaqi, "no2"),
            O3 = GetIaqiValue(iaqi, "o3"),
            MeasuredAt = data.GetProperty("time").GetProperty("s").GetString() ?? ""
        };
    }

    private double? GetIaqiValue(JsonElement iaqi, string key)
    {
        if (iaqi.TryGetProperty(key, out var prop))
            return prop.GetProperty("v").GetDouble();
        return null;
    }
    public async Task<List<AirQualityData>> GetByBoundsAsync(double lat1, double lon1, double lat2, double lon2)
    {
        var result = new List<AirQualityData>();

        if (!File.Exists(_scraperPath))
            return result;

        var content = await File.ReadAllTextAsync(_scraperPath);
        var json = JsonDocument.Parse(content).RootElement;

        if (!json.TryGetProperty("data", out var dataArray))
            return result;

        double minLat = Math.Min(lat1, lat2);
        double maxLat = Math.Max(lat1, lat2);
        double minLon = Math.Min(lon1, lon2);
        double maxLon = Math.Max(lon1, lon2);

        foreach (var station in dataArray.EnumerateArray())
        {
            if (!station.TryGetProperty("g", out var coords) || coords.GetArrayLength() < 2) continue;

            double lat = coords[0].GetDouble();
            double lon = coords[1].GetDouble();

            // Check if the station is in the bounding box
            if (lat < minLat || lat > maxLat || lon < minLon || lon > maxLon) continue;

            int aqi = 0;
            if (station.TryGetProperty("a", out var aqiProp))
            {
                if (aqiProp.ValueKind == JsonValueKind.Number)
                    aqi = aqiProp.GetInt32();
                else if (int.TryParse(aqiProp.GetString(), out var parsed))
                    aqi = parsed;
            }

            var measuredAt = "-";
            if (station.TryGetProperty("u", out var uProp) && uProp.ValueKind == JsonValueKind.Number)
            {
                var dt = DateTimeOffset.FromUnixTimeSeconds(uProp.GetInt64()).ToLocalTime();
                measuredAt = dt.ToString("HH:mm:ss");
            }

            result.Add(new AirQualityData
            {
                Aqi = aqi,
                StationName = station.TryGetProperty("n", out var n) ? n.GetString() ?? "" : "",
                Lat = lat,
                Lon = lon,
                MeasuredAt = measuredAt
            });
        }

        return result;
    }

    public async Task<List<AirQualityData>> GetAllAsync()
    {
        var result = new List<AirQualityData>();

        if (!File.Exists(_scraperPath))
            return result;

        var content = await File.ReadAllTextAsync(_scraperPath);
        var json = JsonDocument.Parse(content).RootElement;

        if (!json.TryGetProperty("data", out var dataArray))
            return result;

        foreach (var station in dataArray.EnumerateArray())
        {
            if (!station.TryGetProperty("g", out var coords) || coords.GetArrayLength() < 2) continue;

            double lat = coords[0].GetDouble();
            double lon = coords[1].GetDouble();

            int aqi = 0;
            if (station.TryGetProperty("a", out var aqiProp))
            {
                if (aqiProp.ValueKind == JsonValueKind.Number)
                    aqi = aqiProp.GetInt32();
                else if (int.TryParse(aqiProp.GetString(), out var parsed))
                    aqi = parsed;
            }

            result.Add(new AirQualityData
            {
                Aqi = aqi,
                StationName = station.TryGetProperty("n", out var n) ? n.GetString() ?? "" : "",
                Lat = lat,
                Lon = lon
            });
        }

        return result;
    }
}