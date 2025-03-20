const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Configurare CORS pentru a accepta conexiuni de oriunde
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// API Keys
const ORS_API_KEY = "5b3ce3597851110001cf624883bee069829b4c9d91a8c62da78aa574";
const WAQI_TOKEN = "34a82bb60dac10d41ff4fbe8c28d16a7c6ccd168";
const WAQI_API_URL = "https://api.waqi.info/v2";

// Basic test route - verifică dacă serverul funcționează
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Rută pentru a obține datele senzorilor de calitate a aerului
app.get('/api/air-sensors', async (req, res) => {
  try {
    const { minLat, minLng, maxLat, maxLng } = req.query;
    
    console.log('Air sensors request received with params:', { minLat, minLng, maxLat, maxLng });
    
    // Verifică dacă avem parametrii necesari
    if (!minLat || !minLng || !maxLat || !maxLng) {
      return res.status(400).json({ error: 'All boundary parameters (minLat, minLng, maxLat, maxLng) are required' });
    }
    
    const latlng = `${minLat},${minLng},${maxLat},${maxLng}`;
    console.log(`Fetching air quality data for bounds: ${latlng}`);
    
    try {
      const response = await axios.get(`${WAQI_API_URL}/map/bounds/`, {
        params: {
          latlng,
          token: WAQI_TOKEN
        }
      });
      
      if (response.data.status !== "ok") {
        throw new Error(`WAQI API error: ${response.data.data}`);
      }
      
      console.log(`Fetched ${response.data.data.length} air quality sensors`);
      return res.json(response.data.data);
    } catch (apiError) {
      console.error('API error:', apiError.message);
      return res.status(502).json({ 
        error: 'Error communicating with WAQI API',
        details: apiError.message
      });
    }
  } catch (error) {
    console.error('Server error fetching air sensors:', error.message);
    return res.status(500).json({ 
      error: 'Failed to fetch air quality sensors',
      details: error.message 
    });
  }
});

// Rută pentru calcularea direcțiilor
app.post('/api/directions', async (req, res) => {
  try {
    const { start, end, profile } = req.body;
    
    if (!start || !end) {
      return res.status(400).json({ error: 'Start and end points are required' });
    }

    // Convertim [lat, lng] la [lng, lat] pentru API-ul ORS
    const startCoord = [start[1], start[0]];
    const endCoord = [end[1], end[0]];

    console.log(`Fetching route from [${startCoord}] to [${endCoord}] using profile: ${profile || 'foot-walking'}`);
    
    const response = await axios.post(
      'https://api.openrouteservice.org/v2/directions/' + (profile || 'foot-walking') + '/geojson',
      {
        coordinates: [startCoord, endCoord],
        radiuses: [50, 50] // Increase search radius to 50 meters
      },
      {
        headers: {
          'Authorization': `Bearer ${ORS_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching directions:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch route',
      details: error.response?.data || error.message 
    });
  }
});

// Rută pentru geocoding (adresă -> coordonate)
app.get('/api/geocode', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    console.log(`Geocoding: "${query}"`);
    
    const response = await axios.get('https://api.openrouteservice.org/geocode/search', {
      params: {
        text: query,
        size: 5, // numărul de rezultate
        'boundary.country': 'RO' // opțional, pentru a limita rezultatele la România
      },
      headers: {
        'Authorization': `Bearer ${ORS_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    // Extrage doar informațiile necesare pentru a reduce dimensiunea răspunsului
    const simplifiedResults = response.data.features.map(feature => ({
      place_name: feature.properties.label,
      center: feature.geometry.coordinates,
      properties: feature.properties
    }));

    res.json(simplifiedResults);
  } catch (error) {
    console.error('Error geocoding:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Geocoding failed',
      details: error.response?.data || error.message 
    });
  }
});

// Rută pentru reverse geocoding (coordonate -> adresă)
app.get('/api/reverse-geocode', async (req, res) => {
  try {
    const { lng, lat } = req.query;
    
    if (!lng || !lat) {
      return res.status(400).json({ error: 'Longitude and latitude are required' });
    }
    
    console.log(`Reverse geocoding: [${lng}, ${lat}]`);
    
    const response = await axios.get('https://api.openrouteservice.org/geocode/reverse', {
      params: {
        'point.lon': lng,
        'point.lat': lat,
        size: 1
      },
      headers: {
        'Authorization': `Bearer ${ORS_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    if (response.data.features && response.data.features.length > 0) {
      const feature = response.data.features[0];
      res.json({
        place_name: feature.properties.label,
        center: feature.geometry.coordinates,
        properties: feature.properties
      });
    } else {
      res.json({ place_name: "Unknown location" });
    }
  } catch (error) {
    console.error('Error reverse geocoding:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Reverse geocoding failed',
      details: error.response?.data || error.message 
    });
  }
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} and accepting connections from all network interfaces`);
  console.log(`Available API endpoints:`);
  console.log(`- GET /api/test - Test if server is working`);
  console.log(`- GET /api/air-sensors - Get air quality sensors`);
  console.log(`- POST /api/directions - Get route directions`);
  console.log(`- GET /api/geocode - Search for addresses`);
  console.log(`- GET /api/reverse-geocode - Get address from coordinates`);
});
