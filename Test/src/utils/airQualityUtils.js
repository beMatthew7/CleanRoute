import L from 'leaflet';
import axios from 'axios';

// Asigură-te că această funcție returnează culorile corecte
export const getAQIColor = (aqi) => {
  if (aqi === null || aqi === undefined) return '#888888'; // gri pentru valori lipsă
  if (aqi <= 50) return '#00e400'; // verde - bun
  if (aqi <= 100) return '#ffff00'; // galben - moderat
  if (aqi <= 150) return '#ff7e00'; // portocaliu - nesănătos pentru grupuri sensibile
  if (aqi <= 200) return '#ff0000'; // roșu - nesănătos
  if (aqi <= 300) return '#99004c'; // violet - foarte nesănătos
  return '#7e0023'; // maro - periculos
};

// Display air sensors on map
export const displayAirSensorsOnMap = (sensors, map, layerRef, show, apiUrl) => {
  if (!map || !sensors || !show) return;
  
  // Remove existing layer if any
  if (layerRef.current) {
    map.removeLayer(layerRef.current);
  }
  
  const markers = [];
  sensors.forEach(sensor => {
    if (sensor.lat && sensor.lon && sensor.aqi !== undefined) {
      // Create a custom icon similar to WAQI's implementation
      const iconUrl = `https://waqi.info/mapicon/${sensor.aqi}.30.png`;
      
      // Define icon size and anchor
      const icon = L.icon({
        iconUrl: iconUrl,
        iconSize: [42, 54],
        iconAnchor: [21, 54],
        popupAnchor: [0, -54]
      });
      
      // Create marker with the custom icon
      const marker = L.marker([sensor.lat, sensor.lon], {
        icon: icon,
        title: sensor.station?.name || 'Air Quality Sensor',
        zIndexOffset: sensor.aqi
      }).addTo(map);
      
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
            .openOn(map);
            
          // Get detailed information
          try {
            const detailedPopupContent = await getDetailedSensorInfo(sensor.uid);
            if (detailedPopupContent) {
              popup.setContent(detailedPopupContent);
            }
          } catch (err) {
            console.error('Error fetching detailed station info:', err);
          }
        } catch (e) {
          console.error('Error handling marker click:', e);
        }
      });
      
      markers.push(marker);
    }
  });
  
  layerRef.current = L.layerGroup(markers).addTo(map);
};

// Get detailed sensor information
export const getDetailedSensorInfo = async (sensorId) => {
  try {
    const response = await axios.get(`https://api.waqi.info/feed/@${sensorId}/?token=34a82bb60dac10d41ff4fbe8c28d16a7c6ccd168`);
    
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
      
      // Return HTML content for the popup
      return `
        <div class="max-w-xs">
          <h3 class="font-bold text-center">${data.city.name || 'Unknown Station'}</h3>
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
      `;
    }
    return null;
  } catch (error) {
    console.error('Error fetching detailed sensor info:', error);
    return null;
  }
};
