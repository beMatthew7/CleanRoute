using CleanRoute.Data;
using CleanRoute.Repository;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace CleanRoute.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RouteController : ControllerBase
{
    private readonly IRouteRepository _routeService;
    private readonly IAirQualityRepository _airQualityService;

    public RouteController(IRouteRepository routeService, IAirQualityRepository airQualityService)
    {
        _routeService = routeService;
        _airQualityService = airQualityService;
    }

    [HttpPost("calculate")]
    public async Task<IActionResult> Calculate([FromBody] RouteRequest req)
    {
        var geojson = await _routeService.GetRouteGeoJsonAsync(req.Start, req.End);
        return Content(geojson, "application/json");
    }

    [HttpPost("calculate-loop")]
    public async Task<IActionResult> CalculateLoop([FromBody] LoopRouteRequest req)
    {
        Console.WriteLine($"[RouteController] Received calculate-loop request: Start=[{req.Start[0]}, {req.Start[1]}], Distance={req.DistanceInKm}km");
        
        double targetDistanceMeters = req.DistanceInKm * 1000;
        string? bestRoute = null;
        double bestScore = double.MaxValue;
        double finalAqi = 50.0;
        List<string> errors = new List<string>();

        for (int i = 1; i <= 5; i++)
        {
            try
            {
                var waypoints = GenerateLoopWaypoints(req.Start, req.DistanceInKm, seed: i * 1337);
                Console.WriteLine($"[RouteController] Iteration {i}: Requesting ORS with {waypoints.Length} waypoints.");
                
                var geojson = await _routeService.GetLoopRouteGeoJsonAsync(waypoints);
                Console.WriteLine($"[RouteController] Iteration {i}: ORS success.");
                
                var doc = JsonDocument.Parse(geojson);
                var features = doc.RootElement.GetProperty("features");
                if (features.GetArrayLength() == 0) continue;
                
                var properties = features[0].GetProperty("properties");
                double distance = properties.GetProperty("summary").GetProperty("distance").GetDouble();
                
                var bbox = GetBoundingBoxFromGeoJson(geojson);
                var stations = await _airQualityService.GetByBoundsAsync(bbox.MinLat, bbox.MinLon, bbox.MaxLat, bbox.MaxLon);
                double avgAqi = stations.Count > 0 ? stations.Average(s => s.Aqi) : 50.0;

                // Penalty for distance deviation (e.g., 1 AQI point penalty per 100m deviation)
                double distancePenalty = Math.Abs(distance - targetDistanceMeters) / 100.0;
                double score = avgAqi + distancePenalty;

                Console.WriteLine($"[RouteController] Iteration {i}: Distance={distance}m, AQI={avgAqi}, Score={score}");

                if (score < bestScore)
                {
                    bestScore = score;
                    bestRoute = geojson;
                    finalAqi = avgAqi;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[RouteController] Iteration {i} failed: {ex.Message}");
                errors.Add(ex.Message);
            }
        }

        if (bestRoute == null)
        {
            Console.WriteLine("[RouteController] Failed to generate any route.");
            return BadRequest(new { message = "Failed to generate a loop route.", errors = errors });
        }

        try
        {
            var jsonNode = System.Text.Json.Nodes.JsonNode.Parse(bestRoute);
            if (jsonNode?["features"] is System.Text.Json.Nodes.JsonArray featuresArray && featuresArray.Count > 0)
            {
                if (featuresArray[0]?["properties"] is System.Text.Json.Nodes.JsonObject props)
                {
                    props["aqi_score"] = Math.Round(finalAqi, 1);
                }
            }
            bestRoute = jsonNode?.ToJsonString() ?? bestRoute;
        }
        catch { }

        return Content(bestRoute, "application/json");
    }

    private double[][] GenerateLoopWaypoints(double[] start, double distanceKm, int seed)
    {
        var random = new Random(seed);
        var waypoints = new List<double[]>();
        waypoints.Add(start);

        double radiusKm = distanceKm / (2.0 * Math.PI);
        int numPoints = random.Next(3, 5);
        double startAngle = random.NextDouble() * 360;

        for (int i = 0; i < numPoints; i++)
        {
            double angle = startAngle + (360.0 / numPoints) * i;
            double angleRad = angle * Math.PI / 180.0;

            double latOffset = (radiusKm * Math.Cos(angleRad)) / 111.32;
            double lonOffset = (radiusKm * Math.Sin(angleRad)) / (111.32 * Math.Cos(start[1] * Math.PI / 180.0));

            waypoints.Add(new[] { start[0] + lonOffset, start[1] + latOffset });
        }

        waypoints.Add(start);
        return waypoints.ToArray();
    }

    private (double MinLat, double MinLon, double MaxLat, double MaxLon) GetBoundingBoxFromGeoJson(string geojson)
    {
        var doc = JsonDocument.Parse(geojson);
        
        if (doc.RootElement.TryGetProperty("bbox", out var bbox) && bbox.GetArrayLength() == 4)
        {
            return (bbox[1].GetDouble(), bbox[0].GetDouble(), bbox[3].GetDouble(), bbox[2].GetDouble());
        }
        
        double minLat = double.MaxValue, minLon = double.MaxValue;
        double maxLat = double.MinValue, maxLon = double.MinValue;
        
        if (doc.RootElement.TryGetProperty("features", out var features) && features.GetArrayLength() > 0)
        {
            var coords = features[0].GetProperty("geometry").GetProperty("coordinates");
            foreach(var coord in coords.EnumerateArray())
            {
                var lon = coord[0].GetDouble();
                var lat = coord[1].GetDouble();
                if (lat < minLat) minLat = lat;
                if (lat > maxLat) maxLat = lat;
                if (lon < minLon) minLon = lon;
                if (lon > maxLon) maxLon = lon;
            }
        }
        return (minLat, minLon, maxLat, maxLon);
    }
}