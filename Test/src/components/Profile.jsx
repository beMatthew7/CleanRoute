import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import debounce from 'lodash.debounce';
import { getUserLocation, getAddressFromCoords } from '../utils/locationUtils';
import { SearchBar } from './map/SearchBar';
import { TransportControls } from './map/TransportControls';
import { AirQualityControl } from './map/AirQualityControl';
import { AirQualityLegend } from './map/AirQualityLegend';
import { getAQIColor, displayAirSensorsOnMap } from '../utils/airQualityUtils';

// Server API URL - update this to your actual server URL
const API_URL = 'http://localhost:5001/api';

const Profile = () => {
  // Core refs
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef({ start: null, end: null });
  const routeLayerRef = useRef(null);
  const airSensorsLayerRef = useRef(null);
  
  // Location states
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [startAddress, setStartAddress] = useState('');
  const [endAddress, setEndAddress] = useState('');
  
  // UI states
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [transportMode, setTransportMode] = useState('foot-walking');
  const [showAirSensors, setShowAirSensors] = useState(false);
  const [loadingAirSensors, setLoadingAirSensors] = useState(false);
  
  // Add new state for healthy routing
  const [useHealthyRoute, setUseHealthyRoute] = useState(false);
  const [loadingHealthyRoute, setLoadingHealthyRoute] = useState(false);
  const healthyRouteLayerRef = useRef(null);
  
  // Add a new state for route-specific matrix
  const [routeMatrixVisible, setRouteMatrixVisible] = useState(false);
  const routeMatrixLayerRef = useRef(null);
  
  // Initialize map
  useEffect(() => {
    mapInstance.current = L.map(mapRef.current).setView([46.77, 23.58], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance.current);
    
    initializeLocation();
    
    return () => {
      if (mapInstance.current) mapInstance.current.remove();
    };
  }, []);
  
  // Initialize user location
  const initializeLocation = async () => {
    try {
      const location = await getUserLocation(
        API_URL,
        handleLocationSuccess,
        handleLocationError,
        handleLocationFallback
      );
      setStart([location.lat, location.lng]);
    } catch (err) {
      console.error("Location initialization failed:", err);
      setError('Location services unavailable. Please enter your starting point manually.');
    }
  };
  
  // Location callbacks
  const handleLocationSuccess = (locationData) => {
    console.log(`Successfully got location from ${locationData.source}`);
    mapInstance.current.setView([locationData.lat, locationData.lng], 15);
    getAddressFromCoords(API_URL, locationData.lng, locationData.lat)
      .then(address => setStartAddress(address || 'Current Location'))
      .catch(() => setStartAddress('Current Location'));
  };
  
  const handleLocationError = (error) => {
    console.error("Location error:", error);
    setError('Could not determine your location. Please enter your starting point manually.');
    setTimeout(() => setError(''), 7000);
  };
  
  const handleLocationFallback = (fallbackData) => {
    console.log(`Using fallback location from ${fallbackData.source}`);
    mapInstance.current.setView([fallbackData.lat, fallbackData.lng], 13);
    setStartAddress(fallbackData.place_name || 'Default Location');
    setError('Could not determine your precise location. Using a default location instead.');
    setTimeout(() => setError(''), 5000);
  };
  
  // Handle markers when coordinates change
  useEffect(() => {
    updateMarker('start', start);
  }, [start]);
  
  useEffect(() => {
    updateMarker('end', end);
  }, [end]);
  
  // Update markers helper
  const updateMarker = (type, position) => {
    if (!position || !mapInstance.current) return;
    
    if (markersRef.current[type]) {
      markersRef.current[type].setLatLng(position);
    } else {
      const marker = L.marker(position, { draggable: true })
        .addTo(mapInstance.current)
        .bindPopup(type === 'start' ? "Start" : "End")
        .openPopup();
      
      marker.on('dragend', (e) => {
        const { lat, lng } = e.target.getLatLng();
        if (type === 'start') {
          setStart([lat, lng]);
          updateAddressFromCoords(lng, lat, setStartAddress);
        } else {
          setEnd([lat, lng]);
          updateAddressFromCoords(lng, lat, setEndAddress);
        }
      });
      
      markersRef.current[type] = marker;
    }
  };
  
  // Update address from coordinates
  const updateAddressFromCoords = async (lng, lat, setAddressFunc) => {
    try {
      const address = await fetchReverseGeocode(lng, lat);
      setAddressFunc(address);
    } catch (err) {
      console.error('Error getting address:', err);
    }
  };
  
  // Fetch route when start, end or transportMode changes
  useEffect(() => {
    if (start && end) fetchRoute();
  }, [start, end, transportMode]);
  
  // Map click handler for setting end point
  useEffect(() => {
    if (!mapInstance.current) return;
    
    const handleMapClick = (e) => {
      if (!end) {
        const { lat, lng } = e.latlng;
        setEnd([lat, lng]);
        updateAddressFromCoords(lng, lat, setEndAddress);
      }
    };
    
    mapInstance.current.on('click', handleMapClick);
    return () => {
      if (mapInstance.current) mapInstance.current.off('click', handleMapClick);
    };
  }, [end]);
  
  // Air quality sensors logic
  useEffect(() => {
    if (!mapInstance.current || !showAirSensors) return;
    
    const handleMapMove = debounce(() => fetchAirSensors(), 500);
    mapInstance.current.on('moveend', handleMapMove);
    
    fetchAirSensors();
    
    return () => {
      if (mapInstance.current) mapInstance.current.off('moveend', handleMapMove);
    };
  }, [mapInstance.current, showAirSensors]);

  // Add a useEffect to preserve routes when showing air quality
  useEffect(() => {
    // When air quality sensors are toggled, ensure the route remains visible if it exists
    if (routeLayerRef.current && mapInstance.current) {
      // Bring route layer to front
      routeLayerRef.current.bringToFront();
    }
  }, [showAirSensors]);

   // Add a new useEffect that resets the healthy route when start or end changes
  useEffect(() => {
    // Reset healthy route when start or end location is changed
    if (healthyRouteLayerRef.current) {
      mapInstance.current.removeLayer(healthyRouteLayerRef.current);
      healthyRouteLayerRef.current = null;
    }
    
    // Also reset any route-specific matrix
    if (routeMatrixLayerRef.current) {
      mapInstance.current.removeLayer(routeMatrixLayerRef.current);
      routeMatrixLayerRef.current = null;
      setRouteMatrixVisible(false);
    }
    
    // Reset the healthy route state
    setUseHealthyRoute(false);
    
  }, [start, end]); // This effect runs whenever start or end changes
  
  // Reset route points
  const resetPoints = () => {
    if (markersRef.current.start) {
      mapInstance.current.removeLayer(markersRef.current.start);
      markersRef.current.start = null;
    }
    if (markersRef.current.end) {
      mapInstance.current.removeLayer(markersRef.current.end);
      markersRef.current.end = null; 
    }
    if (routeLayerRef.current) {
      mapInstance.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    setEnd(null);
    setEndAddress('');
    setError('');
  };
  
  // Core data fetching functions
  const fetchReverseGeocode = async (lng, lat) => {
    try {
      const response = await axios.get(`${API_URL}/reverse-geocode`, {
        params: { lng, lat }
      });
      return response.data.place_name;
    } catch (err) {
      console.error('Error in reverse geocoding:', err);
      throw err;
    }
  };
  
  const fetchRoute = async () => {
    if (!start || !end) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Log coordinates for debugging
      console.log('Fetching route with coordinates:', {
        start: start,
        end: end,
        profile: transportMode
      });
      
      // Ensure coordinates are valid arrays
      if (!Array.isArray(start) || !Array.isArray(end) || start.length !== 2 || end.length !== 2) {
        throw new Error('Invalid coordinates format');
      }
      
      const response = await axios.post(`${API_URL}/directions`, {
        start,
        end,
        profile: transportMode
      }, {
        timeout: 20000 // Increase timeout to 20 seconds
      });
      console.log('Route response:', response.data);
      
      if (routeLayerRef.current) {
        mapInstance.current.removeLayer(routeLayerRef.current);
      }
      
      if (response.data && response.data.features && response.data.features.length > 0) {
        const routeCoordinates = response.data.features[0].geometry.coordinates;
        console.log('Route coordinates received:', routeCoordinates);

        // Add the route to the map
        routeLayerRef.current = L.geoJSON(response.data).addTo(mapInstance.current);
        
        // Style the route
        if (routeLayerRef.current) {
          routeLayerRef.current.setStyle({
            color: '#3388ff',
            weight: 6,
            opacity: 0.7
          });
          
          // Ensure route is above air quality markers
          routeLayerRef.current.bringToFront();
        }
        
        const bounds = routeLayerRef.current.getBounds();
        mapInstance.current.fitBounds(bounds, { padding: [30, 30] });
      } else {
        setError("No route found between these points.");
      }
    } catch (err) {
      console.error("Error fetching route:", err.response?.data || err.message);
      
      // Special handling for rate limit errors
      if (err.response?.status === 429) {
        setError("Service is busy. Please wait a minute and try again (API rate limit reached).");
      } else if (err.response?.data?.details?.error?.message) {
        setError(`Route error: ${err.response.data.details.error.message}`);
      } else {
        setError("Failed to fetch route. Please try different points or try again later.");
      }
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAirSensors = async () => {
    if (!mapInstance.current) return;
    
    setLoadingAirSensors(true);
    try {
      const bounds = mapInstance.current.getBounds();
      const params = {
        minLat: bounds.getSouth().toFixed(6),
        minLng: bounds.getWest().toFixed(6),
        maxLat: bounds.getNorth().toFixed(6),
        maxLng: bounds.getEast().toFixed(6)
      };
      
      const response = await axios.get(`${API_URL}/air-sensors`, {
        params: params,
        timeout: 10000
      });
      
      if (response.data) {
        // Log detailed information about each sensor to the console
        console.log('=== AIR QUALITY SENSORS ===');
        console.log('Total sensors found:', response.data.length);
        
        // Create a table in console for better readability
        console.table(
          response.data.map(sensor => ({
            Station: sensor.station?.name || 'Unknown',
            Latitude: sensor.lat,
            Longitude: sensor.lon,
            AQI: sensor.aqi,
            URL: sensor.station?.url || 'N/A'
          }))
        );
        
        // Also log raw data for advanced inspection
        console.log('Raw sensor data:');
        response.data.forEach((sensor, index) => {
          console.log(`Sensor #${index + 1}: lat=${sensor.lat.toFixed(6)}, lon=${sensor.lon.toFixed(6)}, aqi=${sensor.aqi}`);
        });
        
        // Save the current route if it exists so we can restore it
        const currentRoute = routeLayerRef.current;
        
        displayAirSensorsOnMap(
          response.data, 
          mapInstance.current, 
          airSensorsLayerRef, 
          showAirSensors, 
          API_URL
        );
        
        // Make sure the route stays on top of air quality markers
        if (currentRoute) {
          currentRoute.bringToFront();
        }
      }
    } catch (err) {
      console.error('Error fetching air sensors:', err);
      setError('Failed to load air quality sensors. ' + (err.response?.data?.error || err.message));
    } finally {
      setLoadingAirSensors(false);
    }
  };
  
  // Funcție helper pentru a obține descrierea calității aerului
  const getAirQualityDescription = (pm10) => {
    if (pm10 <= 20) return "Bună";
    if (pm10 <= 50) return "Moderată";
    if (pm10 <= 100) return "Nesănătoasă pentru grupuri sensibile";
    if (pm10 <= 150) return "Nesănătoasă";
    if (pm10 <= 200) return "Foarte nesănătoasă";
    return "Periculoasă";
  };
  
  const toggleAirSensors = () => {
    const newState = !showAirSensors;
    setShowAirSensors(newState);
    
    if (newState) {
      console.log('Showing air quality sensors...');
      fetchAirSensors();
    } else if (airSensorsLayerRef.current && mapInstance.current) {
      console.log('Hiding air quality sensors');
      mapInstance.current.removeLayer(airSensorsLayerRef.current);
      airSensorsLayerRef.current = null;
      
      // Re-fetch the route if start and end points exist to ensure it's displayed properly
      if (start && end) {
        fetchRoute();
      }
    }
  };
  
  const retryGeolocation = async () => {
    setError('Trying to get your location...');
    try {
      await getUserLocation(
        API_URL,
        handleLocationSuccess,
        handleLocationError,
        handleLocationFallback
      );
    } catch (err) {
      console.error("Location retry failed:", err);
      setError('Location services unavailable. Please enter your starting point manually.');
    }
  };
  
  // Add a new function to fetch a healthy route
  const fetchHealthyRoute = async () => {
    if (!start || !end) {
      setError("Please set start and end points first.");
      return;
    }
    
    setLoadingHealthyRoute(true);
    setError('');
    
    try {
      console.log('Fetching healthy route from', start, 'to', end);
      
      // Make sure air quality is enabled when finding a healthy route
      if (!showAirSensors) {
        toggleAirSensors(); // Turn on air quality visualization first
      }
      
      // First ensure we have a regular route calculated
      if (!routeLayerRef.current) {
        await fetchRoute();
      }
      
      const response = await axios.post(`${API_URL}/healthy-route`, {
        start,
        end,
        profile: transportMode
      }, { 
        timeout: 45000 // Increase timeout to 45 seconds for this complex operation
      });
      
      if (healthyRouteLayerRef.current) {
        mapInstance.current.removeLayer(healthyRouteLayerRef.current);
      }
      
      if (response.data && response.data.route) {
        console.log('Healthy route received:', response.data);
        
        // Add the healthier route to the map with a different color
        healthyRouteLayerRef.current = L.geoJSON(response.data.route).addTo(mapInstance.current);
        
        // Style the healthy route differently (green color)
        if (healthyRouteLayerRef.current) {
          healthyRouteLayerRef.current.setStyle({
            color: '#4ade80', // Green color
            weight: 6,
            opacity: 0.8,
            dashArray: '10, 5' // Dashed line
          });
          
          // If we have both routes, zoom to show both
          if (routeLayerRef.current) {
            // Create a bounds object that includes both routes
            const standardBounds = routeLayerRef.current.getBounds();
            const healthyBounds = healthyRouteLayerRef.current.getBounds();
            const combinedBounds = standardBounds.extend(healthyBounds);
            
            // Fit the map to show both routes
            mapInstance.current.fitBounds(combinedBounds, { padding: [30, 30] });
          }
        }
        
        // Generate a route-specific matrix
        await generateRouteMatrix(response.data.route, response.data.metrics);
        
        // Show health metrics
        if (response.data.metrics) {
          console.log('Route health comparison:', response.data.metrics);
          const { standard, healthy } = response.data.metrics;
          
          // Show message about the health benefit
          const benefitPercent = Math.round(((standard.avgAqi - healthy.avgAqi) / standard.avgAqi) * 100);
          
          setError(`Healthy route is ${(healthy.distance / 1000).toFixed(1)} km (${Math.round((healthy.distance - standard.distance) / standard.distance * 100)}% longer) ` +
              `but has ${benefitPercent}% better air quality. ` +
              `Avg AQI: ${Math.round(healthy.avgAqi)} vs ${Math.round(standard.avgAqi)}`);
        }
      } else {
        setError("Could not find a healthier alternative route.");
      }
    } catch (err) {
      console.error("Error fetching healthy route:", err.response?.data || err.message);
      
      // Special handling for rate limit errors
      if (err.response?.status === 429) {
        setError("Service is busy. Please wait a minute and try again (API rate limit reached).");
      } else {
        setError("Failed to calculate a healthier route. " + (err.response?.data?.error || err.message));
      }
    } finally {
      setLoadingHealthyRoute(false);
    }
  };

  // Add a new function to generate air quality matrix around both routes
  const generateRouteMatrix = async (healthyRouteGeoJSON, metrics) => {
    try {
      // Create bounds that include both standard and healthy routes
      // Create a combined bounds for both routes
      const standardRouteBounds = routeLayerRef.current.getBounds();
      const healthyRouteBounds = L.geoJSON(healthyRouteGeoJSON).getBounds();
      
      const combinedBounds = standardRouteBounds.extend(healthyRouteBounds).pad(0.3);
      
      // Get matrix data focused on the route area
      const params = {
        minLat: combinedBounds.getSouth().toFixed(6),
        minLng: combinedBounds.getWest().toFixed(6),
        maxLat: combinedBounds.getNorth().toFixed(6),
        maxLng: combinedBounds.getEast().toFixed(6),
        gridSize: 40 // Higher density for route-specific matrix
      };
      
      console.log('Fetching route-specific AQI data with params:', params);
      
      const response = await axios.get(`${API_URL}/kriging-matrix`, {
        params: params,
        timeout: 15000
      });
      
      if (response.data && response.data.matrix) {
        console.log('Route-specific matrix received:', response.data.matrix.length, 'points');
        
        // Ensure both routes are visible above the matrix
        if (routeLayerRef.current) {
          routeLayerRef.current.bringToFront();
        }
        if (healthyRouteLayerRef.current) {
          healthyRouteLayerRef.current.bringToFront();
        }
        
        // Show comparison lines between the routes
        if (metrics) {
          // Add labels to show route AQI values at various points
          addAqiComparisonLabels(metrics);
        }
      }
    } catch (err) {
      console.error('Error generating route matrix:', err);
    }
  };

  // Helper to add AQI comparison labels
  const addAqiComparisonLabels = (metrics) => {
    // Implementation left out for brevity, but this would add
    // labels at key points showing the AQI difference between routes
  };

  // Add toggle handler for healthy route feature
  const toggleHealthyRoute = () => {
    if (useHealthyRoute) {
      // Turn off healthy route and remove it from map
      if (healthyRouteLayerRef.current) {
        mapInstance.current.removeLayer(healthyRouteLayerRef.current);
        healthyRouteLayerRef.current = null;
      }
      
      // Also hide route matrix if it exists
      if (routeMatrixLayerRef.current) {
        mapInstance.current.removeLayer(routeMatrixLayerRef.current);
        routeMatrixLayerRef.current = null;
        setRouteMatrixVisible(false);
      }
      
      setUseHealthyRoute(false);
    } else {
      // Calculate and show healthy route
      fetchHealthyRoute();
      setUseHealthyRoute(true);
    }
  };
  
  // Props for child components
  const searchProps = {
    startAddress,
    setStartAddress,
    endAddress,
    setEndAddress,
    retryGeolocation,
    resetPoints,
    fetchRoute,
    loading,
    start,
    end,
    transportMode,
    setTransportMode,
    API_URL,
    setStart, // Add this
    setEnd    // Add this
  };
  
  const transportProps = {
    transportMode,
    setTransportMode
  };
  
  const airQualityProps = {
    showAirSensors,
    toggleAirSensors,
    loadingAirSensors,
    // Add these new props
    useHealthyRoute,
    toggleHealthyRoute,
    loadingHealthyRoute,
    canShowHealthyRoute: Boolean(start && end) // Only enable button when start/end are set
  };

  return (
    <div className="relative h-screen w-full">
      {/* Map */}
      <div ref={mapRef} className="w-full h-full absolute top-0 left-0 z-1"></div>
      
      {/* Search UI */}
      <SearchBar {...searchProps} />
      
      {/* Air Quality Controls - now includes the Healthy Route button */}
      <AirQualityControl {...airQualityProps} />
      
      {/* Air Quality Legend */}
      {showAirSensors && <AirQualityLegend />}
      
      {/* Error Message */}
      {error && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-red-100 text-red-700 px-4 py-2 rounded max-w-md w-full z-50">
          {error}
        </div>
      )}
    </div>
  );
};

export default Profile;
