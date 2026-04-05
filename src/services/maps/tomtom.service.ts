const TOMTOM_API_KEY = import.meta.env.VITE_TOMTOM_API_KEY;

export interface TomTomPlace {
  id: string;
  name: string;
  type: string;
  location: { latitude: number; longitude: number };
  address: string;
  distance?: number;
  phone?: string;
  url?: string;
}

export async function geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
  if (!TOMTOM_API_KEY) return null;

  try {
    // We use /search/ to support both strict addresses and POIs like 'parul university'
    const url = `https://api.tomtom.com/search/2/search/${encodeURIComponent(address)}.json?key=${TOMTOM_API_KEY}&limit=1`;
    const res = await fetch(url);
    const data = await res.json();

    if (data && data.results && data.results.length > 0) {
      const pos = data.results[0].position;
      return { latitude: pos.lat, longitude: pos.lon };
    }
    return null;
  } catch (error) {
    console.error("[TomTom] Geocoding Error:", error);
    return null;
  }
}

export async function reverseGeocodeAddress(lat: number, lng: number): Promise<string | null> {
  if (!TOMTOM_API_KEY) {
    console.warn("[TomTom] API key missing for reverse geocoding");
    return null;
  }
  try {
    const url = `https://api.tomtom.com/search/2/reverseGeocode/${lat},${lng}.json?key=${TOMTOM_API_KEY}&radius=1000`;
    const res = await fetch(url);
    const data = await res.json();
    if (data && data.addresses && data.addresses.length > 0) {
      // Return a human readable address
      const addr = data.addresses[0].address;
      return addr.freeformAddress || `${addr.streetName || ''} ${addr.municipality || ''}`.trim() || null;
    }
    return null;
  } catch (error) {
    console.error("[TomTom] Reverse Geocoding Error:", error);
    return null;
  }
}

export async function fetchNearbyPOIs(lat: number, lng: number, categorySet: string, radius = 5000, limit = 20): Promise<TomTomPlace[]> {
  if (!TOMTOM_API_KEY) {
    throw new Error("TomTom API key missing");
  }
  
  // categorySet: 7315 for Restaurants, 7314 for Hotels, etc.
  const url = `https://api.tomtom.com/search/2/nearbySearch/.json?key=${TOMTOM_API_KEY}&lat=${lat}&lon=${lng}&radius=${radius}&categorySet=${categorySet}&limit=${limit}`;
  const res = await fetch(url);
  const data = await res.json();

  if (!data || !data.results) return [];

  return data.results.map((poi: any) => ({
    id: poi.id,
    name: poi.poi?.name || "Unknown",
    type: poi.poi?.classifications?.[0]?.code || "service",
    location: {
      latitude: poi.position.lat,
      longitude: poi.position.lon,
    },
    address: poi.address?.freeformAddress || "Nearby Location",
    distance: poi.dist ? Math.round(poi.dist / 100) / 10 : undefined, // km
    phone: poi.poi?.phone,
    url: poi.poi?.url
  }));
}
