/**
 * PlaceDetailsModal
 *
 * Displays rich details for a selected NearbyPlace from the Overpass service.
 * Receives a NearbyPlace (which carries lat/lon) so we can generate
 * a real OpenStreetMap link and a Google Maps navigation URL.
 *
 * Usage:
 *   <PlaceDetailsModal place={selectedPlace} onClose={() => setSelectedPlace(null)} />
 */

import React, { useEffect } from 'react';
import { Button } from '../../app/components/ui/button';
import { Badge } from '../../app/components/ui/badge';
import type { NearbyPlace } from '../../services/places/overpass.service';
import {
  X,
  MapPin,
  Navigation,
  ExternalLink,
  Clock,
  Tag,
  Crosshair,
} from 'lucide-react';

// ─── Props ────────────────────────────────────────────────────────────────────

interface PlaceDetailsModalProps {
  place: NearbyPlace | null;
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<NearbyPlace['category'], string> = {
  restaurant: 'Restaurant',
  cafe:       'Café',
  hotel:      'Hotel',
  coworking:  'Coworking Space',
  service:    'Service',
};

const CATEGORY_COLORS: Record<NearbyPlace['category'], string> = {
  restaurant: 'bg-orange-100 text-orange-800 border-orange-200',
  cafe:       'bg-amber-100 text-amber-800 border-amber-200',
  hotel:      'bg-blue-100 text-blue-800 border-blue-200',
  coworking:  'bg-purple-100 text-purple-800 border-purple-200',
  service:    'bg-gray-100 text-gray-700 border-gray-200',
};

function osmUrl(lat: number, lon: number): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}&zoom=17`;
}

function googleMapsUrl(lat: number, lon: number, name: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&destination_place_id=${encodeURIComponent(name)}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const PlaceDetailsModal: React.FC<PlaceDetailsModalProps> = ({ place, onClose }) => {
  // Close on Escape key
  useEffect(() => {
    if (!place) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [place, onClose]);

  if (!place) return null;

  const categoryLabel = CATEGORY_LABELS[place.category] ?? place.category;
  const categoryColor = CATEGORY_COLORS[place.category] ?? CATEGORY_COLORS.service;

  return (
    /* ── Backdrop ── */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="place-modal-title"
    >
      {/* Dark overlay — click to dismiss */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* ── Panel ── */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100">
          <div className="flex-1 pr-4">
            <h2 id="place-modal-title" className="text-xl font-bold text-gray-900 leading-tight">
              {place.name}
            </h2>
            <Badge className={`mt-2 text-xs border ${categoryColor}`} variant="outline">
              {categoryLabel}
            </Badge>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Close details"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">

          {/* Distance */}
          <div className="flex items-center gap-3 text-sm">
            <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <MapPin className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Distance</p>
              <p className="text-gray-800 font-semibold">{place.distance} km from your location</p>
            </div>
          </div>

          {/* Address */}
          {place.address && (
            <div className="flex items-center gap-3 text-sm">
              <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                <Tag className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Address</p>
                <p className="text-gray-800">{place.address}</p>
              </div>
            </div>
          )}

          {/* Opening Hours */}
          {place.openingHours && (
            <div className="flex items-center gap-3 text-sm">
              <div className="h-8 w-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Opening Hours</p>
                <p className="text-gray-800 font-mono text-xs leading-relaxed">{place.openingHours}</p>
              </div>
            </div>
          )}

          {/* Coordinates */}
          <div className="flex items-center gap-3 text-sm">
            <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
              <Crosshair className="h-4 w-4 text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Coordinates</p>
              <p className="text-gray-700 font-mono text-xs">
                {place.latitude.toFixed(6)}, {place.longitude.toFixed(6)}
              </p>
            </div>
          </div>

          {/* OSM ID (subtle) */}
          <div className="text-xs text-gray-400 pl-11">
            OpenStreetMap ID: {place.id.replace('osm-', '')}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 pb-6 flex flex-col gap-2">

          {/* Navigate (Google Maps directions) */}
          <Button
            className="w-full flex items-center justify-center gap-2"
            onClick={() => window.open(googleMapsUrl(place.latitude, place.longitude, place.name), '_blank', 'noopener,noreferrer')}
          >
            <Navigation className="h-4 w-4" />
            Navigate
          </Button>

          {/* View on OpenStreetMap */}
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={() => window.open(osmUrl(place.latitude, place.longitude), '_blank', 'noopener,noreferrer')}
          >
            <ExternalLink className="h-4 w-4" />
            View on OpenStreetMap
          </Button>

          {/* Close */}
          <Button
            variant="ghost"
            className="w-full text-gray-500"
            onClick={onClose}
          >
            Close
          </Button>

        </div>
      </div>
    </div>
  );
};
