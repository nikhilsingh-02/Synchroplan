import { TravelRoute } from '../../types';

export interface RouteResult {
  route: TravelRoute;
  originCoords: { latitude: number; longitude: number };
  destCoords: { latitude: number; longitude: number };
  geometry: GeoJSON.LineString;
}

import { geocodeAddress as googleGeocode, reverseGeocodeAddress as googleReverse } from './google-maps.service';

const OSRM_URL = 'https://router.project-osrm.org/route/v1';

async function geocode(address: string) {
  const googleRes = await googleGeocode(address);
  if (googleRes) return { latitude: googleRes.latitude, longitude: googleRes.longitude };

  const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`);
  const data = await res.json();
  if (!data || data.length === 0) throw new Error(`Could not geocode ${address}`);
  return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
}

export async function reverseGeocodeAddress(lat: number, lng: number): Promise<string | null> {
  const googleRes = await googleReverse(lat, lng);
  if (googleRes) return googleRes;

  return null;
}

export async function geocodeAndCalculateRoute(
  origin: string,
  destination: string,
  mode: TravelRoute['mode'] = 'driving'
): Promise<RouteResult | null> {
  const originCoords = await geocode(origin);
  const destCoords = await geocode(destination);

  let osrmProfile = 'driving';
  if (mode === 'walking') osrmProfile = 'foot';
  if (mode === 'cycling') osrmProfile = 'bike';
  
  const url = `${OSRM_URL}/${osrmProfile}/${originCoords.longitude},${originCoords.latitude};${destCoords.longitude},${destCoords.latitude}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  const data = await res.json();
  
  if (data.code !== 'Ok') throw new Error('OSRM route failed');
  
  const route = data.routes[0];
  const durationMin = Math.round(route.duration / 60);
  const distanceKm = Math.round(route.distance / 100) / 10;
  
  return {
    route: {
      id: crypto.randomUUID(),
      from: origin,
      to: destination,
      mode,
      duration: durationMin,
      distance: distanceKm,
      cost: 0,
      arrivalTime: new Date(Date.now() + durationMin * 60000).toISOString(),
      status: 'optimal',
      trafficLevel: 'low'
    },
    originCoords,
    destCoords,
    geometry: route.geometry
  };
}
