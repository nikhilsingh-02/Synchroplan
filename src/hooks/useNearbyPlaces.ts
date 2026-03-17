/**
 * useNearbyPlaces
 *
 * Two-phase TanStack Query hook:
 *  1. Fetches the user's GPS location via the userLocation service
 *  2. Queries the Overpass OSM API for nearby places (restaurants, cafes, hotels, services)
 *
 * Results are cached with a 10-minute stale time and auto-refresh.
 * Query key: ['nearbyPlaces', lat, lng]
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUserLocation, type UserCoordinates } from '../services/location/userLocation';
import { fetchNearbyPlaces, type NearbyPlace } from '../services/places/overpass.service';
import type { Recommendation } from '../types';

// ─── Coordinate → Recommendation adapter ─────────────────────────────────────
// Bridges the NearbyPlace shape into the existing Recommendation interface
// so the Recommendations.tsx UI requires zero structural changes.

function toRecommendation(place: NearbyPlace): Recommendation {
  const typeMap: Record<NearbyPlace['category'], Recommendation['type']> = {
    restaurant: 'restaurant',
    cafe:       'restaurant',  // collapse into restaurant tab
    hotel:      'hotel',
    coworking:  'service',
    service:    'service',
  };

  // Relevance: closer = higher, caps at 1.0 within 200 m
  const relevanceScore = Math.min(1, Math.max(0.1, 1 - place.distance / 2));

  // Deterministic synthetic rating based on OSM id characters (3.0 – 4.4)
  const idSum = place.id.split('').reduce((n, c) => n + c.charCodeAt(0), 0);
  const rating = Math.round((3 + (idSum % 15) / 10) * 10) / 10;

  return {
    id:             place.id,
    type:           typeMap[place.category] ?? 'service',
    name:           place.name,
    location:       place.address ?? 'Nearby',
    rating,
    priceRange:     '',   // OSM does not provide pricing
    distance:       place.distance,
    relevanceScore: Math.round(relevanceScore * 100) / 100,
  };
}

// ─── Exported types ───────────────────────────────────────────────────────────

export interface UseNearbyPlacesReturn {
  places: Recommendation[];
  rawPlaces: NearbyPlace[];
  userLocation: UserCoordinates | null;
  isLoading: boolean;
  isLocating: boolean;
  error: string | null;
  refetch: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNearbyPlaces(): UseNearbyPlacesReturn {
  const [userLocation, setUserLocation] = useState<UserCoordinates | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(true);

  // Phase 1 – obtain coordinates once on mount
  useEffect(() => {
    let cancelled = false;
    setIsLocating(true);

    getUserLocation()
      .then(coords => {
        if (!cancelled) {
          setUserLocation(coords);
          setLocationError(null);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          console.error('[NearbyPlaces] Error getting location:', err.message);
          setLocationError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLocating(false);
      });

    return () => { cancelled = true; };
  }, []);

  // Phase 2 – TanStack Query: fetch places once coordinates are known
  const lat = userLocation?.latitude  ?? 0;
  const lng = userLocation?.longitude ?? 0;

  const query = useQuery<NearbyPlace[], Error>({
    queryKey:        ['nearbyPlaces', lat, lng],
    queryFn:         () => {
      console.log('[NearbyPlaces] Fetching places for:', lat, lng);
      return fetchNearbyPlaces(lat, lng, 5000, 60);
    },
    enabled:         !isLocating && !!userLocation,
    staleTime:       10 * 60 * 1000,       // 10 minutes
    refetchInterval: 10 * 60 * 1000,
    retry:           2,
    meta: {
      onError: (err: Error) => {
        console.error('[NearbyPlaces] Error fetching places:', err.message);
      },
    },
  });

  const rawPlaces  = query.data ?? [];
  const places     = rawPlaces.map(toRecommendation);
  const isLoading  = isLocating || query.isLoading || query.isFetching;
  const queryError = query.error ? (query.error as Error).message : null;
  const error      = locationError ?? queryError;

  return {
    places,
    rawPlaces,
    userLocation,
    isLoading,
    isLocating,
    error,
    refetch: () => void query.refetch(),
  };
}
