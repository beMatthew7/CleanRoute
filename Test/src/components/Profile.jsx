import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import debounce from 'lodash.debounce';

const Profile = () => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef({ start: null, end: null });
  const routeLayerRef = useRef(null);
  const airSensorsLayerRef = useRef(null); // Referință pentru stratul cu senzorii de calitate a aerului
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [startAddress, setStartAddress] = useState('');
  const [endAddress, setEndAddress] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeSearchField, setActiveSearchField] = useState(null); // 'start' or 'end'
  const [transportMode, setTransportMode] = useState('foot-walking'); // Adaugă starea pentru modul de transport
  const [showAirSensors, setShowAirSensors] = useState(false); // Afișează/ascunde senzorii
  const [loadingAirSensors, setLoadingAirSensors] = useState(false);
  
  // Server API URL - update this to your actual server URL
  const API_URL = 'http://localhost:5000/api';

  // Initialize map once and get user location
  useEffect(() => {
    mapInstance.current = L.map(mapRef.current).setView([46.77, 23.58], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance.current);

    // Try to get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          mapInstance.current.setView([latitude, longitude], 15);
          setStart([latitude, longitude]);
          
          // Get the address for the current location
          fetchReverseGeocode(longitude, latitude)
            .then(address => {
              setStartAddress(address);
            })
            .catch(err => {
              console.error('Error getting address:', err);
              setStartAddress('Current Location');
            });
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('Could not get your location. Please enter it manually.');
        }
      );
    } else {
      console.error('Geolocation not supported');
      setError('Geolocation is not supported by your browser.');
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
      }
    };
  }, []);

  // Fetch address for coordinates
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

  // Search for addresses based on text input
  const searchAddress = async (query) => {
    if (!query || query.length < 3) return;
    
    setIsSearching(true);
    try {
      const response = await axios.get(`${API_URL}/geocode`, {
        params: { query }
      });
      setSearchResults(response.data);
    } catch (err) {
      console.error('Error searching for address:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce search to prevent too many requests
  const debouncedSearch = useRef(
    debounce(searchAddress, 500)
  ).current;

  // Handle start address input change
  const handleStartAddressChange = (e) => {
    const value = e.target.value;
    setStartAddress(value);
    setActiveSearchField('start');
    debouncedSearch(value);
  };

  // Handle end address input change
  const handleEndAddressChange = (e) => {
    const value = e.target.value;
    setEndAddress(value);
    setActiveSearchField('end');
    debouncedSearch(value);
  };

  // Select an address from search results
  const selectSearchResult = (result) => {
    const [lng, lat] = result.center;
    const coordinates = [lat, lng]; // Convert to [lat, lng] format

    if (activeSearchField === 'start') {
      setStart(coordinates);
      setStartAddress(result.place_name);
    } else if (activeSearchField === 'end') {
      setEnd(coordinates);
      setEndAddress(result.place_name);
    }

    setSearchResults([]);
    setActiveSearchField(null);
  };

  // Handle map click for setting points
  useEffect(() => {
    if (!mapInstance.current) return;
    
    const clickHandler = (e) => {
      const { lat, lng } = e.latlng;
      
      // If we don't have an end point yet, set it
      if (!end) {
        setEnd([lat, lng]);
        
        // Get the address for the clicked location
        fetchReverseGeocode(lng, lat)
          .then(address => {
            setEndAddress(address);
          })
          .catch(err => {
            console.error('Error getting address:', err);
          });
      }
    };

    mapInstance.current.on('click', clickHandler);
    
    return () => {
      if (mapInstance.current) {
        mapInstance.current.off('click', clickHandler);
      }
    };
  }, [end]);

  // Handle markers
  useEffect(() => {
    // Handle start marker
    if (start) {
      if (markersRef.current.start) {
        // Update existing marker position
        markersRef.current.start.setLatLng(start);
      } else {
        // Create new marker
        const startMarker = L.marker(start, { draggable: true })
          .addTo(mapInstance.current)
          .bindPopup("Start")
          .openPopup();

        startMarker.on('dragend', (e) => {
          const { lat, lng } = e.target.getLatLng();
          setStart([lat, lng]);
          
          // Update address when marker is dragged
          fetchReverseGeocode(lng, lat)
            .then(address => {
              setStartAddress(address);
            })
            .catch(err => {
              console.error('Error getting address:', err);
            });
        });

        markersRef.current.start = startMarker;
      }
    }

    // Handle end marker
    if (end) {
      if (markersRef.current.end) {
        // Update existing marker position
        markersRef.current.end.setLatLng(end);
      } else {
        // Create new marker
        const endMarker = L.marker(end, { draggable: true })
          .addTo(mapInstance.current)
          .bindPopup("End")
          .openPopup();

        endMarker.on('dragend', (e) => {
          const { lat, lng } = e.target.getLatLng();
          setEnd([lat, lng]);
          
          // Update address when marker is dragged
          fetchReverseGeocode(lng, lat)
            .then(address => {
              setEndAddress(address);
            })
            .catch(err => {
              console.error('Error getting address:', err);
            });
        });

        markersRef.current.end = endMarker;
      }
    }
  }, [start, end]);

  // Function to fetch route from our backend server
  const fetchRoute = async () => {
    if (!start || !end) return;

    setLoading(true);
    setError('');
    
    try {
      console.log("Fetching route from server...");
      
      const response = await axios.post(`${API_URL}/directions`, {
        start,
        end,
        profile: transportMode // Folosim modul de transport selectat
      });
      
      console.log("Route response:", response.data);

      // Remove previous route if exists
      if (routeLayerRef.current) {
        mapInstance.current.removeLayer(routeLayerRef.current);
      }

      // Draw the new route
      if (response.data && response.data.features && response.data.features.length > 0) {
        routeLayerRef.current = L.geoJSON(response.data).addTo(mapInstance.current);
        
        // Fit map to show the entire route
        const bounds = routeLayerRef.current.getBounds();
        mapInstance.current.fitBounds(bounds, { padding: [30, 30] });
      } else {
        setError("No route found between these points.");
      }
    } catch (err) {
      console.error("Error fetching route:", err.response?.data || err.message);
      
      if (err.response?.data?.details?.error?.message) {
        setError(`Route error: ${err.response.data.details.error.message}`);
      } else {
        setError("Failed to fetch route. Please try different points or try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch route when both points are set or when transport mode changes
  useEffect(() => {
    if (start && end) {
      fetchRoute();
    }
  }, [start, end, transportMode]); // Adăugăm transportMode la dependențe
  
  // Funcție pentru a obține senzorii de calitate a aerului
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
      
      console.log('Fetching air sensors with params:', params);
      
      const response = await axios.get(`${API_URL}/air-sensors`, {
        params: params,
        timeout: 10000 // Timeout de 10 secunde
      });
      
      console.log('Air sensors response:', response);
      
      if (response.data) {
        console.log(`Loaded ${response.data.length} air quality sensors`);
        displayAirSensorsOnMap(response.data);
      } else {
        console.warn('Empty air sensors response');
      }
    } catch (err) {
      console.error('Error fetching air sensors:', err);
      setError('Failed to load air quality sensors. ' + (err.response?.data?.error || err.message));
    } finally {
      setLoadingAirSensors(false);
    }
  };

  // Funcție pentru a afișa senzorii pe hartă cu icoane similare cu WAQI
  const displayAirSensorsOnMap = (sensors) => {
    if (!mapInstance.current || !sensors || !showAirSensors) return;
    
    // Remove existing layer if any
    if (airSensorsLayerRef.current) {
      mapInstance.current.removeLayer(airSensorsLayerRef.current);
    }
    
    const markers = [];
    sensors.forEach(sensor => {
      if (sensor.lat && sensor.lon && sensor.aqi !== undefined) {
        // Create a custom icon similar to WAQI's implementation
        const iconUrl = `https://waqi.info/mapicon/${sensor.aqi}.30.png`;
        
        // Define icon size and anchor
        const icon = L.icon({
          iconUrl: iconUrl,
          iconSize: [42, 54],      // Size of the icon [width, height]
          iconAnchor: [21, 54],    // Point of the icon which corresponds to marker's location
          popupAnchor: [0, -54]    // Point from which the popup should open relative to the iconAnchor
        });
        
        // Create marker with the custom icon
        const marker = L.marker([sensor.lat, sensor.lon], {
          icon: icon,
          title: sensor.station?.name || 'Air Quality Sensor',
          zIndexOffset: sensor.aqi // Higher AQI values will be shown on top
        }).addTo(mapInstance.current);
        
        // When marker is clicked, fetch more detailed information
        marker.on('click', async () => {
          try {
            // Initial popup with basic info
            let popup = L.popup()
              .setLatLng([sensor.lat, sensor.lon])
              .setContent(`
                <div class="text-center">
                  <h3 class="font-bold">${sensor.station?.name || 'Unknown Station'}</h3>
                  <p>AQI: <span class="font-bold" style="color: ${getAQIColor(sensor.aqi)};">${sensor.aqi}</span></p>
                  <p class="text-xs">Loading more details...</p>
                </div>
              `)
              .openOn(mapInstance.current);
              
            // Try to fetch more detailed information about this station
            try {
              const response = await axios.get(`https://api.waqi.info/feed/@${sensor.uid}/?token=34a82bb60dac10d41ff4fbe8c28d16a7c6ccd168`);
              if (response.data.status === 'ok') {
                const data = response.data.data;
                
                // Format time
                const time = data.time?.v ? new Date(data.time.v * 1000).toLocaleString() : 'Unknown';
                
                // Extract pollutant information
                const pollutants = ['pm25', 'pm10', 'o3', 'no2', 'so2', 'co'];
                let pollutantHtml = '';
                let weatherHtml = '';
                
                for (const specie in data.iaqi) {
                  if (pollutants.includes(specie)) {
                    pollutantHtml += `<span class="px-1"><b>${specie}</b>: ${data.iaqi[specie].v}</span>`;
                  } else {
                    weatherHtml += `<span class="px-1"><b>${specie}</b>: ${data.iaqi[specie].v}</span>`;
                  }
                }
                
                // Create attributions HTML
                let attributionsHtml = '';
                if (data.attributions && data.attributions.length > 0) {
                  attributionsHtml = data.attributions.map(attr => 
                    `<a href="${attr.url}" target="_blank" class="text-blue-500 hover:underline">${attr.name}</a>`
                  ).join(' - ');
                }
                
                // Update popup with detailed information
                popup.setContent(`
                  <div class="max-w-xs">
                    <h3 class="font-bold text-center">${data.city.name || sensor.station?.name || 'Unknown Station'}</h3>
                    <div class="flex justify-center items-center my-1">
                      <span class="text-2xl font-bold mr-2" style="color: ${getAQIColor(data.aqi)};">${data.aqi}</span>
                      <span>AQI</span>
                    </div>
                    <p class="text-xs text-center">Updated: ${time}</p>
                    
                    ${data.city.location ? `<p class="text-xs mt-2"><b>Location:</b> ${data.city.location}</p>` : ''}
                    
                    ${pollutantHtml ? `
                      <div class="mt-2">
                        <p class="text-xs font-bold">Pollutants:</p>
                        <div class="text-xs flex flex-wrap">${pollutantHtml}</div>
                      </div>
                    ` : ''}
                    
                    ${weatherHtml ? `
                      <div class="mt-2">
                        <p class="text-xs font-bold">Weather:</p>
                        <div class="text-xs flex flex-wrap">${weatherHtml}</div>
                      </div>
                    ` : ''}
                    
                    ${attributionsHtml ? `
                      <div class="mt-2">
                        <p class="text-xs font-bold">Attributions:</p>
                        <div class="text-xs">${attributionsHtml}</div>
                      </div>
                    ` : ''}
                  </div>
                `);
              }
            } catch (err) {
              console.error('Error fetching detailed station info:', err);
              // Keep the basic popup if fetch fails
            }
          } catch (e) {
            console.error('Error handling marker click:', e);
          }
        });
        
        markers.push(marker);
      }
    });
    
    airSensorsLayerRef.current = L.layerGroup(markers).addTo(mapInstance.current);
  };

  // Funcție pentru a determina culoarea în funcție de valoarea AQI
  const getAQIColor = (aqi) => {
    if (aqi <= 50) return '#00e400'; // Good - Verde
    if (aqi <= 100) return '#ffff00'; // Moderate - Galben
    if (aqi <= 150) return '#ff7e00'; // Unhealthy for Sensitive Groups - Portocaliu
    if (aqi <= 200) return '#ff0000'; // Unhealthy - Roșu
    if (aqi <= 300) return '#99004c'; // Very Unhealthy - Violet
    return '#7e0023'; // Hazardous - Maro
  };

  // Funcție pentru a afișa sau ascunde senzorii
  const toggleAirSensors = () => {
    const newState = !showAirSensors;
    setShowAirSensors(newState);
    
    if (newState) {
      fetchAirSensors();
    } else if (airSensorsLayerRef.current && mapInstance.current) {
      mapInstance.current.removeLayer(airSensorsLayerRef.current);
      airSensorsLayerRef.current = null;
    }
  };

  // Actualizează senzorii când se schimbă zona vizibilă a hărții
  useEffect(() => {
    if (!mapInstance.current || !showAirSensors) return;
    
    const handleMapMoveEnd = debounce(() => {
      fetchAirSensors();
    }, 500);
    
    mapInstance.current.on('moveend', handleMapMoveEnd);
    
    // Încarcă senzorii la activare
    fetchAirSensors();
    
    return () => {
      if (mapInstance.current) {
        mapInstance.current.off('moveend', handleMapMoveEnd);
      }
    };
  }, [mapInstance.current, showAirSensors]);
  
  // Reset function to allow setting new points
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

  return (
    <div className="relative h-screen w-full">
      {/* Hartă */}
      <div ref={mapRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1 }}></div>
      
      {/* Search bar container - Mutat mai spre dreapta pentru a nu acoperi butoanele de zoom */}
      <div className="absolute top-4 left-16 w-80 md:w-96" style={{ zIndex: 1000 }}>
        <div className="bg-white rounded-lg shadow-lg p-3">
          <div className="mb-2">
            <label htmlFor="start-address" className="block text-sm font-medium text-gray-700 mb-1">Start</label>
            <input
              type="text"
              id="start-address"
              className="w-full p-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Your starting point"
              value={startAddress}
              onChange={handleStartAddressChange}
              onClick={() => setActiveSearchField('start')}
            />
          </div>
          
          <div className="mb-2">
            <label htmlFor="end-address" className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
            <input
              type="text"
              id="end-address"
              className="w-full p-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Where do you want to go?"
              value={endAddress}
              onChange={handleEndAddressChange}
              onClick={() => setActiveSearchField('end')}
            />
          </div>
          
          {/* Transport mode selector */}
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Transport Mode</label>
            <div className="flex space-x-1">
              <button 
                onClick={() => setTransportMode('foot-walking')}
                className={`flex-1 p-1 text-xs rounded ${transportMode === 'foot-walking' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Walking
              </button>
              <button 
                onClick={() => setTransportMode('cycling-regular')}
                className={`flex-1 p-1 text-xs rounded ${transportMode === 'cycling-regular' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Cycling
              </button>
              <button 
                onClick={() => setTransportMode('driving-car')}
                className={`flex-1 p-1 text-xs rounded ${transportMode === 'driving-car' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Driving
              </button>
            </div>
          </div>
          
          {/* Search results dropdown - Z-index ridicat pentru a fi deasupra hărții */}
          {searchResults.length > 0 && activeSearchField && (
            <div className="absolute left-0 right-0 bg-white mt-0.5 rounded-md shadow-lg max-h-60 overflow-y-auto" style={{ zIndex: 1001 }}>
              {searchResults.map((result, index) => (
                <div 
                  key={index}
                  className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onClick={() => selectSearchResult(result)}
                >
                  {result.place_name}
                </div>
              ))}
            </div>
          )}
          
          {isSearching && (
            <div className="text-center text-xs text-gray-500">Searching...</div>
          )}
          
          <div className="flex justify-between mt-2">
            <button 
              onClick={resetPoints}
              className="bg-gray-200 text-gray-700 px-2 py-1 text-sm rounded hover:bg-gray-300"
            >
              Reset
            </button>
            
            <button 
              onClick={fetchRoute}
              disabled={!start || !end || loading}
              className={`px-2 py-1 text-sm rounded ${!start || !end || loading ? 'bg-blue-300' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
            >
              {loading ? 'Loading...' : 'Get Route'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Stiluri inline pentru markerii de calitate a aerului */}
      <style jsx>{`
        .air-quality-marker-container {
          background: none !important;
          border: none !important;
        }
        
        .air-quality-marker {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          height: 100%;
        }
        
        .air-quality-sign {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 36px;
          height: 24px;
          border-radius: 4px;
          color: black;
          font-weight: bold;
          font-size: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          border: 1px solid rgba(0,0,0,0.2);
        }
        
        .air-quality-pole {
          width: 4px;
          height: 30px;
          background-color: #333;
          margin-top: -1px;
        }
      `}</style>
      
      {/* Modificăm stilul butonului pentru Air Quality */}
      <button
        onClick={toggleAirSensors}
        className={`absolute top-20 right-4 px-3 py-2 rounded shadow-lg flex items-center ${
          showAirSensors ? 'bg-blue-500 text-white' : 'bg-white text-gray-800'
        }`}
        style={{ zIndex: 900 }}
      >
        <div className="mr-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
          </svg>
        </div>
        {loadingAirSensors ? 'Loading...' : (showAirSensors ? 'Hide Air Quality' : 'Show Air Quality')}
      </button>
      
      {/* Legendă pentru indicele de calitate a aerului - vizibilă doar când senzorii sunt afișați */}
      {showAirSensors && (
        <div className="absolute bottom-16 left-4 bg-white p-2 rounded-md shadow-lg" style={{ zIndex: 999 }}>
          <h3 className="text-sm font-medium mb-1">Air Quality Index</h3>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#00e400' }}></div>
            <span className="text-xs">Good (0-50)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ffff00' }}></div>
            <span className="text-xs">Moderate (51-100)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ff7e00' }}></div>
            <span className="text-xs">Unhealthy for Sensitive Groups (101-150)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ff0000' }}></div>
            <span className="text-xs">Unhealthy (151-200)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#99004c' }}></div>
            <span className="text-xs">Very Unhealthy (201-300)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#7e0023' }}></div>
            <span className="text-xs">Hazardous (300+)</span>
          </div>
        </div>
      )}
      
      {/* Mesaj de eroare - mutat în partea de jos pe mijloc */}
      {error && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-red-100 text-red-700 px-4 py-2 rounded max-w-md w-full" style={{ zIndex: 999 }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default Profile;
