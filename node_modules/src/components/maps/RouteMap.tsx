/**
 * RouteMap — Interactive Leaflet map displaying event markers and route paths.
 * Replaces the previous Mapbox implementation while keeping the identical
 * React prop signature so TravelPlanner requires no structural component changes.
 */

import 'leaflet/dist/leaflet.css';
import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin } from 'lucide-react';

const ORS_KEY = import.meta.env.VITE_ORS_API_KEY as string;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MapMarker {
  longitude: number;
  latitude: number;
  label: string;
  color?: string;
}

export interface RouteMapProps {
  routeGeometry?: GeoJSON.LineString | null;
  markers?: MapMarker[];
  congestion?: string[]; // Kept for prop compatibility
  className?: string;
}

// ─── Custom Icons ─────────────────────────────────────────────────────────────

const createCustomIcon = (color: string, label: string) => {
  const html = `
    <div class="flex flex-col items-center shadow-sm">
      <div
        class="flex items-center gap-1 px-2 py-1 rounded-full text-white text-xs font-semibold shadow-md"
        style="background-color: ${color};"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        <span class="max-w-[120px] truncate" style="display: block; margin-left: 2px;">${label}</span>
      </div>
      <div
        class="w-0 h-0"
        style="border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid ${color};"
      ></div>
    </div>
  `;

  return new L.DivIcon({
    html,
    className: 'custom-leaflet-marker',
    iconSize: [80, 40],
    iconAnchor: [40, 40], // Anchor at bottom center
  });
};

// ─── Bounds Updater ───────────────────────────────────────────────────────────

function BoundsUpdater({ markers, geometry }: { markers: MapMarker[], geometry?: GeoJSON.LineString | null }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    
    const latLngs: L.LatLng[] = [];

    // Add marker bounds
    if (markers && markers.length > 0) {
      markers.forEach(m => latLngs.push(L.latLng(m.latitude, m.longitude)));
    }

    // Add geometry bounds
    if (geometry && geometry.coordinates && geometry.coordinates.length > 0) {
      geometry.coordinates.forEach(coord => {
        latLngs.push(L.latLng(coord[1], coord[0])); // GeoJSON is [lng, lat]
      });
    }

    if (latLngs.length > 0) {
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [map, markers, geometry]);

  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RouteMap({
  routeGeometry,
  markers = [],
  className = '',
}: RouteMapProps) {

  if (!ORS_KEY) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-xl border border-dashed border-gray-300 text-gray-500 text-sm ${className}`}>
        <div className="text-center p-6">
          <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="font-medium">Map unavailable</p>
          <p className="text-xs mt-1">Set VITE_ORS_API_KEY in your .env file</p>
        </div>
      </div>
    );
  }

  // Default to NYC if no markers
  const defaultCenter: [number, number] = markers && markers[0]
    ? [markers[0].latitude, markers[0].longitude]
    : [40.7128, -74.0060];

  // Map GeoJSON [lng, lat] to Leaflet [lat, lng]
  const polylinePositions: [number, number][] = useMemo(() => {
    if (!routeGeometry || !routeGeometry.coordinates || routeGeometry.coordinates.length === 0) {
      return [];
    }
    return (routeGeometry.coordinates as [number, number][]).map(coord => [coord[1], coord[0]] as [number, number]);
  }, [routeGeometry]);

  return (
    <div className={`rounded-xl overflow-hidden border border-gray-200 shadow-sm relative z-0 ${className}`}>
      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ width: '100%', height: '100%', minHeight: '300px' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <BoundsUpdater markers={markers} geometry={routeGeometry} />

        {/* Use ternary instead of && to prevent React from trying to render false inside Leaflet context */}
        {polylinePositions.length > 0 ? (
          <Polyline
            positions={polylinePositions}
            color="#3b82f6"
            weight={5}
            opacity={0.8}
            lineCap="round"
            lineJoin="round"
          />
        ) : null}

        {markers && markers.map((m, i) => (
          <Marker
            key={`marker-${i}-${m.latitude}-${m.longitude}`}
            position={[m.latitude, m.longitude]}
            icon={createCustomIcon(m.color ?? '#3b82f6', m.label)}
            zIndexOffset={1000}
          />
        ))}
      </MapContainer>
    </div>
  );
}
