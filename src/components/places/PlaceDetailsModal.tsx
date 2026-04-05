import React, { useEffect } from 'react';
import { Button } from '../../app/components/ui/button';
import { Badge } from '../../app/components/ui/badge';
import type { NearbyPlace } from '../../services/places/overpass.service';
import {
  X,
  MapPin,
  Navigation,
  ExternalLink,
  Phone,
  Globe,
  Crosshair,
  Timer,
  Activity,
  ShoppingCart,
} from 'lucide-react';

interface PlaceDetailsModalProps {
  place: NearbyPlace | null;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  restaurant: 'Restaurant / Cafe',
  cafe: 'Cafe',
  hotel: 'Accommodation',
  coworking: 'Workspace',
  hospital: 'Healthcare',
  pharmacy: 'Pharmacy',
  supermarket: 'Grocery',
  service: 'Service / Shop',
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  restaurant: <MapPin className="h-4 w-4 text-orange-600" />,
  hotel: <MapPin className="h-4 w-4 text-blue-600" />,
  hospital: <Activity className="h-4 w-4 text-red-600" />,
  pharmacy: <Activity className="h-4 w-4 text-emerald-600" />,
  supermarket: <ShoppingCart className="h-4 w-4 text-purple-600" />,
  service: <Crosshair className="h-4 w-4 text-gray-600" />,
};

function googleMapsUrl(lat: number, lon: number, name: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&destination_place_id=${encodeURIComponent(name)}`;
}

export const PlaceDetailsModal: React.FC<PlaceDetailsModalProps> = ({ place, onClose }) => {
  useEffect(() => {
    if (!place) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [place, onClose]);

  if (!place) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-8 pb-4 border-b border-gray-50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-black text-gray-900 leading-tight">
                {place.name}
              </h2>
              <Badge className="mt-2" variant="secondary">
                {CATEGORY_LABELS[place.category] || 'Near You'}
              </Badge>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0">
               {CATEGORY_ICONS[place.category] || <MapPin className="h-5 w-5 text-gray-400" />}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Location</p>
              <p className="text-gray-800 font-medium">{place.address}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0">
               <Timer className="h-5 w-5 text-indigo-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Distance</p>
              <p className="text-gray-800 font-medium">{place.distance.toFixed(1)} km from current position</p>
            </div>
          </div>

          {place.openingHours && (
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0">
                 <Timer className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Hours</p>
                <p className="text-gray-800 text-sm italic">{place.openingHours}</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-8 pt-0 flex flex-col gap-3">
          <Button 
            className="w-full h-12 rounded-2xl text-base font-bold shadow-lg shadow-indigo-200"
            onClick={() => window.open(googleMapsUrl(place.latitude, place.longitude, place.name), '_blank')}
          >
            <Navigation className="h-5 w-5 mr-2" />
            Navigate Now
          </Button>
          <Button variant="ghost" onClick={onClose} className="rounded-2xl text-gray-500">
            Close DETAILS
          </Button>
        </div>
      </div>
    </div>
  );
};
