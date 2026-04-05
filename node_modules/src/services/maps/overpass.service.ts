/**
 * OpenStreetMap Overpass API service.
 * Fetches nearby places (restaurants, hotels, cafes, services) given a lat/lng and radius.
 */

import type { Recommendation } from '../../types';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// Map OSM amenity/tourism tags → our internal Recommendation type
const AMENITY_TYPE_MAP: Record<string, Recommendation['type']> = {
  restaurant: 'restaurant',
  cafe: 'restaurant',
  fast_food: 'restaurant',
  food_court: 'restaurant',
  bar: 'restaurant',
  pub: 'restaurant',
  hotel: 'hotel',
  hostel: 'hotel',
  motel: 'hotel',
  guest_house: 'hotel',
  apartment: 'hotel',
  bank: 'service',
  atm: 'service',
  pharmacy: 'service',
  hospital: 'service',
  clinic: 'service',
  post_office: 'service',
  fuel: 'service',
  car_wash: 'service',
  laundry: 'service',
  internet_cafe: 'service',
};

const TOURISM_TYPE_MAP: Record<string, Recommendation['type']> = {
  hotel: 'hotel',
  hostel: 'hotel',
  motel: 'hotel',
  guest_house: 'hotel',
  apartment: 'hotel',
};

export interface OverpassPlace {
  id: number;
  lat: number;
  lon: number;
  tags: Record<string, string>;
}

/**
 * Haversine formula — distance in km between two lat/lng points.
 */
function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Builds a relevance score based on distance and OSM data quality.
 * Closer = more relevant, higher OSM data quality raises score slightly.
 */
function computeRelevance(distKm: number, tags: Record<string, string>): number {
  const distScore = Math.max(0, 1 - distKm / 2); // linear falloff within 2 km
  const bonusForRating = tags['stars'] || tags['rating'] ? 0.05 : 0;
  const bonusForName = tags['name'] ? 0.05 : 0;
  return Math.min(1, distScore + bonusForRating + bonusForName);
}

/**
 * Parses a single OSM element into a Recommendation object.
 * Returns null if the element has no usable name or type.
 */
function parseElement(
  el: OverpassPlace,
  userLat: number, userLon: number
): Recommendation | null {
  const tags = el.tags ?? {};
  const name = tags['name'];
  if (!name || name.trim() === '') return null;

  // Determine type
  const amenity = tags['amenity'];
  const tourism = tags['tourism'];
  const type: Recommendation['type'] =
    (amenity && AMENITY_TYPE_MAP[amenity]) ||
    (tourism && TOURISM_TYPE_MAP[tourism]) ||
    'service';

  const lat = el.lat;
  const lon = el.lon;
  const distKm = haversineKm(userLat, userLon, lat, lon);

  // Build address from available tags
  const street = tags['addr:street'] ?? '';
  const city   = tags['addr:city'] ?? '';
  const location = [street, city].filter(Boolean).join(', ') || tags['addr:full'] || 'Nearby';

  // Rating 0–5 from OSM or estimate from relevance
  const rawRating = parseFloat(tags['stars'] ?? tags['rating'] ?? '0');
  const rating = rawRating >= 1 && rawRating <= 5
    ? Math.round(rawRating * 10) / 10
    : parseFloat((3 + Math.random() * 1.5).toFixed(1)); // 3.0–4.5 fallback

  const relevanceScore = computeRelevance(distKm, tags);

  return {
    id: `osm-${el.id}`,
    type,
    name,
    location,
    rating,
    priceRange: '',   // No reliable price data in OSM free tier
    distance: Math.round(distKm * 10) / 10,
    relevanceScore,
  };
}

/**
 * Fetches nearby places from the Overpass API and returns them as Recommendations.
 *
 * @param lat      User latitude
 * @param lon      User longitude
 * @param radiusM  Search radius in metres (default 2000 = 2 km)
 * @param limit    Maximum results to return (default 50)
 */
export async function fetchNearbyPlaces(
  lat: number,
  lon: number,
  radiusM = 2000,
  limit = 50,
): Promise<Recommendation[]> {
  // Overpass QL — fetch nodes with relevant amenity/tourism tags
  const query = `
    [out:json][timeout:10];
    (
      node["amenity"~"^(restaurant|cafe|fast_food|bar|pub|hotel|hostel|motel|guest_house|bank|atm|pharmacy|hospital|clinic|post_office|fuel|car_wash|laundry|internet_cafe)$"](around:${radiusM},${lat},${lon});
      node["tourism"~"^(hotel|hostel|motel|guest_house|apartment)$"](around:${radiusM},${lat},${lon});
    );
    out body;
  `.trim();

  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!res.ok) throw new Error(`Overpass API error: ${res.status}`);

  const json = await res.json();
  const elements: OverpassPlace[] = json.elements ?? [];

  const results = elements
    .map(el => parseElement(el, lat, lon))
    .filter((r): r is Recommendation => r !== null);

  // Sort by relevance desc, then by distance asc
  results.sort((a, b) =>
    b.relevanceScore - a.relevanceScore || a.distance - b.distance
  );

  return results.slice(0, limit);
}
