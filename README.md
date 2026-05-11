# CleanRoute

CleanRoute is a web-based urban navigation application that prioritizes pedestrian and cyclist health by generating routes with minimal exposure to air pollution. Rather than optimizing purely for distance or travel time, CleanRoute evaluates multiple candidate paths and selects those that traverse areas with the lowest Air Quality Index (AQI) values.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [How It Works](#how-it-works)
- [Prerequisites](#prerequisites)
- [Configuration](#configuration)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [License](#license)

---

## Overview

Urban air pollution varies significantly across short distances. A route that is 200 meters longer but avoids a congested intersection can substantially reduce a pedestrian's cumulative pollutant intake. CleanRoute makes this trade-off visible and actionable.

The application combines real-time air quality data from monitoring stations across Europe with geostatistical interpolation (Ordinary Kriging) to estimate pollution levels at any arbitrary point on the map. When a user requests a route, the backend generates multiple candidate paths via the OpenRouteService API, scores each one by sampling AQI values along its geometry, and presents the results ranked by air quality.

---

## Key Features

- **A-to-B routing with air quality scoring** -- Select two points on the map and receive up to three alternative walking or cycling routes, each annotated with an average AQI score computed via Kriging interpolation.

- **Circular (loop) route generation** -- Specify a starting point and a target distance. The system generates five candidate loops with different geometries, auto-corrects the radius to match the requested distance, and returns the loop with the best air quality profile.

- **Real-time air quality overlay** -- Monitoring station data is displayed directly on the map as color-coded markers (following the standard AQI color scale), with the option to toggle visibility.

- **Point-level AQI estimation** -- Click anywhere on the map to receive a Kriging-interpolated AQI estimate based on the nearest 15 monitoring stations.

- **User authentication and route persistence** -- Supabase-based authentication (email/password) allows users to save, view, and manage their routes.

- **Background data collection** -- A hosted background service runs a Puppeteer-based scraper every five minutes to refresh the local air quality dataset from the WAQI network.

- **Responsive design** -- The control panel adapts between a fixed side panel on desktop and a collapsible bottom sheet on mobile.

---

## Architecture

The application follows a layered architecture:

```
CleanRoute (Server - ASP.NET)
├── Controllers / Minimal API endpoints
├── Repository layer (IRouteRepository, IAirQualityRepository, IUserRepository)
├── Services (KrigingService, AirQualityScraperService)
├── Data (EF Core DbContext)
├── Domain (entity models)
└── Scraper (Node.js + Puppeteer)

CleanRoute.Client (Blazor WebAssembly)
├── Pages (Home, Login, MyRoutes)
├── Layout (MainLayout, NavMenu)
├── wwwroot/map.js (Leaflet map logic)
└── wwwroot/supabase-auth.js (client-side auth)
```

The server project hosts both the API backend and serves the Blazor WebAssembly client. Routing and air quality logic run server-side; authentication and route management are handled client-side via the Supabase JavaScript SDK.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Backend framework | ASP.NET (.NET 10), Blazor Server hosting |
| Frontend rendering | Blazor WebAssembly (interactive) |
| Database | PostgreSQL via Entity Framework Core + Npgsql |
| Map rendering | Leaflet.js with OpenStreetMap tiles |
| Routing engine | OpenRouteService API (walking and cycling profiles) |
| Air quality data | WAQI (World Air Quality Index) API + network scraping |
| Geostatistical interpolation | Ordinary Kriging (custom implementation using MathNet.Numerics) |
| Authentication and storage | Supabase (client-side JS SDK) |
| Web scraping | Node.js + Puppeteer |
| Logging | log4net |

---

## How It Works

### Route Scoring Pipeline

1. The user selects a start and end point (A-to-B) or a start point with a target distance (loop).
2. The server calls the OpenRouteService API to generate candidate routes as GeoJSON.
3. For each candidate route, the server samples coordinate points along the geometry (every 1-in-20 points for performance).
4. At each sampled point, the `KrigingService` performs Ordinary Kriging interpolation:
   - Selects the 15 closest monitoring stations.
   - Constructs the variogram matrix using an exponential model (nugget=0, sill=100, range=10km).
   - Solves the linear system to obtain interpolation weights.
   - Computes the weighted AQI estimate.
5. The average AQI across all sampled points becomes the route's `aqi_score`.
6. Routes are returned to the client with their AQI scores embedded in the GeoJSON properties.

### Loop Route Generation

For circular routes, the system:

1. Generates five candidate triangular waypoint patterns at evenly spaced starting angles (0, 72, 144, 216, 288 degrees).
2. Sends each set of waypoints to OpenRouteService to produce a routable loop.
3. Auto-corrects the radius multiplier based on the ratio between the actual and target distances.
4. Scores each loop by AQI (via Kriging) plus a distance deviation penalty.
5. Returns the best-scoring candidate.

### Air Quality Data Pipeline

- A `BackgroundService` (`AirQualityScraperService`) runs every five minutes.
- It invokes a Node.js Puppeteer script that opens a WAQI map page and intercepts the network response containing station data for the region.
- The intercepted JSON is saved to `Scraper/date_aer.json`.
- The `AirQualityRepository` reads this file to serve station data to the API and Kriging pipeline.

---

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Node.js](https://nodejs.org/) (v18 or later)
- [PostgreSQL](https://www.postgresql.org/) (v14 or later)
- [Google Chrome](https://www.google.com/chrome/) (used by Puppeteer for headless scraping)
- A [Supabase](https://supabase.com/) project (for authentication and route storage)

---

## Configuration

The application requires API keys for three external services. These must be configured in `CleanRoute/CleanRoute/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=CleanRouteDb;Username=YOUR_USERNAME;Password=YOUR_PASSWORD"
  },
  "OpenRouteService": {
    "ApiKey": "YOUR_OPENROUTESERVICE_API_KEY",
    "BaseUrl": "https://api.openrouteservice.org"
  },
  "AirQualityOpenDataPlatform": {
    "Token": "YOUR_WAQI_TOKEN"
  },
  "OpenAQ": {
    "ApiKey": "YOUR_OPENAQ_API_KEY"
  }
}
```

**Obtaining API keys:**

| Service | Registration URL | Notes |
|---|---|---|
| OpenRouteService | https://openrouteservice.org/dev/#/signup | Free tier supports 2,000 requests/day |
| WAQI | https://aqicn.org/data-platform/token/ | Free data feed token |
| OpenAQ | https://docs.openaq.org/ | Free API key |

**Supabase configuration:**

Edit `CleanRoute/CleanRoute.Client/wwwroot/supabase-auth.js` and replace the placeholder values:

```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
```

You will also need to create a `routes` table in your Supabase project:

```sql
CREATE TABLE routes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  distance_km NUMERIC,
  aqi_score NUMERIC,
  route_geojson JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own routes"
  ON routes FOR ALL
  USING (auth.uid() = user_id);
```

---

## Getting Started

1. **Clone the repository:**

   ```bash
   git clone https://github.com/YOUR_USERNAME/CleanRoute.git
   cd CleanRoute
   ```

2. **Install Puppeteer dependencies:**

   ```bash
   cd CleanRoute/CleanRoute/Scraper
   npm install
   cd ../../..
   ```

3. **Set up the database:**

   Create a PostgreSQL database named `CleanRouteDb` and update the connection string in `appsettings.json`. The application will create the required tables on first run via `EnsureCreated()`.

4. **Configure API keys:**

   Fill in the API keys as described in the [Configuration](#configuration) section.

5. **Run the application:**

   ```bash
   cd CleanRoute
   dotnet run --project CleanRoute/CleanRoute.csproj
   ```

   The application will be available at `https://localhost:5001` (or the port shown in the console output).

---

## Project Structure

```
CleanRoute/
├── CleanRoute.sln
├── .gitignore
├── README.md
└── CleanRoute/
    ├── CleanRoute/                     # Server project (ASP.NET)
    │   ├── Program.cs                  # Application entry point, minimal API endpoints
    │   ├── appsettings.json            # Configuration (API keys, connection strings)
    │   ├── Controllers/
    │   │   └── RouteController.cs      # Route calculation endpoints
    │   ├── Repository/
    │   │   ├── IRouteRepository.cs     # Route service interface
    │   │   ├── OrsRouteRepository.cs   # OpenRouteService implementation
    │   │   ├── IAirQualityRepository.cs
    │   │   ├── AirQualityRepository.cs # WAQI data access + scraper JSON parsing
    │   │   ├── IUserRepository.cs
    │   │   └── UserRepository.cs
    │   ├── Services/
    │   │   ├── KrigingService.cs       # Ordinary Kriging interpolation
    │   │   └── AirQualityScraperService.cs  # Background data refresh
    │   ├── Domain/
    │   │   ├── AirQualityData.cs       # Air quality entity
    │   │   ├── User.cs                 # User entity
    │   │   └── Entity.cs               # Base entity
    │   ├── Data/
    │   │   ├── ApplicationDbContext.cs # EF Core context
    │   │   ├── RouteRequest.cs         # A-to-B request DTO
    │   │   └── LoopRouteRequest.cs     # Loop route request DTO
    │   ├── Scraper/
    │   │   ├── scraper.js              # Puppeteer scraping script
    │   │   └── package.json
    │   └── Components/
    │       └── App.razor               # Root Blazor component
    └── CleanRoute.Client/              # Client project (Blazor WASM)
        ├── Pages/
        │   ├── Home.razor              # Main map page
        │   ├── Login.razor             # Authentication page
        │   └── MyRoutes.razor          # Saved routes management
        ├── Layout/
        │   ├── MainLayout.razor
        │   └── NavMenu.razor
        └── wwwroot/
            ├── map.js                  # Leaflet map initialization and route display
            └── supabase-auth.js        # Supabase client-side authentication
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/route/calculate` | Generate A-to-B routes with AQI scoring. Body: `{ "start": [lon, lat], "end": [lon, lat] }` |
| POST | `/api/route/calculate-loop` | Generate circular routes. Body: `{ "start": [lon, lat], "distanceInKm": 5, "profile": "foot-walking" }` |
| GET | `/api/airquality/bounds?lat1=...&lon1=...&lat2=...&lon2=...` | Retrieve air quality stations within a bounding box |
| GET | `/api/airquality/estimate?lat=...&lon=...` | Get Kriging-interpolated AQI estimate for a point |

---

## License

This project is provided for educational and personal use.
