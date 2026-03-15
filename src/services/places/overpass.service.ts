/**
 * Places Discovery Service — OpenStreetMap Overpass API
 *
 * Fetches nearby restaurants, cafes, hotels, coworking spaces and services
 * within a configurable radius using the free Overpass API (no API key required).
 * All places include a precise Haversine distance from the user.
 * Includes automatic fallback-radius retry when the first query returns no results.
 */

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PlaceCategory =
  | 'restaurant'
  | 'cafe'
  | 'hotel'
  | 'coworking'
  | 'service';

export interface NearbyPlace {
  id: string;
  name: string;
  category: PlaceCategory;
  latitude: number;
  longitude: number;
  distance: number;          // km from user supplied coordinates
  address?: string;          // best-effort OSM addr tags
  openingHours?: string;     // OSM opening_hours tag if available
}

// ─── Internal OSM element ─────────────────────────────────────────────────────

interface OsmNode {
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
}

// ─── Haversine distance ───────────────────────────────────────────────────────

function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Tag → Category mapper ────────────────────────────────────────────────────

function detectCategory(tags: Record<string, string>): PlaceCategory | null {
  const amenity = tags['amenity'] ?? '';
  const tourism = tags['tourism'] ?? '';
  const shop    = tags['shop']    ?? '';
  const office  = tags['office']  ?? '';

  if (['restaurant', 'fast_food', 'food_court', 'bar', 'pub', 'biergarten'].includes(amenity)) return 'restaurant';
  if (['cafe', 'coffee_shop', 'ice_cream', 'juice_bar'].includes(amenity)) return 'cafe';
  if (['hotel', 'hostel', 'motel', 'guest_house', 'apartment'].includes(tourism)) return 'hotel';
  if (amenity === 'coworking_space' || office === 'coworking') return 'coworking';
  // Broad service catch — many small shops are categorised under 'shop' in OSM
  if (shop || ['bank', 'atm', 'pharmacy', 'hospital', 'post_office', 'fuel', 'laundry', 'supermarket'].includes(amenity)) return 'service';

  return null;
}

// ─── Address builder ──────────────────────────────────────────────────────────

function buildAddress(tags: Record<string, string>): string | undefined {
  const parts = [tags['addr:housenumber'], tags['addr:street'], tags['addr:city']].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : tags['addr:full'];
}

// ─── Node parser ──────────────────────────────────────────────────────────────

function parseNode(node: OsmNode, userLat: number, userLon: number): NearbyPlace | null {
  const tags = node.tags ?? {};
  const name = tags['name'];
  if (!name || name.trim() === '') return null;

  const category = detectCategory(tags);
  if (!category) return null;

  const distKm = haversineKm(userLat, userLon, node.lat, node.lon);

  return {
    id: `osm-${node.id}`,
    name,
    category,
    latitude: node.lat,
    longitude: node.lon,
    distance: Math.round(distKm * 100) / 100,
    address: buildAddress(tags),
    openingHours: tags['opening_hours'],
  };
}

// ─── Internal fetch (single radius) ──────────────────────────────────────────

async function _fetch(lat: number, lng: number, radius: number): Promise<NearbyPlace[]> {
  console.log('[Overpass] Query coordinates:', lat, lng);
  console.log('[Overpass] Radius:', radius, 'meters');

  // Broad Overpass QL — deliberately wide tag coverage to maximise results
  const query = `
    [out:json][timeout:20];
    (
      node["amenity"~"^(restaurant|cafe|fast_food|bar|pub|biergarten|food_court|ice_cream|hotel|hostel|bank|atm|pharmacy|hospital|clinic|post_office|fuel|laundry|coworking_space|supermarket)$"](around:${radius},${lat},${lng});
      node["tourism"~"^(hotel|hostel|motel|guest_house|apartment)$"](around:${radius},${lat},${lng});
      node["shop"](around:${radius},${lat},${lng});
      node["office"="coworking"](around:${radius},${lat},${lng});
    );
    out body;
  `.trim();

  const response = await fetch(OVERPASS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new Error(`Overpass API returned ${response.status}: ${response.statusText}`);
  }

  const json: { elements: OsmNode[] } = await response.json();
  console.log('[Overpass] Raw response element count:', json.elements?.length ?? 0);

  const elements = json.elements ?? [];

  const places = elements
    .map(el => parseNode(el, lat, lng))
    .filter((p): p is NearbyPlace => p !== null);

  places.sort((a, b) => a.distance - b.distance);
  return places;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetches nearby places from OpenStreetMap via the Overpass API.
 * Automatically retries with a 5 km radius if the initial 2 km query returns nothing.
 *
 * @param lat      User latitude
 * @param lng      User longitude
 * @param radius   Initial search radius in metres (default 2000 = 2 km)
 * @param limit    Max results to return (default 60)
 */
export async function fetchNearbyPlaces(
  lat: number,
  lng: number,
  radius = 2000,
  limit  = 60,
): Promise<NearbyPlace[]> {
  let places = await _fetch(lat, lng, radius);

  // Fallback: retry at 5 km if original radius returned no results
  if (places.length === 0 && radius <= 2000) {
    console.warn('[Overpass] No results for radius', radius, '— retrying with 5000 m...');
    places = await _fetch(lat, lng, 5000);
  }

  if (places.length === 0) {
    console.warn('[Overpass] No places found within 5 km of', lat, lng);
  }

  return places.slice(0, limit);
}
