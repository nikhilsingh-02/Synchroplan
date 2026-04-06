import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router';
import { useApp } from '../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
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
  AlertCircle,
  MapPin,
  Zap,
  Route as RouteIcon,
  Loader2,
  LocateFixed,
  Sparkles,
  ChevronRight,
  TrendingDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { geocodeAndCalculateRoute, type RouteResult, reverseGeocodeAddress } from '../../services/maps/smart-maps.service';
import { getUserLocation } from '../../services/location/userLocation';
import type { TravelRoute } from '../../types';
import { RouteMap, type MapMarker } from '../../components/maps/RouteMap';
import { useTrafficPoller } from '../../hooks/useTrafficPoller';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export const TravelPlanner: React.FC = () => {
  const { routes, addRoute } = useApp();
  const location = useLocation();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [mode, setMode] = useState<TravelRoute['mode']>('driving');
  const [isCalculating, setIsCalculating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [generatedRoutes, setGeneratedRoutes] = useState<TravelRoute[]>([]);
  const [lastUsedModes, setLastUsedModes] = useState<TravelRoute['mode'][]>([]);

  const [activeRouteResult, setActiveRouteResult] = useState<RouteResult | null>(null);
  const [activeMarkers, setActiveMarkers] = useState<MapMarker[]>([]);

  const {
    segments: trafficSegments,
    trafficLevel: liveTrafficLevel,
    isRefreshing,
    refresh: refreshTraffic,
  } = useTrafficPoller(activeRouteResult?.geometry ?? null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const destParam = params.get('destination');
    if (destParam) setDestination(destParam);
  }, [location.search]);

  const handleUseCurrentLocation = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      toast.info('Detecting your location...');
      const coords = await getUserLocation();
      const address = await reverseGeocodeAddress(coords.latitude, coords.longitude);
      setOrigin(address || `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`);
      toast.success('Location locked!');
    } catch (err: any) {
      toast.error('Location detection failed.');
    }
  };

  const estimateCosts = (distanceKm: number) => {
    return {
      uber: Math.round(50 + (distanceKm * 18)),
      auto: Math.round(30 + (distanceKm * 12)),
      bus: 15,
    };
  };

  const handleSearch = async () => {
    if (!origin || !destination) {
      toast.error('Origin and Destination are required.');
      return;
    }

    setIsCalculating(true);
    const modesWanted: TravelRoute['mode'][] = mode === 'driving' ? ['driving', 'transit', 'walking'] : [mode];

    try {
      const results = await Promise.all(
        modesWanted.map(async (m) => {
          const result = await geocodeAndCalculateRoute(origin, destination, m, new Date().toISOString());
          return result ? { ...result, routeMode: m } : null;
        })
      );

      const successful = results.filter(Boolean) as (Exclude<typeof results[0], null>)[];
      if (successful.length === 0) {
        toast.error('No routes found.');
        return;
      }

      const newGenerated: TravelRoute[] = [];

      successful.forEach(({ route, routeMode }) => {
        const routeData = {
          from: origin,
          to: destination,
          mode: routeMode,
          duration: route.duration,
          distance: route.distance,
          cost: routeMode === 'driving' ? estimateCosts(route.distance).uber : (routeMode === 'transit' ? 15 : 0),
          arrivalTime: route.arrivalTime,
          status: route.status,
          trafficLevel: route.trafficLevel,
        };
        addRoute(routeData); // Fire-and-forget to global DB
        // Save locally to prevent React Query invalidation flickers
        newGenerated.push({ ...routeData, id: crypto.randomUUID() } as TravelRoute);
      });

      const first = successful[0];
      setActiveRouteResult(first);
      setActiveMarkers([
        { longitude: first.originCoords.longitude, latitude: first.originCoords.latitude, label: 'Start', color: '#6366f1' },
        { longitude: first.destCoords.longitude, latitude: first.destCoords.latitude, label: 'Goal', color: '#10b981' },
      ]);

      setLastUsedModes(modesWanted);
      setGeneratedRoutes(newGenerated); // Set local state explicitly
      setShowResults(true);
      toast.success('Multi-modal routes optimized!');
    } catch (err) {
      toast.error('Route optimization failed.');
    } finally {
      setIsCalculating(false);
    }
  };

  const getModeIcon = (m: string) => {
    switch (m) {
      case 'driving': return <Car className="h-5 w-5" />;
      case 'transit': return <Bus className="h-5 w-5" />;
      case 'walking': return <Footprints className="h-5 w-5" />;
      case 'cycling': return <Bike className="h-5 w-5" />;
      default: return <Navigation className="h-5 w-5" />;
    }
  };

  const recentRoutes = showResults ? [...generatedRoutes].reverse() : [];

  return (
    <div className="flex flex-col xl:flex-row gap-12 w-full h-full pb-20 fade-in-up">

      {/* ─── Left Column: Form & Insights ─── */}
      <div className="w-full xl:w-[480px] shrink-0 flex flex-col gap-10">
        <div className="space-y-2">
          <h1 className="text-5xl font-heading font-black tracking-tighter text-foreground leading-none">
            Travel <span className="text-gradient-primary">Planner</span>
          </h1>
          <p className="text-muted-foreground font-semibold tracking-tight ml-1">AI-Optimized Multi-Modal Navigation</p>
        </div>

        <Card className="glass border-white/20 rounded-[2.5rem] shadow-2xl overflow-hidden border-0">
          <CardHeader className="p-10 pb-6">
            <CardTitle className="flex items-center gap-3 text-2xl font-black">
              <Sparkles className="h-7 w-7 text-primary animate-pulse" />
              Configure Strategy
            </CardTitle>
          </CardHeader>
          <CardContent className="p-10 pt-0 space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Origin Point</Label>
                <div className="flex gap-3">
                  <Input
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder="Search origin..."
                    className="h-14 rounded-2xl bg-primary/5 border-0 focus-visible:ring-primary font-bold shadow-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleUseCurrentLocation}
                    className="h-14 w-14 rounded-2xl border-0 bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all active:scale-90"
                  >
                    <LocateFixed className="h-6 w-6" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Destination Target</Label>
                <Input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Where to?"
                  className="h-14 rounded-2xl bg-primary/5 border-0 focus-visible:ring-primary font-bold shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-6 pt-2">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Optimization Mode</Label>
                <Select value={mode} onValueChange={(v: any) => setMode(v)}>
                  <SelectTrigger className="h-14 rounded-2xl bg-primary/5 border-0 font-bold focus:ring-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-0 shadow-2xl glass">
                    <SelectItem value="driving" className="font-bold rounded-xl py-3 px-4">Fastest (Driving)</SelectItem>
                    <SelectItem value="transit" className="font-bold rounded-xl py-3 px-4">Economical (Transit)</SelectItem>
                    <SelectItem value="walking" className="font-bold rounded-xl py-3 px-4">Active (Walking)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleSearch}
                className="w-full bg-primary hover:bg-foreground text-primary-foreground rounded-2xl h-16 font-bold text-lg shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
                disabled={isCalculating}
              >
                {isCalculating ? <Loader2 className="h-6 w-6 mr-3 animate-spin" /> : <Zap className="h-6 w-6 mr-3 text-amber-300" />}
                {isCalculating ? 'Determining Optimal Path...' : 'Optimize Intelligence'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Route Comparison Results */}
        <AnimatePresence>
          {showResults && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 overflow-y-auto max-h-[600px] pr-2 hide-scrollbar">
              <h2 className="text-2xl font-heading font-black text-foreground tracking-tight px-1">AI Optimized Results</h2>
              {recentRoutes.map((route) => {
                const isOptimal = route.status === 'optimal';
                return (
                  <Card key={route.id} className={`glass border-white/20 rounded-[2.5rem] p-10 shadow-lg overflow-hidden relative group transition-all duration-500 border-0 ${isOptimal ? 'ring-2 ring-emerald-500/30 ring-inset' : ''}`}>
                    {isOptimal && (
                      <div className="absolute top-0 right-0 py-2.5 px-8 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-bl-3xl shadow-lg">
                        Best Choice
                      </div>
                    )}
                    <div className="flex items-center gap-6 mb-10">
                      <div className={`p-5 rounded-2xl shadow-sm ${route.mode === 'driving' ? 'bg-primary/5 text-primary' : 'bg-emerald-50 text-emerald-600'}`}>
                        {getModeIcon(route.mode)}
                      </div>
                      <div>
                        <h3 className="text-3xl font-heading font-black text-foreground capitalize leading-none mb-2">{route.mode}</h3>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{route.distance} KM • {route.duration} Min</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5 mb-10">
                      <div className="bg-primary/5 p-5 rounded-2xl border border-primary/5">
                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1.5 opacity-60">Estimated Cost</p>
                        <p className="text-xl font-bold text-foreground">₹{route.cost}</p>
                      </div>
                      <div className="bg-primary/5 p-5 rounded-2xl border border-primary/5">
                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1.5 opacity-60">Arrival Window</p>
                        <p className="text-xl font-bold text-foreground">
                          {format(parseISO(route.arrivalTime), 'h:mm a')}
                        </p>
                      </div>
                    </div>

                    {route.mode === 'driving' && liveTrafficLevel === 'high' && (
                      <div className="bg-destructive/5 p-5 rounded-2xl border border-destructive/10 flex items-start gap-4 mb-8">
                        <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                        <p className="text-xs font-semibold text-destructive/80 leading-relaxed">Expect significant delays! Heavy congestion detected on the primary corridor.</p>
                      </div>
                    )}

                    <Button
                      variant="secondary"
                      className="w-full h-16 rounded-2xl bg-foreground text-background font-bold shadow-2xl hover:bg-primary hover:text-white transition-all active:scale-[0.98] text-base"
                      onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(route.from)}&destination=${encodeURIComponent(route.to)}&travelmode=${route.mode === 'cycling' ? 'bicycling' : route.mode}`, '_blank')}
                    >
                      <Navigation className="h-5 w-5 mr-3 opacity-40" />
                      Dispatch Navigation
                    </Button>
                  </Card>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Right Column: Interactive Map ─── */}
      <div className="flex-1 sticky top-10 h-[calc(100vh-10rem)] rounded-[3rem] overflow-hidden shadow-3xl border-8 border-white/50 bg-primary/5 relative group transition-all duration-700">

        {/* Map UI Overlays */}
        <div className="absolute top-10 left-10 right-10 z-[1000] flex justify-between items-center bg-white/60 backdrop-blur-3xl px-10 py-6 rounded-[2.5rem] shadow-2xl border border-white/20 transition-all hover:bg-white/80">
          <div className="flex items-center gap-6">
            <div className="p-3.5 bg-primary/5 rounded-2xl shadow-sm">
              <RouteIcon className="h-7 w-7 text-primary" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-heading font-black text-foreground tracking-tight leading-none">Live Analytics Map</h2>
              <div className="flex items-center gap-5">
                <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600">
                  <div className="h-2.5 w-2.5 bg-emerald-500 rounded-full shadow-lg shadow-emerald-200" />
                  Optimal
                </span>
                <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500">
                  <div className="h-2.5 w-2.5 bg-amber-500 rounded-full shadow-lg shadow-amber-200" />
                  Moderate
                </span>
                <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-destructive">
                  <div className="h-2.5 w-2.5 bg-destructive rounded-full shadow-lg shadow-destructive/20 animate-pulse" />
                  Congested
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {showResults && (
              <div className="group/traffic relative">
                <Button variant="ghost" onClick={refreshTraffic} disabled={isRefreshing} className="h-14 w-14 rounded-2xl bg-white/50 hover:bg-primary/5 transition-all outline-none border border-white/20 shadow-sm">
                  {isRefreshing ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <TrendingDown className="h-6 w-6 text-primary" />}
                </Button>
                <div className="absolute top-full right-0 mt-4 hidden group-hover/traffic:block w-56 glass p-4 rounded-xl shadow-3xl text-[10px] font-bold text-primary uppercase tracking-[0.2em] text-center border-white/20">
                  Recalculate Traffic Pulse
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Map Logic Overlay (Empty State) */}
        {!showResults && (
          <div className="absolute inset-0 z-10 bg-primary/5 flex items-center justify-center pointer-events-none transition-opacity duration-700">
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="glass p-16 rounded-[4rem] flex flex-col items-center gap-8 shadow-3xl text-center max-w-sm border-white/20"
            >
              <div className="h-24 w-24 bg-primary rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-primary/30">
                <Navigation className="h-12 w-12 text-white animate-float" />
              </div>
              <div className="space-y-3">
                <p className="text-2xl font-heading font-black text-foreground tracking-tight leading-none">Ready to Explore?</p>
                <p className="text-sm font-semibold text-muted-foreground leading-relaxed">Define your origin and destination below to unlock real-time intelligence.</p>
              </div>
            </motion.div>
          </div>
        )}

        <div className="h-full w-full relative z-0">
          <RouteMap
            routeGeometry={activeRouteResult?.geometry}
            markers={activeMarkers}
            trafficSegments={trafficSegments}
            className="!rounded-none h-full w-full"
          />
        </div>
      </div>
    </div>
  );
};
