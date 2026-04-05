/**
 * Places Discovery Service — OpenStreetMap Overpass API
 *
 * Fetches nearby restaurants, cafes, hotels, coworking spaces and services
 * within a configurable radius using the free Overpass API.
 */

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PlaceCategory =
  | 'restaurant'
  | 'cafe'
  | 'hotel'
  | 'coworking'
  | 'service'
  | 'hospital'
  | 'pharmacy'
  | 'supermarket'
  | 'canteen'
  | 'university';

export interface NearbyPlace {
  id: string;
  name: string;
  category: PlaceCategory;
  latitude: number;
  longitude: number;
  distance: number;          // km
  address?: string;
  openingHours?: string;
}

interface OsmNode {
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
}

// ─── Haversine distance ───────────────────────────────────────────────────────

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Tag → Category mapper ────────────────────────────────────────────────────

function detectCategory(tags: Record<string, string>): PlaceCategory | null {
  const amenity = tags['amenity'] ?? '';
  const tourism = tags['tourism'] ?? '';
  const shop    = tags['shop']    ?? '';

  if (['restaurant','food', 'fast_food', 'bar', 'pub', 'biergarten'].includes(amenity)) return 'restaurant';
  if (['food_court', 'canteen'].includes(amenity)) return 'canteen';
  if (['cafe', 'coffee_shop', 'ice_cream', 'juice_bar'].includes(amenity)) return 'cafe';
  if (['hotel', 'hostel', 'motel', 'guest_house', 'apartment'].includes(tourism)) return 'hotel';
  if (amenity === 'coworking_space') return 'coworking';
  if (amenity === 'hospital' || amenity === 'clinic' || amenity === 'doctors') return 'hospital';
  if (amenity === 'pharmacy') return 'pharmacy';
  if (['university', 'college', 'school'].includes(amenity)) return 'university';
  if (amenity === 'supermarket' || shop === 'supermarket') return 'supermarket';
  if (shop || ['bank', 'atm', 'post_office', 'fuel', 'laundry'].includes(amenity)) return 'service';

  return null;
}

function parseNode(node: OsmNode, userLat: number, userLon: number): NearbyPlace | null {
  const tags = node.tags ?? {};
  const name = tags['name'] || tags['operator'] || tags['brand'];
  if (!name) return null;

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
    address: [tags['addr:street'], tags['addr:housenumber'], tags['addr:city']].filter(Boolean).join(', ') || 'Nearby',
    openingHours: tags['opening_hours'],
  };
}

// ─── Internal fetch ──────────────────────────────────────────

async function _fetch(lat: number, lng: number, radius: number): Promise<NearbyPlace[]> {
  console.log(`[Overpass] Fetching near: ${lat}, ${lng} (Radius: ${radius}m)`);

  // Explicitly focus on "Local Area" / Campus vibe: Canteens, food courts, and social hubs.
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"~"^(canteen|food_court|restaurant|cafe|fast_food|bar|pub|biergarten|ice_cream|social_centre|college|university|school|library)$"](around:${radius},${lat},${lng});
      node["tourism"~"^(hotel|hostel|motel|guest_house|apartment)$"](around:${radius},${lat},${lng});
      node["shop"](around:${radius},${lat},${lng});
      node["office"="coworking"](around:${radius},${lat},${lng});
      node["amenity"~"^(hospital|pharmacy|bank|atm|post_office|fuel|laundry|clinic|doctors|dentist)$"](around:${radius},${lat},${lng});
    );
    out body;
  `.trim();

  try {
    const response = await fetch(OVERPASS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) throw new Error(`Overpass status: ${response.status}`);

    const json: { elements: OsmNode[] } = await response.json();
    console.log(`[Overpass] Result count: ${json.elements?.length ?? 0}`);

    return (json.elements ?? [])
      .map(el => parseNode(el, lat, lng))
      .filter((p): p is NearbyPlace => p !== null)
      .sort((a, b) => a.distance - b.distance);
  } catch (err) {
    console.error('[Overpass] Error:', err);
    throw err;
  }
}

// ─── Public API ───────────────────────────────────────────────

export async function fetchNearbyPlaces(
  lat: number,
  lng: number,
  radius = 50000,
  limit  = 100,
): Promise<NearbyPlace[]> {
  const places = await _fetch(lat, lng, radius);
  return places.slice(0, limit);
}
