/**
 * RouteMap — Interactive Leaflet map displaying event markers and a
 * traffic-coloured route path.
 *
 * The route is drawn as multiple coloured Polyline segments based on live
 * congestion data returned by useTrafficPoller
 */

import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

export interface TrafficSegment {
  coordinates: [number, number][];
  congestionRatio: number;
}

export interface MapMarker {
  longitude: number;
  latitude:  number;
  label:     string;
  color?:    string;
}

export interface RouteMapProps {
  routeGeometry?:   GeoJSON.LineString | null;
  markers?:         MapMarker[];
  trafficSegments?: TrafficSegment[];
  congestion?:      string[];
  className?:       string;
}

function segmentColor(ratio: number): string {
  if (ratio > 1.5) return '#ef4444'; // red   — heavy
  if (ratio > 1.2) return '#f59e0b'; // amber — moderate
  return '#22c55e';                   // green — clear
}

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
    className:  'custom-leaflet-marker',
    iconSize:   [80, 40],
    iconAnchor: [40, 40],
  });
};

function BoundsUpdater({
  markers,
  geometry,
}: {
  markers:   MapMarker[];
  geometry?: GeoJSON.LineString | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const latLngs: L.LatLng[] = [];

    markers.forEach(m => latLngs.push(L.latLng(m.latitude, m.longitude)));

    if (geometry?.coordinates?.length) {
      geometry.coordinates.forEach(c =>
        latLngs.push(L.latLng(c[1], c[0]))
      );
    }

    if (latLngs.length > 0) {
      map.fitBounds(L.latLngBounds(latLngs), { padding: [50, 50], maxZoom: 16 });
    }
  }, [map, markers, geometry]);

  return null;
}

export function RouteMap({
  routeGeometry,
  markers         = [],
  trafficSegments = [],
  className       = '',
}: RouteMapProps) {
  const defaultCenter: [number, number] =
    markers[0] ? [markers[0].latitude, markers[0].longitude] : [20.5937, 78.9629];

  const fallbackPositions: [number, number][] = useMemo(() => {
    if (trafficSegments.length > 0) return [];
    if (!routeGeometry?.coordinates?.length) return [];
    return (routeGeometry.coordinates as [number, number][]).map(
      c => [c[1], c[0]] as [number, number]
    );
  }, [routeGeometry, trafficSegments]);

  return (
    <div
      className={`rounded-xl overflow-hidden border border-gray-200 shadow-sm relative z-0 ${className}`}
    >
      <MapContainer
        center={defaultCenter}
        zoom={12}
        style={{ width: '100%', height: '100%', minHeight: '300px' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <BoundsUpdater markers={markers} geometry={routeGeometry} />

        {trafficSegments.length > 0
          ? trafficSegments.map((seg, i) => (
              <Polyline
                key={`seg-${i}`}
                positions={seg.coordinates}
                color={segmentColor(seg.congestionRatio)}
                weight={6}
                opacity={0.85}
                lineCap="round"
                lineJoin="round"
              />
            ))
          : fallbackPositions.length > 0
            ? (
                <Polyline
                  positions={fallbackPositions}
                  color="#3b82f6"
                  weight={5}
                  opacity={0.8}
                  lineCap="round"
                  lineJoin="round"
                />
              )
            : null
        }

        {markers.map((m, i) => (
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
