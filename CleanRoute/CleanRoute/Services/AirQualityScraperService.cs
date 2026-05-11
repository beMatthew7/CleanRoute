using System.Diagnostics;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Hosting;

namespace CleanRoute.Services;

public class AirQualityScraperService : BackgroundService
{
    private readonly ILogger<AirQualityScraperService> _logger;
    private readonly string _scraperPath;
    
    public AirQualityScraperService(ILogger<AirQualityScraperService> logger, IWebHostEnvironment env)
    {
        _logger = logger;
        _scraperPath = Path.Combine(env.ContentRootPath, "Scraper", "scraper.js");
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("AirQualityScraperService has started. It will run every 5 minutes.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                RunScraper();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error running the air quality scraper.");
            }

            // Wait 5 minutes until the next run
            await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
        }
    }

    private void RunScraper()
    {
        _logger.LogInformation("Starting Node.js Puppeteer scraper...");

        var processInfo = new ProcessStartInfo
        {
            FileName = "node",
            Arguments = $"\"{_scraperPath}\"",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        using var process = new Process { StartInfo = processInfo };
        
        process.Start();
        
        var output = process.StandardOutput.ReadToEnd();
        var error = process.StandardError.ReadToEnd();
        
        process.WaitForExit();

        if (!string.IsNullOrEmpty(output))
        {
            _logger.LogInformation("Scraper Output: {Output}", output);
        }

        if (process.ExitCode != 0)
        {
            _logger.LogError("Scraper finished with error code {ExitCode}. Error: {Error}", process.ExitCode, error);
        }
    }
}
