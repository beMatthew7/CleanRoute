using CleanRoute.Client.Pages;
using CleanRoute.Components;
using CleanRoute.Data;
using CleanRoute.Repository;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddHttpClient();
builder.Services.AddScoped<IRouteRepository, OrsRouteRepository>();
builder.Services.AddScoped<IAirQualityRepository, AirQualityRepository>();
builder.Services.AddScoped<CleanRoute.Services.KrigingService>();
builder.Services.AddHostedService<CleanRoute.Services.AirQualityScraperService>();
// Add services to the container.
builder.Services.AddRazorComponents()
    .AddInteractiveWebAssemblyComponents();
builder.Logging.AddLog4Net("Properties/log4net.config");
var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    // Cerem un logger oficial pentru contextul aplicatiei
    var logger = services.GetRequiredService<ILogger<Program>>();
    
    try 
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        context.Database.EnsureCreated();
        logger.LogInformation("Baza de date a fost verificat/creata cu succes la pornire.");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Eroare critica la initializarea bazei de date!");
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseWebAssemblyDebugging();
}
else
{
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseStatusCodePagesWithReExecute("/not-found", createScopeForStatusCodePages: true);
app.UseHttpsRedirection();

app.UseAntiforgery();

app.MapStaticAssets();
app.MapRazorComponents<App>()
    .AddInteractiveWebAssemblyRenderMode()
    .AddAdditionalAssemblies(typeof(CleanRoute.Client._Imports).Assembly);

app.MapPost("/api/route/calculate", async (HttpContext ctx, IRouteRepository repo, IAirQualityRepository airRepo, CleanRoute.Services.KrigingService kriging) =>
{
    var body = await new StreamReader(ctx.Request.Body).ReadToEndAsync();
    
    var request = System.Text.Json.JsonSerializer.Deserialize<RouteRequest>(body, 
        new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
    
    var geoJsonStr = await repo.GetRouteGeoJsonAsync(request!.Start, request.End);
    
    // Parse GeoJSON to evaluate routes
    var stations = await airRepo.GetAllAsync();
    var node = System.Text.Json.Nodes.JsonNode.Parse(geoJsonStr);
    
    if (node?["features"] is System.Text.Json.Nodes.JsonArray features)
    {
        foreach (var feature in features)
        {
            var coords = feature?["geometry"]?["coordinates"] as System.Text.Json.Nodes.JsonArray;
            if (coords != null && coords.Count > 0)
            {
                double totalAqi = 0;
                int count = 0;
                
                // Evaluate 1 in 20 points (for performance)
                int step = Math.Max(1, coords.Count / 20); 
                
                for (int i = 0; i < coords.Count; i += step)
                {
                    var pt = coords[i] as System.Text.Json.Nodes.JsonArray;
                    if (pt != null && pt.Count >= 2)
                    {
                        double lon = pt[0]!.GetValue<double>();
                        double lat = pt[1]!.GetValue<double>();
                        
                        totalAqi += kriging.Interpolate(lat, lon, stations);
                        count++;
                    }
                }
                
                double avgAqi = count > 0 ? totalAqi / count : 0;
                
                // Insert average into route properties for frontend
                var props = feature?["properties"] as System.Text.Json.Nodes.JsonObject;
                if (props != null)
                {
                    props["aqi_score"] = Math.Round(avgAqi, 1);
                }
            }
        }
    }
    
    return Results.Content(node?.ToJsonString() ?? geoJsonStr, "application/json");
});

// Loop route endpoint: generates multiple candidate loop routes, scores by AQI, returns the best one
app.MapPost("/api/route/calculate-loop", async (HttpContext ctx, IRouteRepository repo, IAirQualityRepository airRepo, CleanRoute.Services.KrigingService kriging) =>
{
    var body = await new StreamReader(ctx.Request.Body).ReadToEndAsync();
    Console.WriteLine($"[calculate-loop] Received body: {body}");

    var opts = new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true };
    var request = System.Text.Json.JsonSerializer.Deserialize<LoopRouteRequest>(body, opts);

    if (request == null || request.Start == null || request.Start.Length < 2)
        return Results.BadRequest(new { message = "Invalid request. Need start=[lon,lat] and distanceInKm." });

    double startLon = request.Start[0];
    double startLat = request.Start[1];
    double distanceKm = request.DistanceInKm;
    string profile = request.Profile ?? "foot-walking";

    // Different radius multiplier depending on transport mode
    double radiusMultiplier = profile.Contains("cycling") ? 0.18 : 0.10;

    Console.WriteLine($"[calculate-loop] Start: lon={startLon}, lat={startLat}, distance={distanceKm}km, profile={profile}");

    string? bestRoute = null;
    double bestScore = double.MaxValue;
    double bestAqi = 50.0;
    var errors = new List<string>();

    // Generate 5 candidate loops with different angles
    double[] startAngles = { 0, 72, 144, 216, 288 };
    double currentRadiusMultiplier = radiusMultiplier;

    for (int i = 0; i < startAngles.Length; i++)
    {
        try
        {
            var waypoints = GenerateLoopWaypoints(startLon, startLat, distanceKm, startAngles[i], currentRadiusMultiplier);
            Console.WriteLine($"[calculate-loop] Candidate {i+1}: {waypoints.Length} waypoints, radiusMult={currentRadiusMultiplier:F3}");

            var geojson = await repo.GetLoopRouteGeoJsonAsync(waypoints, profile);
            Console.WriteLine($"[calculate-loop] Candidate {i+1}: ORS returned successfully");

            var doc = System.Text.Json.JsonDocument.Parse(geojson);
            if (!doc.RootElement.TryGetProperty("features", out var feats) || feats.GetArrayLength() == 0)
            {
                Console.WriteLine($"[calculate-loop] Candidate {i+1}: No features in response");
                continue;
            }

            double distance = 0;
            if (feats[0].TryGetProperty("properties", out var props) &&
                props.TryGetProperty("summary", out var summary) &&
                summary.TryGetProperty("distance", out var distProp))
            {
                distance = distProp.GetDouble();
            }

            // Auto-correction: adjust radius multiplier based on actual vs target distance
            double targetMeters = distanceKm * 1000;
            if (distance > 0)
            {
                double ratio = targetMeters / distance;
                currentRadiusMultiplier *= ratio;
                // Clamp to reasonable range
                currentRadiusMultiplier = Math.Clamp(currentRadiusMultiplier, 0.03, 0.5);
                Console.WriteLine($"[calculate-loop] Candidate {i+1}: actual={distance}m, target={targetMeters}m, ratio={ratio:F2}, newRadiusMult={currentRadiusMultiplier:F3}");
            }

            // Score using Kriging along the route
            var allStations = await airRepo.GetAllAsync();
            var node = System.Text.Json.Nodes.JsonNode.Parse(geojson);
            double totalAqi = 0;
            int aqiCount = 0;

            if (node?["features"] is System.Text.Json.Nodes.JsonArray featuresArr && featuresArr.Count > 0)
            {
                var coords = featuresArr[0]?["geometry"]?["coordinates"] as System.Text.Json.Nodes.JsonArray;
                if (coords != null && coords.Count > 0)
                {
                    int step = Math.Max(1, coords.Count / 20);
                    for (int j = 0; j < coords.Count; j += step)
                    {
                        var pt = coords[j] as System.Text.Json.Nodes.JsonArray;
                        if (pt != null && pt.Count >= 2)
                        {
                            double ptLon = pt[0]!.GetValue<double>();
                            double ptLat = pt[1]!.GetValue<double>();
                            totalAqi += kriging.Interpolate(ptLat, ptLon, allStations);
                            aqiCount++;
                        }
                    }
                }
            }

            double avgAqi = aqiCount > 0 ? totalAqi / aqiCount : 50.0;

            // Score = AQI + heavy penalty for distance deviation
            double distancePenalty = Math.Abs(distance - targetMeters) / 100.0;
            double score = avgAqi + distancePenalty;

            Console.WriteLine($"[calculate-loop] Candidate {i+1}: distance={distance}m, AQI={avgAqi:F1}, penalty={distancePenalty:F1}, score={score:F1}");

            if (score < bestScore)
            {
                bestScore = score;
                bestAqi = avgAqi;

                if (node?["features"] is System.Text.Json.Nodes.JsonArray fa && fa.Count > 0)
                {
                    if (fa[0]?["properties"] is System.Text.Json.Nodes.JsonObject p)
                    {
                        p["aqi_score"] = Math.Round(avgAqi, 1);
                    }
                }
                bestRoute = node?.ToJsonString();
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[calculate-loop] Candidate {i+1} FAILED: {ex.Message}");
            errors.Add($"Candidate {i+1}: {ex.Message}");
        }
    }

    if (bestRoute == null)
    {
        Console.WriteLine($"[calculate-loop] All candidates failed. Errors: {string.Join(" | ", errors)}");
        return Results.BadRequest(new { message = "Failed to generate a loop route.", errors });
    }

    Console.WriteLine($"[calculate-loop] Returning best route with AQI={bestAqi:F1}, score={bestScore:F1}");
    return Results.Content(bestRoute, "application/json");
});

// Helper: generate loop waypoints as a triangle around a center point
static double[][] GenerateLoopWaypoints(double centerLon, double centerLat, double distanceKm, double startAngleDeg, double radiusMultiplier)
{
    double radiusKm = distanceKm * radiusMultiplier;
    int numPoints = 3; // triangle shape — fewer points = less ORS zig-zag

    var waypoints = new List<double[]>();
    waypoints.Add(new[] { centerLon, centerLat }); // START

    for (int i = 0; i < numPoints; i++)
    {
        // Asymmetric angles for more natural routes (not a perfect equilateral)
        double angle = startAngleDeg + (360.0 / numPoints) * i;
        double angleRad = angle * Math.PI / 180.0;

        double latOffset = (radiusKm * Math.Cos(angleRad)) / 111.32;
        double lonOffset = (radiusKm * Math.Sin(angleRad)) / (111.32 * Math.Cos(centerLat * Math.PI / 180.0));

        waypoints.Add(new[] { centerLon + lonOffset, centerLat + latOffset });
    }

    waypoints.Add(new[] { centerLon, centerLat }); // back to START
    return waypoints.ToArray();
}



app.MapGet("/api/airquality/bounds", async (
    double lat1, double lon1, 
    double lat2, double lon2, 
    IAirQualityRepository repo) =>
{
    var stations = await repo.GetByBoundsAsync(lat1, lon1, lat2, lon2);
    return Results.Ok(stations);
});

app.MapGet("/api/airquality/estimate", async (
    double lat, double lon, 
    IAirQualityRepository repo,
    CleanRoute.Services.KrigingService kriging) =>
{
    var stations = await repo.GetAllAsync();
    var estimatedAqi = kriging.Interpolate(lat, lon, stations);
    return Results.Ok(new { aqi = Math.Round(estimatedAqi) });
});

app.Run();