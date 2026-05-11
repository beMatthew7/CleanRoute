namespace CleanRoute.Repository;
using System.Globalization;
public class OrsRouteRepository : IRouteRepository
{
    private readonly HttpClient _http;
    private readonly string? _apiKey;

    public OrsRouteRepository(HttpClient http, IConfiguration config)
    {
        _http = http;
        _apiKey = config["OpenRouteService:ApiKey"];
    }

    public async Task<string> GetRouteGeoJsonAsync(double[] start, double[] end)
    {
        var url = "https://api.openrouteservice.org/v2/directions/foot-walking/geojson";

        var payload = new
        {
            coordinates = new[] { start, end },
            alternative_routes = new
            {
                target_count = 3,
                weight_factor = 2.0,
                share_factor = 0.8
            }
        };

        var jsonPayload = System.Text.Json.JsonSerializer.Serialize(payload);
        
        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", _apiKey ?? "");
        request.Content = new StringContent(jsonPayload, System.Text.Encoding.UTF8);
        request.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/json");

        try
        {
            var response = await _http.SendAsync(request);
            var content = await response.Content.ReadAsStringAsync();
            
            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"OpenRouteService error {response.StatusCode}: {content}");
            }
            
            return content;
        }
        catch (Exception ex)
        {
            throw new Exception($"Failed to get route from OpenRouteService: {ex.Message}", ex);
        }
    }

    public async Task<string> GetLoopRouteGeoJsonAsync(double[][] coordinates, string profile = "foot-walking")
    {
        var url = $"https://api.openrouteservice.org/v2/directions/{profile}/geojson";

        var payload = new
        {
            coordinates = coordinates
        };

        var jsonPayload = System.Text.Json.JsonSerializer.Serialize(payload);
        
        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Add("Authorization", _apiKey ?? "");
        request.Content = new StringContent(jsonPayload, System.Text.Encoding.UTF8);
        request.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/json");

        try
        {
            var response = await _http.SendAsync(request);
            var content = await response.Content.ReadAsStringAsync();
            
            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"OpenRouteService error {response.StatusCode}: {content}");
            }
            
            return content;
        }
        catch (Exception ex)
        {
            throw new Exception($"Failed to get loop route from OpenRouteService: {ex.Message}", ex);
        }
    }
}