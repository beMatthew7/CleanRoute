using System;
using System.Collections.Generic;
using System.Linq;
using MathNet.Numerics.LinearAlgebra;
using CleanRoute.Domain;

namespace CleanRoute.Services;

public class KrigingService
{
    // Variogram parameters
    private readonly double _nugget = 0.0;
    private readonly double _sill = 100.0;
    private readonly double _range = 10.0; // km

    private double Variogram(double distanceKm)
    {
        if (distanceKm == 0) return 0;
        return _nugget + _sill * (1.0 - Math.Exp(-distanceKm / _range));
    }

    public double Interpolate(double targetLat, double targetLon, List<AirQualityData> stations)
    {
        // Ensure we have data
        if (stations == null || !stations.Any()) return 0;

        // Full Kriging on thousands of stations would create a massive matrix.
        // Optimization: only take the 15 closest stations.
        var closestStations = stations
            .OrderBy(s => CalculateDistanceKm(targetLat, targetLon, s.Lat, s.Lon))
            .Take(15)
            .ToList();

        int n = closestStations.Count;
        
        // Create matrix A (n+1 x n+1) - variances between known points
        var A = Matrix<double>.Build.Dense(n + 1, n + 1);
        
        for (int i = 0; i < n; i++)
        {
            for (int j = 0; j < n; j++)
            {
                double dist = CalculateDistanceKm(closestStations[i].Lat, closestStations[i].Lon, 
                                                  closestStations[j].Lat, closestStations[j].Lon);
                A[i, j] = Variogram(dist);
            }
            A[i, n] = 1.0;
            A[n, i] = 1.0;
        }
        A[n, n] = 0.0;

        // Vector B - variances between known points and the target point
        var B = Vector<double>.Build.Dense(n + 1);
        for (int i = 0; i < n; i++)
        {
            double dist = CalculateDistanceKm(closestStations[i].Lat, closestStations[i].Lon, targetLat, targetLon);
            B[i] = Variogram(dist);
        }
        B[n] = 1.0;

        // Solve the system: Weights = A^(-1) * B
        var weights = A.Solve(B);

        // Estimated AQI = Sum(Weight * AQI)
        double estimatedAqi = 0;
        for (int i = 0; i < n; i++)
        {
            estimatedAqi += weights[i] * closestStations[i].Aqi;
        }

        // AQI cannot be negative
        return Math.Max(0, estimatedAqi);
    }

    // Haversine formula to calculate distance in kilometers on a sphere
    private double CalculateDistanceKm(double lat1, double lon1, double lat2, double lon2)
    {
        var R = 6371d; 
        var dLat = ToRadians(lat2 - lat1);
        var dLon = ToRadians(lon2 - lon1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return R * c;
    }

    private double ToRadians(double angle) => Math.PI * angle / 180.0;
}
