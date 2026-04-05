/**
 * OpenRouteService integration for geocoding and travel routing.
 * Uses native fetch to bypass UMD/CJS bundler issues.
 */

const API_KEY = import.meta.env.VITE_ORS_API_KEY as string;

export interface GeocodedLocation {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

export interface RouteResult {
  duration: number; // in minutes
  distance: number; // in km
  geometry: GeoJSON.LineString;
  arrivalTime: string;
  status: 'optimal' | 'delayed';
  trafficLevel: 'low' | 'medium' | 'high';
  congestionSegments: string[]; 
}

/**
 * Converts an address string into latitude/longitude coordinates using ORS Geocode API.
 */
export async function geocodeAddress(address: string): Promise<GeocodedLocation | null> {
  if (!address || !API_KEY) return null;

  try {
    const url = new URL('https://api.openrouteservice.org/geocode/search');
    url.searchParams.append('api_key', API_KEY);
    url.searchParams.append('text', address);
    url.searchParams.append('size', '1');

    const res = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json' }
    });

    if (!res.ok) throw new Error(`Geocode failed with status ${res.status}`);

    const data = await res.json();
    const features = data.features;
    if (!features || features.length === 0) return null;

    const [lon, lat] = features[0].geometry.coordinates;

    return {
      latitude: lat,
      longitude: lon,
      formattedAddress: features[0].properties.label || address,
    };
  } catch (error) {
    console.error('[ors.service] geocode error:', error);
    return null;
  }
}

/**
 * Calculates a route between two coordinate pairs using ORS Directions API.
 */
export async function calculateRoute(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
  mode: 'driving' | 'transit' | 'walking' | 'cycling',
  departureTime?: string,
): Promise<RouteResult | null> {
  if (!API_KEY) return null;

  let profile = 'driving-car';
  if (mode === 'walking') profile = 'foot-walking';
  if (mode === 'cycling') profile = 'cycling-regular';
  if (mode === 'transit') {
    console.warn('[ors.service] Public transit requested, but ORS standard directions does not support it natively. Falling back to driving-car.');
    profile = 'driving-car';
  }

  try {
    const url = `https://api.openrouteservice.org/v2/directions/${profile}/geojson`;
    
    // ORS expects [longitude, latitude]
    const body = {
      coordinates: [
        [origin.longitude, origin.latitude],
        [destination.longitude, destination.latitude]
      ]
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
        'Authorization': API_KEY,
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error(`Route calculation failed with status ${res.status}`);

    const data = await res.json();
    const features = data.features;
    if (!features || features.length === 0) return null;

    const route = features[0];
    const properties = route.properties;
    
    // ORS returns duration in seconds, distance in meters
    const durationMin = Math.round(properties.summary.duration / 60);
    const distanceKm = Math.round((properties.summary.distance / 1000) * 10) / 10;

    const start = departureTime ? new Date(departureTime) : new Date();
    const arrival = new Date(start.getTime() + durationMin * 60000);

    return {
      duration: durationMin,
      distance: distanceKm,
      geometry: route.geometry as GeoJSON.LineString,
      arrivalTime: arrival.toISOString(),
      status: 'optimal',    
      trafficLevel: 'low',  
      congestionSegments: [], 
    };
  } catch (error) {
    console.error('[ors.service] route calculation error:', error);
    return null;
  }
}

/**
 * Convenience wrapper: Geocodes both addresses and calculates the router between them.
 */
export async function geocodeAndCalculateRoute(
  originAddress: string,
  destAddress: string,
  mode: 'driving' | 'transit' | 'walking' | 'cycling',
  departureTime?: string,
): Promise<{
  route: RouteResult;
  originCoords: GeocodedLocation;
  destCoords: GeocodedLocation;
} | null> {
  const [originCoords, destCoords] = await Promise.all([
    geocodeAddress(originAddress),
    geocodeAddress(destAddress),
  ]);

  if (!originCoords || !destCoords) {
    console.warn('[ors.service] Could not geocode addresses');
    return null;
  }

  const route = await calculateRoute(originCoords, destCoords, mode, departureTime);

  if (!route) return null;

  return { route, originCoords, destCoords };
}
