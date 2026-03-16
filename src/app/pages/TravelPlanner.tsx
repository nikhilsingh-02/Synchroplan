import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router';
import { useApp } from '../context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Navigation,
  Car,
  Bus,
  Footprints,
  Bike,
  Clock,
  IndianRupee,
  TrendingUp,
  AlertCircle,
  MapPin,
  Zap,
  Route as RouteIcon,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { geocodeAndCalculateRoute, type RouteResult, type GeocodedLocation } from '../../services/maps/ors.service';
import type { TravelRoute } from '../../types';
import { RouteMap, type MapMarker } from '../../components/maps/RouteMap';

export const TravelPlanner: React.FC = () => {
  const { routes, addRoute, updateEvent, events } = useApp();
  const location = useLocation();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [mode, setMode] = useState<TravelRoute['mode']>('driving');
  const [isCalculating, setIsCalculating] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // ── Read query params from navigation (e.g. from Dashboard "View Route") ──
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const destParam = params.get('destination');
    const latParam  = params.get('lat');
    const lngParam  = params.get('lng');

    // Pre-fill destination if provided
    if (destParam) {
      setDestination(destParam);
    }

    // Validate lat/lng — guard against literal 'undefined' strings or NaN
    const lat = latParam !== null && latParam !== 'undefined' ? parseFloat(latParam) : NaN;
    const lng = lngParam !== null && lngParam !== 'undefined' ? parseFloat(lngParam) : NaN;

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      // Coordinates absent or invalid; destination field is pre-filled above;
      // the user can type an origin and hit Find Routes normally.
      if (latParam || lngParam) {
        console.warn('[TravelPlanner] Invalid coordinates in URL — lat:', latParam, 'lng:', lngParam);
      }
    }
    // Note: if coordinates ARE valid they are available for future map pre-centering
    // (currently the map centres on the calculated route, so no extra action needed).
  }, [location.search]);


  // Map state — updated after a successful route calculation
  const [activeRouteResult, setActiveRouteResult] = useState<RouteResult | null>(null);
  const [activeMarkers, setActiveMarkers] = useState<MapMarker[]>([]);

  // ── Route calculation ──────────────────────────────────────────────────────

  const handleSearch = async () => {
    if (!origin || !destination) {
      toast.error('Please enter both origin and destination');
      return;
    }

    setIsCalculating(true);

    const modesWanted: TravelRoute['mode'][] =
      mode === 'driving'
        ? ['driving', 'transit', 'walking']
        : [mode];

    try {
      // Calculate all requested modes in parallel
      const results = await Promise.all(
        modesWanted.map(m => geocodeAndCalculateRoute(origin, destination, m))
      );

      const successful = results.filter(Boolean) as Exclude<typeof results[0], null>[];

      if (successful.length === 0) {
        toast.error('Could not calculate routes. Check the addresses and your Mapbox token.');
        return;
      }

      // Persist each route via AppContext (dual-write to Supabase + local state)
      for (const { route, originCoords, destCoords } of successful) {
        const newRoute: Omit<TravelRoute, 'id'> = {
          from: origin,
          to: destination,
          mode: modesWanted[successful.indexOf({ route, originCoords, destCoords })] ?? mode,
          duration: route.duration,
          distance: route.distance,
          cost: estimateCost(route.distance, mode),
          arrivalTime: route.arrivalTime,
          status: route.status,
          trafficLevel: route.trafficLevel,
        };
        addRoute(newRoute);

        // Geocode and update event coordinates if destination matches an event
        const matchedOriginEvent = events.find(e =>
          e.location.toLowerCase().includes(origin.toLowerCase()) ||
          origin.toLowerCase().includes(e.location.toLowerCase())
        );
        const matchedDestEvent = events.find(e =>
          e.location.toLowerCase().includes(destination.toLowerCase()) ||
          destination.toLowerCase().includes(e.location.toLowerCase())
        );

        if (matchedOriginEvent && originCoords) {
          updateEvent(matchedOriginEvent.id, {
            latitude: originCoords.latitude,
            longitude: originCoords.longitude,
          });
        }
        if (matchedDestEvent && destCoords) {
          updateEvent(matchedDestEvent.id, {
            latitude: destCoords.latitude,
            longitude: destCoords.longitude,
          });
        }
      }

      // Show the first result on the map
      const first = successful[0];
      setActiveRouteResult(first.route);
      setActiveMarkers([
        {
          longitude: first.originCoords.longitude,
          latitude: first.originCoords.latitude,
          label: origin,
          color: '#3b82f6',
        },
        {
          longitude: first.destCoords.longitude,
          latitude: first.destCoords.latitude,
          label: destination,
          color: '#10b981',
        },
      ]);

      setShowResults(true);
      toast.success(`${successful.length} route${successful.length > 1 ? 's' : ''} calculated`);
    } catch (err) {
      console.error('[TravelPlanner] Route calculation error:', err);
      toast.error('Something went wrong calculating the route.');
    } finally {
      setIsCalculating(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  const estimateCost = (distanceKm: number, m: TravelRoute['mode']): number => {
    switch (m) {
      case 'driving': return Math.round(distanceKm * 8 * 10) / 10;   // ₹8/km approx
      case 'transit': return Math.round(distanceKm * 2 * 10) / 10;   // ₹2/km approx
      case 'walking': return 0;
      case 'cycling': return 0;
    }
  };

  const getModeIcon = (m: string) => {
    switch (m) {
      case 'driving': return <Car className="h-4 w-4" />;
      case 'transit': return <Bus className="h-4 w-4" />;
      case 'walking': return <Footprints className="h-4 w-4" />;
      case 'cycling': return <Bike className="h-4 w-4" />;
      default: return <Navigation className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'optimal':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Optimal</Badge>;
      case 'delayed':
        return <Badge variant="destructive">Delayed</Badge>;
      default:
        return <Badge variant="secondary">Normal</Badge>;
    }
  };

  // Most recently calculated routes (last N added to the store)
  const recentRoutes = showResults ? routes.slice(-modesWanted().length).reverse() : [];

  function modesWanted() {
    return mode === 'driving' ? ['driving', 'transit', 'walking'] : [mode];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Travel Planner</h1>
        <p className="text-gray-600">Optimize routes with real-time traffic data</p>
      </div>

      {/* Route Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RouteIcon className="h-5 w-5" />
            Plan Your Route
          </CardTitle>
          <CardDescription>Find the best way to get to your destination</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="origin">Origin</Label>
                <Input
                  id="origin"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="Enter starting location"
                />
              </div>
              <div>
                <Label htmlFor="destination">Destination</Label>
                <Input
                  id="destination"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Enter destination"
                />
              </div>
            </div>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="mode">Preferred Mode</Label>
                <Select value={mode} onValueChange={(value: any) => setMode(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="driving">Driving</SelectItem>
                    <SelectItem value="transit">Public Transit</SelectItem>
                    <SelectItem value="walking">Walking</SelectItem>
                    <SelectItem value="cycling">Cycling</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSearch} className="px-8" disabled={isCalculating}>
                {isCalculating
                  ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  : <Navigation className="h-4 w-4 mr-2" />
                }
                {isCalculating ? 'Calculating…' : 'Find Routes'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map — shown after first successful route calculation */}
      {showResults && activeRouteResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Route Map
            </CardTitle>
            <CardDescription>
              Traffic coloring: <span className="text-green-600 font-medium">green</span> = clear ·{' '}
              <span className="text-yellow-600 font-medium">yellow</span> = moderate ·{' '}
              <span className="text-red-600 font-medium">red</span> = heavy
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <RouteMap
              routeGeometry={activeRouteResult.geometry}
              markers={activeMarkers}
              congestion={activeRouteResult.congestionSegments}
              className="h-72"
            />
          </CardContent>
        </Card>
      )}

      {/* Quick Route to Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Routes to Events
          </CardTitle>
          <CardDescription>Select an event to plan your route</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {events.slice(0, 4).map((event) => (
              <button
                key={event.id}
                onClick={() => {
                  setDestination(event.location);
                  toast.info(`Destination set to ${event.location}`);
                }}
                className="p-3 border rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{event.title}</p>
                    <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </p>
                  </div>
                  <Navigation className="h-4 w-4 text-blue-600" />
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Route Results */}
      {showResults && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Available Routes</h2>
          {recentRoutes.map((route) => (
            <Card key={route.id} className={route.status === 'optimal' ? 'border-green-300 bg-green-50' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      {getModeIcon(route.mode)}
                    </div>
                    <div>
                      <h3 className="font-semibold capitalize">{route.mode}</h3>
                      <p className="text-sm text-gray-600">{route.distance} km</p>
                    </div>
                  </div>
                  {getStatusBadge(route.status)}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Duration</p>
                      <p className="font-semibold">{route.duration} min</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Cost</p>
                      <p className="font-semibold">₹{route.cost.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Traffic</p>
                      <p className="font-semibold capitalize">{route.trafficLevel || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Arrival</p>
                      <p className="font-semibold text-sm">
                        {new Date(route.arrivalTime).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {route.status === 'delayed' && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-900">Heavy traffic detected</p>
                      <p className="text-xs text-red-700">Consider alternative routes or departure time</p>
                    </div>
                  </div>
                )}

                {route.status === 'optimal' && (
                  <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
                    <Zap className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-900">Recommended Route</p>
                      <p className="text-xs text-green-700">Best balance of time and cost</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button className="flex-1">
                    <Navigation className="h-4 w-4 mr-2" />
                    Start Navigation
                  </Button>
                  <Button variant="outline">Share</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Live Traffic Updates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Live Traffic Updates
          </CardTitle>
          <CardDescription>Real-time traffic conditions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {routes.filter(r => r.trafficLevel === 'high').slice(0, 3).length > 0
              ? routes.filter(r => r.trafficLevel === 'high').slice(0, 3).map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                    <div>
                      <p className="font-medium text-sm">{r.from} → {r.to}</p>
                      <p className="text-xs text-gray-600">Heavy congestion</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-red-700">+{Math.round(r.duration * 0.3)} min</span>
                </div>
              ))
              : (
                /* Fallback placeholder if no real delayed routes exist yet */
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                    <div>
                      <p className="font-medium text-sm">All monitored routes</p>
                      <p className="text-xs text-gray-600">Plan a route to see live traffic data</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-green-700">On time</span>
                </div>
              )
            }
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
