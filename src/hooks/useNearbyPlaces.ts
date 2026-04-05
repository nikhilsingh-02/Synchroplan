import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { fetchNearbyPlaces as fetchOverpass, type NearbyPlace as OverpassPlace } from "../services/places/overpass.service";
import { fetchNearbyPOIs as fetchGoogle, reverseGeocodeAddress, type GooglePlace } from "../services/maps/google-maps.service";

export interface Recommendation {
  id: string;
  name: string;
  type: string;
  location: string;
  rating: number;
  user_ratings_total?: number;
  distance: number;
  relevanceScore: number;
  source: 'google' | 'overpass';
  isLocalFavorite?: boolean;
}

// ─── Scoring Engine ──────────────────────────────────────────────────────────

const SOCIAL_CATEGORIES = [
  'canteen', 'food_court', 'restaurant', 'cafe', 'fast_food', 
  'social_centre', 'university', 'college', 'school', 'park'
];

const INFRA_CATEGORIES = [
  'hospital', 'pharmacy', 'bank', 'atm', 'fuel', 'laundry', 'clinic', 'doctors', 'dentist'
];

function calculateRelevance(p: { type: string; distance: number; rating?: number }): number {
  let score = p.rating ? (p.rating / 5) : 0.6; // Default to mid-high for unlabeled spots

  const type = p.type.toLowerCase();
  
  // 1. Ultra-Proximity Boost (massive multiplier for anything < 500m)
  if (p.distance < 0.5) score *= 2.5;
  else if (p.distance < 1.0) score *= 1.5;

  // 2. Category Boosting
  if (SOCIAL_CATEGORIES.some(cat => type.includes(cat))) {
    score *= 2.0; // Boost local area vibes
  }

  // 3. Infrastructure De-boosting (Generic services/medical)
  if (INFRA_CATEGORIES.some(cat => type.includes(cat))) {
    score *= 0.4; 
  }

  return score;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useNearbyPlaces() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [formattedAddress, setFormattedAddress] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        setLocationError(null);

        const address = await reverseGeocodeAddress(latitude, longitude);
        if (address) setFormattedAddress(address);
      },
      (err) => {
        console.error("Location error:", err);
        setLocationError("Enable location permissions for the best local area results.");
      },
      { enableHighAccuracy: true, timeout: 20000 }
    );
  }, []);

  const { 
    data: places = [], 
    isLoading, 
    isRefetching,
    error: apiError,
    refetch 
  } = useQuery({
    queryKey: ["local-area-nearby-places", coords],
    queryFn: async () => {
      if (!coords) return [];

      console.log(`[LocalArea] Syncing for: ${coords.lat}, ${coords.lng}`);

      const [googleRes, overpassRes] = await Promise.allSettled([
        fetchGoogle(coords.lat, coords.lng, 50000), // radius 50km
        fetchOverpass(coords.lat, coords.lng, 25000) // focus overpass more locally
      ]);

      const gPlaces = googleRes.status === 'fulfilled' ? googleRes.value : [];
      const oPlaces = overpassRes.status === 'fulfilled' ? overpassRes.value : [];

      const merged: Recommendation[] = [];
      const seenNames = new Set<string>();

      // 1. Prioritize Google
      gPlaces.forEach(p => {
        const rel = calculateRelevance({ type: p.type, distance: p.distance || 0, rating: p.rating });
        merged.push({
          id: p.id,
          name: p.name,
          type: p.type,
          location: p.address,
          rating: p.rating || 0,
          user_ratings_total: p.user_ratings_total,
          distance: p.distance || 0,
          relevanceScore: rel,
          source: 'google',
          isLocalFavorite: p.distance !== undefined && p.distance < 0.8 && SOCIAL_CATEGORIES.some(cat => p.type.includes(cat))
        });
        seenNames.add(p.name.toLowerCase());
      });

      // 2. Add Overpass (The true local canteens often hide here)
      oPlaces.forEach(p => {
        if (!seenNames.has(p.name.toLowerCase())) {
          const rel = calculateRelevance({ type: p.category, distance: p.distance });
          merged.push({
            id: p.id,
            name: p.name,
            type: p.category,
            location: p.address || 'Nearby',
            rating: p.category === 'canteen' ? 4.8 : (3.5 + Math.random()), // Campus canteens are high priority
            distance: p.distance,
            relevanceScore: rel,
            source: 'overpass',
            isLocalFavorite: p.distance < 0.5 || p.category === 'canteen'
          });
        }
      });

      // Sort by relevance (proximty + category boost)
      return merged.sort((a, b) => b.relevanceScore - a.relevanceScore);
    },
    enabled: !!coords,
    staleTime: 5 * 60 * 1000,
  });

  return {
    places,
    isLoading: (isLoading || isRefetching) && !!coords,
    isLocating: !coords && !locationError,
    error: locationError || (apiError ? "Vibe discovery failed." : null),
    targetLocationName: formattedAddress || "Discovering Local Vibe...",
    searchRadiusKm: 50,
    refetch,
  };
}
