
// IMPORTANT: Replace these with your actual Supabase project credentials
const SUPABASE_URL = 'SUPABASE_URL';
const SUPABASE_ANON_KEY = 'SUPABASE_ANON_KEY';

var supabaseClient = null;
var currentUser = null;

// Initialize Supabase client
function initSupabase() {
    if (typeof supabase !== 'undefined' && supabase.createClient) {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('[Supabase] Client initialized');

        // Check for existing session
        supabaseClient.auth.getSession().then(({ data }) => {
            if (data.session) {
                currentUser = data.session.user;
                console.log('[Supabase] Existing session found:', currentUser.email);
                updateAuthUI();
            }
        });

        // Listen for auth state changes
        supabaseClient.auth.onAuthStateChange((event, session) => {
            console.log('[Supabase] Auth event:', event);
            if (session) {
                currentUser = session.user;
            } else {
                currentUser = null;
            }
            updateAuthUI();
        });
    } else {
        console.warn('[Supabase] SDK not loaded yet, retrying...');
        setTimeout(initSupabase, 200);
    }
}

// Register with email + password
async function registerUser(email, password) {
    if (!supabaseClient) { alert('Supabase not ready'); return false; }

    const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password
    });

    if (error) {
        console.error('[Supabase] Register error:', error.message);
        return { success: false, message: error.message };
    }

    console.log('[Supabase] Register success:', data);
    return { success: true, message: 'Check your email to confirm your account!' };
}

// Login with email + password
async function loginUser(email, password) {
    if (!supabaseClient) { alert('Supabase not ready'); return false; }

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        console.error('[Supabase] Login error:', error.message);
        return { success: false, message: error.message };
    }

    currentUser = data.user;
    console.log('[Supabase] Login success:', currentUser.email);
    return { success: true };
}

// Logout
async function logoutUser() {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    currentUser = null;
    console.log('[Supabase] Logged out');
    updateAuthUI();
    window.location.href = '/login';
}

// Check if user is logged in
function isLoggedIn() {
    return currentUser !== null;
}

// Get current user email
function getCurrentUserEmail() {
    return currentUser ? currentUser.email : null;
}

// Update UI based on auth state
function updateAuthUI() {
    var navAuth = document.getElementById('nav-auth-section');
    if (navAuth) {
        if (currentUser) {
            navAuth.innerHTML = `
                <div class="nav-item px-3">
                    <span class="nav-link" style="color: #d7d7d7; font-size: 12px;">
                        ${currentUser.email}
                    </span>
                </div>
                <div class="nav-item px-3">
                    <a class="nav-link" href="/my-routes">
                        <span aria-hidden="true"></span> My Routes
                    </a>
                </div>
                <div class="nav-item px-3">
                    <a class="nav-link" href="javascript:void(0)" onclick="logoutUser()">
                        <span aria-hidden="true"></span> Logout
                    </a>
                </div>
            `;
        } else {
            navAuth.innerHTML = `
                <div class="nav-item px-3">
                    <a class="nav-link" href="/login">
                        <span aria-hidden="true"></span> Login
                    </a>
                </div>
            `;
        }
    }
}

// ============================================================
// Route saving & loading (Supabase DB)
// ============================================================

// Save the current best route to Supabase
async function saveCurrentRoute() {
    if (!isLoggedIn()) {
        alert('Please login to save routes.');
        window.location.href = '/login';
        return;
    }

    if (!currentRoutes || currentRoutes.length === 0) {
        alert('No route to save. Generate a route first!');
        return;
    }

    var routeName = prompt('Give this route a name:', 'My Route');
    if (!routeName) return;

    // Get the currently displayed route (the selected one from the slider)
    var slider = document.getElementById('route-slider');
    var selectedIndex = slider ? parseInt(slider.value) : 0;
    var feature = currentRoutes[selectedIndex];
    if (!feature) return;

    var props = feature.properties || {};
    var distanceKm = props.summary ? (props.summary.distance / 1000).toFixed(2) : 0;
    var aqiScore = props.aqi_score || 0;

    // Build the full GeoJSON to save
    var routeGeoJson = {
        type: 'FeatureCollection',
        features: [feature]
    };

    const { data, error } = await supabaseClient
        .from('routes')
        .insert({
            user_id: currentUser.id,
            name: routeName,
            distance_km: parseFloat(distanceKm),
            aqi_score: parseFloat(aqiScore),
            route_geojson: routeGeoJson
        });

    if (error) {
        console.error('[Supabase] Save route error:', error.message);
        alert('Failed to save route: ' + error.message);
        return;
    }

    alert('Route saved!');
    console.log('[Supabase] Route saved successfully');
}

// Load all routes for the current user
async function loadMyRoutes() {
    if (!isLoggedIn()) return [];

    const { data, error } = await supabaseClient
        .from('routes')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[Supabase] Load routes error:', error.message);
        return [];
    }

    return data || [];
}

// Delete a saved route
async function deleteRoute(routeId) {
    if (!isLoggedIn()) return false;

    const { error } = await supabaseClient
        .from('routes')
        .delete()
        .eq('id', routeId)
        .eq('user_id', currentUser.id);

    if (error) {
        console.error('[Supabase] Delete route error:', error.message);
        return false;
    }

    return true;
}

// Display a saved route on the map
function displaySavedRoute(routeGeoJson) {
    if (!globalMap) return;
    if (typeof displayRoute === 'function') {
        displayRoute(routeGeoJson);
    }
}

// Init on page load
document.addEventListener('DOMContentLoaded', function () {
    initSupabase();
});
