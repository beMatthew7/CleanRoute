
var globalMap = null;
var selectedPoints = [];
var markers = [];
var selectedProfile = 'foot-walking';

// Set transport mode
function setTransportMode(mode) {
    selectedProfile = mode;
    var walkBtn = document.getElementById('mode-walk');
    var bikeBtn = document.getElementById('mode-bike');
    if (mode === 'foot-walking') {
        walkBtn.className = 'btn btn-primary';
        bikeBtn.className = 'btn btn-secondary';
    } else {
        walkBtn.className = 'btn btn-secondary';
        bikeBtn.className = 'btn btn-primary';
    }
    console.log('Transport mode set to:', mode);
}

// Initialize the Leaflet map
function initializeMap() {
    // Create map instance with default center
    globalMap = L.map('map').setView([46.778341, 23.614712], 13);


    // Add OpenStreetMap tile layer
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(globalMap);

    // Add click listener to map for selecting points
    globalMap.on('click', function (e) {
        if (selectedPoints.length < 2) {
            var lat = e.latlng.lat;
            var lng = e.latlng.lng;

            selectedPoints.push([lng, lat]); // OpenRouteService expects [lon, lat]
            console.log('Point ' + selectedPoints.length + ' selected:', [lng, lat]);

            // Add marker at clicked location
            var marker = L.marker([lat, lng]).addTo(globalMap);

            var pointNum = selectedPoints.length;
            marker.bindPopup('Point ' + pointNum + '<br/>Lat: ' + lat.toFixed(4) + '<br/>Lon: ' + lng.toFixed(4) + '<br/>Estimated AQI: <span style="color:gray">Calculating with Kriging...</span>').openPopup();

            fetch(`/api/airquality/estimate?lat=${lat}&lon=${lng}`)
                .then(r => r.json())
                .then(data => {
                    var color = getAqiColor(data.aqi);
                    var label = getAqiLabel(data.aqi);
                    marker.setPopupContent(`<b>Point ${pointNum}</b><br/>Lat: ${lat.toFixed(4)}<br/>Lon: ${lng.toFixed(4)}<br/>Estimated AQI: <b style="color:${color}; font-size:1.2em">${data.aqi}</b><br/>${label}`);
                })
                .catch(err => console.error('Kriging estimation error:', err));

            markers.push(marker);

            // Update UI to show selected points
            updatePointsUI();

            // If we have at least 1 point, show calculate button
            if (selectedPoints.length >= 1) {
                showCalculateButton();
            }
        }
    });
    loadAirQualityBounds(46.778341, 23.614712);

    // Get user's location
    if (typeof navigator.geolocation !== 'undefined') {
        navigator.geolocation.getCurrentPosition(
            function (position) {
                var lat = position.coords.latitude;
                var lon = position.coords.longitude;

                // Center map on user location
                globalMap.setView([lat, lon], 13);

                // Add marker at user location
                L.marker([lat, lon])
                    .addTo(globalMap)
                    .bindPopup('Locația ta<br/>Lat: ' + lat.toFixed(4) + '<br/>Lon: ' + lon.toFixed(4))
                    .openPopup();
            },
            function (error) {
                // Handle geolocation error
                console.error('Geolocation error:', error);

                // Add default marker on London if geolocation fails
                L.marker([51.505, -0.09])
                    .addTo(globalMap)
                    .bindPopup('Geolocation not available<br/>Alege o locație din meniu');

                // Show alert based on error type
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        alert('Location permission denied. Please choose a location from the menu.');
                        break;
                    case error.POSITION_UNAVAILABLE:
                        alert('Location information is unavailable. Please choose a location from the menu.');
                        break;
                    case error.TIMEOUT:
                        alert('The request to get user location timed out. Please choose a location from the menu.');
                        break;
                    default:
                        alert('An unknown error occurred while detecting location. Please choose a location from the menu.');
                }
            }
        );
    } else {
        console.warn('Geolocation not supported');
    }

    // Check if there's a saved route to display (from My Routes page)
    var savedRouteJson = sessionStorage.getItem('viewRoute');
    if (savedRouteJson) {
        sessionStorage.removeItem('viewRoute');
        try {
            var geojson = JSON.parse(savedRouteJson);
            setTimeout(function() { displayRoute(geojson); }, 500);
        } catch (e) {
            console.error('Failed to parse saved route:', e);
        }
    }
}

// Update UI to show selected points
function updatePointsUI() {
    var pointsDiv = document.getElementById('selected-points');
    if (pointsDiv) {
        var html = '<h5>Selected points: ' + selectedPoints.length + '</h5>';
        selectedPoints.forEach(function (point, index) {
            html += '<p><strong>Point ' + (index + 1) + ':</strong> Lon: ' + point[0].toFixed(4) + ', Lat: ' + point[1].toFixed(4) + '</p>';
        });
        pointsDiv.innerHTML = html;
    }
}

// Show calculate button
function showCalculateButton() {
    var btnDiv = document.getElementById('calculate-button');
    var distContainer = document.getElementById('distance-container');
    if (btnDiv) {
        if (selectedPoints.length === 1) {
            if (distContainer) distContainer.style.display = 'block';
            btnDiv.innerHTML = '<button onclick="calculateLoop()" class="btn btn-primary" style="margin-right: 5px;">Generate Loop Route</button> <button onclick="resetPoints()" class="btn btn-secondary">Reset</button>';
        } else if (selectedPoints.length === 2) {
            if (distContainer) distContainer.style.display = 'none';
            btnDiv.innerHTML = '<button onclick="calculateRoute()" class="btn btn-primary" style="margin-right: 5px;">Calculate A-B Route</button> <button onclick="resetPoints()" class="btn btn-secondary">Reset</button>';
        }
    }
}

// Reset selected points
function resetPoints() {
    // Remove previous routes if exist
    if (typeof routeLayers !== 'undefined' && routeLayers.length > 0) {
        routeLayers.forEach(layer => globalMap.removeLayer(layer));
        routeLayers = [];
    }
    if (typeof currentRoutes !== 'undefined') {
        currentRoutes = [];
    }

    selectedPoints = [];
    markers.forEach(function (marker) {
        globalMap.removeLayer(marker);
    });
    markers = [];

    var pointsDiv = document.getElementById('selected-points');
    if (pointsDiv) {
        pointsDiv.innerHTML = '<p style="color: #666;">Apasă de 2 ori pe hartă pentru a selecta punctele</p>';
    }

    var btnDiv = document.getElementById('calculate-button');
    if (btnDiv) {
        btnDiv.innerHTML = '';
    }

    var distContainer = document.getElementById('distance-container');
    if (distContainer) {
        distContainer.style.display = 'none';
    }

    var panel = document.getElementById('route-info-panel');
    if (panel) {
        panel.style.display = 'none';
    }
}

// Calculate loop using the API
var isCalculating = false;

function calculateLoop() {
    if (isCalculating) return;
    if (selectedPoints.length < 1) {
        alert('Choose a start point on the map!');
        return;
    }

    var distanceInput = document.getElementById('loop-distance');
    var distanceKm = distanceInput ? parseFloat(distanceInput.value) : 5;
    
    if (isNaN(distanceKm) || distanceKm <= 0) {
        alert('Please enter a valid distance.');
        return;
    }

    isCalculating = true;

    // Show loading state on button
    var btnDiv = document.getElementById('calculate-button');
    if (btnDiv) {
        btnDiv.innerHTML = '<button class="btn btn-primary" disabled style="margin-right: 5px;">Generating route...</button> <button onclick="resetPoints()" class="btn btn-secondary">Reset</button>';
    }

    var routeRequest = {
        start: selectedPoints[0],
        distanceInKm: distanceKm,
        profile: selectedProfile
    };

    console.log('Sending loop route request:', JSON.stringify(routeRequest));

    fetch('/api/route/calculate-loop', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(routeRequest)
    })
        .then(response => {
            return response.text().then(text => {
                return { status: response.status, text: text };
            });
        })
        .then(data => {
            if (data.status !== 200) {
                throw new Error(`HTTP ${data.status}: ${data.text}`);
            }
            try {
                var geojson = JSON.parse(data.text);
                displayRoute(geojson);
            } catch (e) {
                throw new Error(`Invalid JSON response: ${e.message}\n${data.text}`);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error calculating loop route:\n' + error.message);
        })
        .finally(() => {
            isCalculating = false;
            showCalculateButton();
        });
}

// Calculate route using the API
function calculateRoute() {
    if (selectedPoints.length !== 2) {
        alert('Select two points!');
        return;
    }

    var routeRequest = {
        start: selectedPoints[0],
        end: selectedPoints[1]
    };

    console.log('Sending route request:', routeRequest);

    fetch('/api/route/calculate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(routeRequest)
    })
        .then(response => {
            console.log('Response status:', response.status);
            return response.text().then(text => {
                console.log('Response text:', text);
                return { status: response.status, text: text };
            });
        })
        .then(data => {
            if (data.status !== 200) {
                throw new Error(`HTTP ${data.status}: ${data.text}`);
            }
            try {
                var geojson = JSON.parse(data.text);
                displayRoute(geojson);
            } catch (e) {
                throw new Error(`Invalid JSON response: ${e.message}\n${data.text}`);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error calculating route:\n' + error.message);
        });
}

var currentRoutes = [];
var routeLayers = [];

// Display the route on the map
function displayRoute(geojson) {
    if (routeLayers.length > 0) {
        routeLayers.forEach(layer => globalMap.removeLayer(layer));
        routeLayers = [];
    }

    // Extract all routes (features) from geojson
    currentRoutes = geojson.features || [];

    var slider = document.getElementById('route-slider');
    var panel = document.getElementById('route-info-panel');

    if (currentRoutes.length > 0) {
        if (panel) panel.style.display = 'block';
        if (slider) {
            slider.max = currentRoutes.length - 1;
            slider.value = 0; 
        }

        currentRoutes.forEach((feature, index) => {
            var layer = L.geoJSON(feature, {
                style: {
                    color: index === 0 ? '#007bff' : '#888888', 
                    weight: index === 0 ? 6 : 4,
                    opacity: index === 0 ? 0.9 : 0.5,
                    lineCap: 'round',
                    lineJoin: 'round'
                }
            }).addTo(globalMap);

            routeLayers.push(layer);
        });

        globalMap.fitBounds(routeLayers[0].getBounds());

        updateRouteInfo(0);
    }
}

window.changeRoute = function (index) {
    var selectedIndex = parseInt(index);

    routeLayers.forEach((layer, idx) => {
        if (idx === selectedIndex) {
            layer.setStyle({ color: '#007bff', weight: 6, opacity: 0.9 });
            layer.bringToFront();
        } else {
            layer.setStyle({ color: '#888888', weight: 4, opacity: 0.5 });
            layer.bringToBack();
        }
    });

    updateRouteInfo(selectedIndex);
};

function updateRouteInfo(index) {
    var feature = currentRoutes[index];
    if (!feature) return;

    var props = feature.properties;

    var distanceMeters = props.summary ? props.summary.distance : 0;
    var distanceKm = (distanceMeters / 1000).toFixed(2);

    var durationSecs = props.summary ? props.summary.duration : 0;
    var durationMins = Math.round(durationSecs / 60);

    var aqiScore = props.aqi_score !== undefined ? props.aqi_score : 'N/A';
    var aqiColor = getAqiColor(aqiScore !== 'N/A' ? aqiScore : 0);
    var aqiLabel = aqiScore !== 'N/A' ? getAqiLabel(aqiScore) : '';

    var detailsDiv = document.getElementById('route-details');
    if (detailsDiv) {
        detailsDiv.innerHTML = `
            <div style="margin-bottom: 5px;"><strong>Option ${index + 1}</strong> of ${currentRoutes.length}</div>
            <div><strong>Distance:</strong> ${distanceKm} km (~${durationMins} min)</div>
            <div><strong>Average Pollution (AQI):</strong> <strong style="color:${aqiColor}; font-size:1.2em;">${aqiScore}</strong> <small>(${aqiLabel})</small></div>
        `;
    }
}
var aqiLayer = L.layerGroup();
function loadAirQualityBounds(lat, lng) {

    var delta = 0.5;

    var sw = {
        lat: lat - delta,
        lng: lng - delta
    };
    var ne = {
        lat: lat + delta,
        lng: lng + delta
    };

    fetch(`/api/airquality/bounds?lat1=${sw.lat}&lon1=${sw.lng}&lat2=${ne.lat}&lon2=${ne.lng}`)
        .then(r => r.json())
        .then(stations => {
            aqiLayer.clearLayers();

            stations.forEach(function (station) {
                if (station.aqi <= 0) return; // skip stations without data

                var color = getAqiColor(station.aqi);
                var label = getAqiLabel(station.aqi);

                var popup = `
                    <b>🌫️ ${station.stationName}</b><br/>
                    <span style="color:${color}; font-size:1.5em"><b>${station.aqi}</b></span> AQI<br/>
                    ${label}<br/>
                    <small>🕐 ${station.measuredAt}</small>
                `;

                L.circleMarker([station.lat, station.lon], {
                    radius: 14,
                    fillColor: color,
                    color: '#fff',
                    weight: 2,
                    fillOpacity: 0.85
                })
                    .bindPopup(popup)
                    .addTo(aqiLayer);
            });

            aqiLayer.addTo(globalMap);
        })
        .catch(err => console.error('AQI bounds error:', err));
}

function getAqiColor(aqi) {
    if (aqi <= 50) return '#00e400';
    if (aqi <= 100) return '#ffff00ff';
    if (aqi <= 150) return '#ff7e00';
    if (aqi <= 200) return '#ff0000';
    if (aqi <= 300) return '#8f3f97';
    return '#7e0023';
}

function getAqiLabel(aqi) {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy (sensitive)';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very unhealthy';
    return 'Hazardous';
}

var isAqiVisible = true;
function toggleAirQuality() {
    var btn = document.getElementById('toggle-aqi-button');
    if (isAqiVisible) {
        if (globalMap.hasLayer(aqiLayer)) {
            globalMap.removeLayer(aqiLayer);
        }
        if (btn) btn.innerText = "Show Air Quality";
    } else {
        if (!globalMap.hasLayer(aqiLayer)) {
            aqiLayer.addTo(globalMap);
        }
        if (btn) btn.innerText = "Hide Air Quality";
    }
    isAqiVisible = !isAqiVisible;
}


