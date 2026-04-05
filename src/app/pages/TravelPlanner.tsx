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
  LocateFixed,
  Sparkles,
  ChevronRight,
  TrendingDown,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { geocodeAndCalculateRoute, MapsApiError, type RouteResult, reverseGeocodeAddress } from '../../services/maps/smart-maps.service';
import { getUserLocation } from '../../services/location/userLocation';
import type { TravelRoute } from '../../types';
import { RouteMap, type MapMarker } from '../../components/maps/RouteMap';
import { useTrafficPoller } from '../../hooks/useTrafficPoller';
import { format, parseISO, subMinutes } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export const TravelPlanner: React.FC = () => {
  const { routes, addRoute, updateEvent, events } = useApp();
  const location = useLocation();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [mode, setMode] = useState<TravelRoute['mode']>('driving');
  const [isCalculating, setIsCalculating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [lastUsedModes, setLastUsedModes] = useState<TravelRoute['mode'][]>([]);

  const [activeRouteResult, setActiveRouteResult] = useState<RouteResult | null>(null);
  const [activeMarkers, setActiveMarkers] = useState<MapMarker[]>([]);

  const {
    segments:     trafficSegments,
    trafficLevel: liveTrafficLevel,
    isRefreshing,
    refresh:      refreshTraffic,
  } = useTrafficPoller(activeRouteResult?.geometry ?? null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const destParam = params.get('destination');
    if (destParam) setDestination(destParam);
  }, [location.search]);

  const handleUseCurrentLocation = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      toast.info('Detecting your real-life location...');
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

      successful.forEach(({ route, routeMode }) => {
        addRoute({
          from: origin,
          to: destination,
          mode: routeMode,
          duration: route.duration,
          distance: route.distance,
          cost: routeMode === 'driving' ? estimateCosts(route.distance).uber : (routeMode === 'transit' ? 15 : 0),
          arrivalTime: route.arrivalTime,
          status: route.status,
          trafficLevel: route.trafficLevel,
        });
      });

      const first = successful[0];
      setActiveRouteResult(first);
      setActiveMarkers([
        { longitude: first.originCoords.longitude, latitude: first.originCoords.latitude, label: 'Start', color: '#6366f1' },
        { longitude: first.destCoords.longitude, latitude: first.destCoords.latitude, label: 'Goal', color: '#10b981' },
      ]);

      setLastUsedModes(modesWanted);
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

  const recentRoutes = showResults ? routes.slice(-lastUsedModes.length).reverse() : [];

  return (
    <div className="flex flex-col xl:flex-row gap-8 w-full h-full pb-20 animate-in fade-in duration-700">
      
      {/* Left Column: Form & Insights */}
      <div className="w-full xl:w-[450px] shrink-0 flex flex-col gap-8">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter text-gray-900 leading-none">
            Travel <span className="text-gradient-primary">Planner</span>
          </h1>
          <p className="text-gray-500 font-bold tracking-tight">AI-Optimized Multi-Modal Navigation</p>
        </div>

        <Card className="glass border-0 rounded-[2.5rem] shadow-2xl overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="flex items-center gap-3 text-xl font-black">
              <Sparkles className="h-6 w-6 text-indigo-500" />
              Configure Route
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Starting From</Label>
                <div className="flex gap-2">
                  <Input
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder="Search origin..."
                    className="h-14 rounded-2xl bg-gray-50 border-0 focus-visible:ring-indigo-500 font-bold"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleUseCurrentLocation}
                    className="h-14 w-14 rounded-2xl border-0 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all active:scale-90"
                  >
                    <LocateFixed className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Destination</Label>
                <Input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Where to?"
                  className="h-14 rounded-2xl bg-gray-50 border-0 focus-visible:ring-indigo-500 font-bold"
                />
              </div>
            </div>
            
            <div className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Strategy</Label>
                <Select value={mode} onValueChange={(v: any) => setMode(v)}>
                  <SelectTrigger className="h-14 rounded-2xl bg-gray-50 border-0 font-black">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-0 shadow-2xl">
                    <SelectItem value="driving" className="font-bold">Fastest (Driving)</SelectItem>
                    <SelectItem value="transit" className="font-bold">Economical (Transit)</SelectItem>
                    <SelectItem value="walking" className="font-bold">Active (Walking)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleSearch} 
                className="w-full bg-indigo-600 hover:bg-black text-white rounded-3xl h-16 font-black text-lg shadow-xl shadow-indigo-100 transition-all active:scale-95"
                disabled={isCalculating}
              >
                {isCalculating ? <Loader2 className="h-6 w-6 mr-3 animate-spin" /> : <Zap className="h-6 w-6 mr-3 text-amber-300" />}
                {isCalculating ? 'Determining Optimal Path...' : 'Optimize Route'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Proactive Quick Events */}
        {events.length > 0 && !showResults && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h2 className="text-xs font-black tracking-widest text-gray-400 uppercase ml-1">Next Possible Destinations</h2>
              <div className="grid grid-cols-1 gap-3">
                 {events.filter(e => !e.hasConflict).slice(0, 3).map(e => (
                    <button 
                      key={e.id}
                      onClick={() => setDestination(e.location)}
                      className="glass p-5 rounded-[1.5rem] flex items-center justify-between group hover:border-indigo-200 transition-all active:scale-95 text-left"
                    >
                       <div className="flex items-center gap-4">
                          <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                             <MapPin className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-black text-gray-900 group-hover:text-indigo-600 transition-colors uppercase text-xs tracking-tight">{e.title}</p>
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest truncate max-w-[150px]">{e.location}</p>
                          </div>
                       </div>
                       <ChevronRight className="h-5 w-5 text-gray-200 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                    </button>
                 ))}
              </div>
           </motion.div>
        )}

        {/* Route Comparison Results */}
        <AnimatePresence>
          {showResults && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
              <h2 className="text-xl font-black text-gray-900 tracking-tight">AI Comparison Results</h2>
              {recentRoutes.map((route) => {
                const costs = estimateCosts(route.distance);
                const isOptimal = route.status === 'optimal';
                return (
                  <Card key={route.id} className={`glass border-0 rounded-[2.5rem] p-8 shadow-lg overflow-hidden relative group ${isOptimal ? 'ring-2 ring-emerald-500/20' : ''}`}>
                    {isOptimal && (
                      <div className="absolute top-0 right-0 py-2 px-6 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-bl-3xl shadow-lg">
                        Optimal Path
                      </div>
                    )}
                    <div className="flex items-center gap-6 mb-8">
                       <div className={`p-5 rounded-3xl ${route.mode === 'driving' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                         {getModeIcon(route.mode)}
                       </div>
                       <div>
                          <h3 className="text-2xl font-black text-gray-900 capitalize leading-none mb-1">{route.mode}</h3>
                          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{route.distance} KM • {route.duration} Min</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                       <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50">
                          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Est. Cost</p>
                          <p className="text-lg font-black text-gray-900">₹{route.cost}</p>
                       </div>
                       <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50">
                          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Arrival Time</p>
                          <p className="text-lg font-black text-gray-900">
                            {format(parseISO(route.arrivalTime), 'h:mm a')}
                          </p>
                       </div>
                    </div>

                    {route.mode === 'driving' && liveTrafficLevel === 'high' && (
                       <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex items-start gap-3 mb-6">
                          <AlertCircle className="h-4 w-4 text-red-500 mt-1 shrink-0" />
                          <p className="text-xs font-bold text-red-700">Expect delays! Heavy congestion detected on the main route.</p>
                       </div>
                    )}

                    <Button
                      className="w-full h-16 rounded-[1.25rem] bg-gray-900 text-white font-black shadow-2xl shadow-gray-200 hover:bg-indigo-600 transition-all active:scale-95 text-base"
                      onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(route.from)}&destination=${encodeURIComponent(route.to)}&travelmode=${route.mode === 'cycling' ? 'bicycling' : route.mode}`, '_blank')}
                    >
                      <Navigation className="h-5 w-5 mr-3 text-white/50" />
                      Start Navigation
                    </Button>
                  </Card>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right Column: Full Height Interactive Map */}
      <div className="flex-1 sticky top-8 h-[calc(100vh-8rem)] rounded-[3rem] overflow-hidden shadow-3xl border-8 border-white bg-gray-50 relative group">
        
        {/* Map UI Overlays */}
        <div className="absolute top-8 left-8 right-8 z-[1000] flex justify-between items-center bg-white/80 backdrop-blur-2xl px-8 py-5 rounded-[2rem] shadow-2xl border border-white/50 transition-all hover:bg-white">
          <div className="flex items-center gap-5">
            <div className="p-3 bg-indigo-50 rounded-2xl">
              <RouteIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 tracking-tight leading-none mb-1">Live Intelligence Map</h2>
              <div className="flex items-center gap-3">
                 <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                    <div className="h-2 w-2 bg-emerald-500 rounded-full shadow-sm shadow-emerald-200" />
                    Optimal: Green
                 </span>
                 <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-500">
                    <div className="h-2 w-2 bg-amber-500 rounded-full shadow-sm shadow-amber-200" />
                    Med: Amber
                 </span>
                 <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-red-500">
                    <div className="h-2 w-2 bg-red-500 rounded-full shadow-sm shadow-red-200 animate-pulse" />
                    High: Red
                 </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
             {showResults && (
                <div className="group/traffic relative">
                   <Button variant="ghost" onClick={refreshTraffic} disabled={isRefreshing} className="h-14 w-14 rounded-2xl bg-gray-50/50 hover:bg-indigo-50 transition-all">
                      {isRefreshing ? <Loader2 className="h-5 w-5 animate-spin text-indigo-400" /> : <TrendingUp className="h-5 w-5 text-indigo-600" />}
                   </Button>
                   <div className="absolute top-full right-0 mt-3 hidden group-hover/traffic:block w-48 glass p-3 rounded-xl shadow-2xl text-[10px] font-black text-indigo-900 uppercase tracking-widest text-center">
                     Live Force Refresh
                   </div>
                </div>
             )}
          </div>
        </div>

        {/* Map Logic Overlay (Empty State) */}
        {!showResults && (
           <div className="absolute inset-0 z-10 bg-indigo-950/5 flex items-center justify-center pointer-events-none">
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="glass p-12 rounded-[3.5rem] flex flex-col items-center gap-6 shadow-3xl text-center max-w-sm"
              >
                 <div className="h-20 w-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-200">
                    <Navigation className="h-10 w-10 text-white animate-float" />
                 </div>
                 <div>
                   <p className="text-xl font-black text-indigo-950 tracking-tight mb-2">Ready to optimize?</p>
                   <p className="text-sm font-bold text-indigo-800 opacity-60">Enter a starting point and destination to unlock real-life multi-modal intelligence.</p>
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
