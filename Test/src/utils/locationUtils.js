import axios from 'axios';

// Default coordinates for Cluj-Napoca as a hardcoded fallback
export const DEFAULT_LOCATION = {
  lat: 46.770439,
  lng: 23.591423,
  place_name: "Cluj-Napoca, Romania"
};

/**
 * Get user's current location using multiple fallback mechanisms
 * @param {string} apiUrl - URL for the server API
 * @param {Function} onSuccess - Callback for successful location retrieval
 * @param {Function} onError - Callback for error handling
 * @param {Function} onFallback - Callback when fallback location is used
 */
export const getUserLocation = async (
  apiUrl,
  onSuccess = () => {},
  onError = () => {},
  onFallback = () => {}
) => {
  try {
    // Try browser geolocation first
    if (navigator.geolocation) {
      try {
        console.log("Attempting to get user location through browser geolocation...");
        
        // Use a timeout to avoid waiting too long
        const position = await new Promise((resolve, reject) => {
          // Geolocation options
          const options = {
            timeout: 5000,          // 5 seconds timeout
            maximumAge: 60000,      // Accept positions up to 1 minute old
            enableHighAccuracy: false // Faster but less accurate
          };
          
          // Try to get position
          navigator.geolocation.getCurrentPosition(resolve, reject, options);
          
          // Set a timeout as an additional safeguard
          const timeoutId = setTimeout(() => {
            reject(new Error("Geolocation timeout"));
          }, 6000);
          
          // Store the timeout ID so we can clear it if geolocation succeeds
          return () => clearTimeout(timeoutId);
        });
        
        const { latitude, longitude } = position.coords;
        console.log("Successfully got user location:", latitude, longitude);
        
        // Call success callback with location
        onSuccess({
          lat: latitude,
          lng: longitude,
          accuracy: position.coords.accuracy,
          source: 'browser'
        });
        
        return { lat: latitude, lng: longitude };
      } catch (geoErr) {
        console.warn("Browser geolocation failed:", geoErr.message, "Error code:", geoErr.code);
        // Continue to fallbacks
      }
    } else {
      console.warn("Browser geolocation not supported");
    }
    
    // Try server fallback location
    try {
      console.log("Using server fallback location...");
      const response = await axios.get(`${apiUrl}/default-location`, { timeout: 3000 });
      
      if (response.data && response.data.lat && response.data.lng) {
        console.log("Using server fallback location:", response.data);
        onFallback({ ...response.data, source: 'server' });
        return response.data;
      }
    } catch (serverErr) {
      console.error("Server fallback location failed:", serverErr);
    }
    
    // Last resort: hardcoded fallback
    console.log("Using hardcoded fallback location");
    
    // Call fallback callback
    onFallback({
      ...DEFAULT_LOCATION,
      source: 'hardcoded'
    });
    
    return DEFAULT_LOCATION;
  } catch (err) {
    console.error("Location initialization failed completely:", err);
    onError(err);
    return DEFAULT_LOCATION;
  }
};

/**
 * Get address for coordinates (reverse geocoding)
 * @param {string} apiUrl - API URL
 * @param {number} lng - Longitude
 * @param {number} lat - Latitude
 * @returns {Promise<string>} Address as string
 */
export const getAddressFromCoords = async (apiUrl, lng, lat) => {
  try {
    const response = await axios.get(`${apiUrl}/reverse-geocode`, {
      params: { lng, lat }
    });
    return response.data.place_name;
  } catch (err) {
    console.error('Error in reverse geocoding:', err);
    return 'Unknown location';
  }
};
