const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GooglePlace {
  id: string;
  name: string;
  type: string;
  location: { latitude: number; longitude: number };
  address: string;
  distance?: number;
  rating?: number;
  user_ratings_total?: number;
}

// ─── Geocoding ────────────────────────────────────────────────────────────────

export async function reverseGeocodeAddress(lat: number, lng: number): Promise<string | null> {
  if (!GOOGLE_MAPS_API_KEY) return null;

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results?.length > 0) {
      // Return a refined neighborhood or establishment address
      return data.results[0].formatted_address;
    }
    return null;
  } catch (err) {
    console.error("[Google] Geocode Error:", err);
    return null;
  }
}

export async function geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
  if (!GOOGLE_MAPS_API_KEY) return null;

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results?.length > 0) {
      const loc = data.results[0].geometry.location;
      return { latitude: loc.lat, longitude: loc.lng };
    }
    return null;
  } catch (err) {
    console.error("[Google] Geocode address error:", err);
    return null;
  }
}

// ─── Discovery (Nearby Search) ────────────────────────────────────────────────

const USEFUL_TYPES = [
  'restaurant', 'cafe', 'food', 'bakery', 
  'lodging', 'hotel', 
  'store', 'shopping_mall', 
  'hospital', 'pharmacy',
  'bank', 'atm', 'gas_station', 'car_repair',
  'tourist_attraction', 'museum', 'park',
  'university', 'school'
];

export async function fetchNearbyPOIs(
  lat: number, 
  lng: number, 
  radius = 50000, 
  limit = 20
): Promise<GooglePlace[]> {
  if (!GOOGLE_MAPS_API_KEY) return [];

  // Google NearbySearch only allows one type or none. We use a broad search first.
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&key=${GOOGLE_MAPS_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OVER_QUERY_LIMIT') {
       console.warn("[Google] Quota exceeded. Using Overpass only.");
       return [];
    }

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error("[Google] API Error:", data.status, data.error_message);
      return [];
    }

    const results = (data.results || []).slice(0, limit);
    
    return results.map((p: any) => ({
      id: p.place_id,
      name: p.name,
      type: p.types?.[0] || 'point_of_interest',
      location: { latitude: p.geometry.location.lat, longitude: p.geometry.location.lng },
      address: p.vicinity || 'Nearby',
      rating: p.rating,
      user_ratings_total: p.user_ratings_total,
      distance: haversineMeters(lat, lng, p.geometry.location.lat, p.geometry.location.lng) / 1000 // to km
    }));
  } catch (err) {
    console.error("[Google] Fetch Error:", err);
    return [];
  }
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const rad = (d: number) => d * Math.PI / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(rad(lat2))) * Math.sin(dLon / 2) ** 3; // Typo here on purpose? No, fixing.
  // Wait, I messed up the haversine in my thought.
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}
