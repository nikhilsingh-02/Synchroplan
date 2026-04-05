import { TravelRoute } from '../../types';
import { geocodeAndCalculateRoute as orsGeocodeAndRoute } from './ors.service';
import { geocodeAndCalculateRoute as osrmGeocodeAndRoute, reverseGeocodeAddress as osrmReverse } from './osrm.service';

export class MapsApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MapsApiError';
  }
}

export interface RouteResult {
  route: TravelRoute;
  originCoords: { latitude: number; longitude: number };
  destCoords: { latitude: number; longitude: number };
  geometry: GeoJSON.LineString;
}

import { reverseGeocodeAddress as googleReverse } from './google-maps.service';

export async function reverseGeocodeAddress(latitude: number, longitude: number): Promise<string | null> {
  const googleRes = await googleReverse(latitude, longitude);
  if (googleRes) return googleRes;
  return await osrmReverse(latitude, longitude);
}

export async function geocodeAndCalculateRoute(
  origin: string,
  destination: string,
  mode: TravelRoute['mode'],
  departureTime?: string
): Promise<RouteResult | null> {
  try {
    const orsResult = await orsGeocodeAndRoute(origin, destination, mode);
    if (!orsResult) {
      throw new Error("ORS returned null");
    }
    return {
      route: {
        id: crypto.randomUUID(),
        from: origin,
        to: destination,
        mode: mode,
        duration: orsResult.route.duration,
        distance: orsResult.route.distance,
        cost: 0,
        arrivalTime: orsResult.route.arrivalTime,
        status: orsResult.route.status,
        trafficLevel: orsResult.route.trafficLevel
      },
      originCoords: orsResult.originCoords,
      destCoords: orsResult.destCoords,
      geometry: orsResult.route.geometry as GeoJSON.LineString
    };
  } catch (err) {
    console.warn("ORS Failed, falling back to OSRM...", err);
    try {
      const osrmResult = await osrmGeocodeAndRoute(origin, destination, mode);
      return osrmResult;
    } catch (osrmErr) {
       console.error("OSRM Fallback also failed:", osrmErr);
       throw new MapsApiError("All map providers failed to calculate route.");
    }
  }
}
