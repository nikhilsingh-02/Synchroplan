import React, { useState } from 'react';
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
  DollarSign,
  TrendingUp,
  AlertCircle,
  MapPin,
  Zap,
  Route as RouteIcon,
} from 'lucide-react';
import { toast } from 'sonner';

export const TravelPlanner: React.FC = () => {
  const { routes, addRoute, events } = useApp();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [mode, setMode] = useState<'driving' | 'transit' | 'walking' | 'cycling'>('driving');
  const [showResults, setShowResults] = useState(false);

  const handleSearch = () => {
    if (!origin || !destination) {
      toast.error('Please enter both origin and destination');
      return;
    }

    // Simulate route calculation
    const mockRoutes = [
      {
        from: origin,
        to: destination,
        mode: 'driving',
        duration: 25,
        distance: 12.3,
        cost: 8.50,
        arrivalTime: new Date(Date.now() + 25 * 60000).toISOString(),
        status: 'delayed' as const,
        trafficLevel: 'high' as const,
      },
      {
        from: origin,
        to: destination,
        mode: 'transit',
        duration: 35,
        distance: 11.8,
        cost: 2.75,
        arrivalTime: new Date(Date.now() + 35 * 60000).toISOString(),
        status: 'optimal' as const,
        trafficLevel: 'low' as const,
      },
      {
        from: origin,
        to: destination,
        mode: 'cycling',
        duration: 45,
        distance: 10.2,
        cost: 0,
        arrivalTime: new Date(Date.now() + 45 * 60000).toISOString(),
        status: 'normal' as const,
      },
    ];

    mockRoutes.forEach(route => addRoute(route));
    setShowResults(true);
    toast.success('Routes calculated successfully');
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
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
              <Button onClick={handleSearch} className="px-8">
                <Navigation className="h-4 w-4 mr-2" />
                Find Routes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
          {routes.slice(-3).reverse().map((route) => (
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
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Cost</p>
                      <p className="font-semibold">${route.cost.toFixed(2)}</p>
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
                          minute: '2-digit' 
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
                      <p className="text-xs text-red-700">
                        Consider alternative routes or departure time
                      </p>
                    </div>
                  </div>
                )}

                {route.status === 'optimal' && (
                  <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
                    <Zap className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-900">Recommended Route</p>
                      <p className="text-xs text-green-700">
                        Best balance of time and cost
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button className="flex-1">
                    <Navigation className="h-4 w-4 mr-2" />
                    Start Navigation
                  </Button>
                  <Button variant="outline">
                    Share
                  </Button>
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
            <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                <div>
                  <p className="font-medium text-sm">I-95 Northbound</p>
                  <p className="text-xs text-gray-600">Heavy congestion</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-red-700">+15 min</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <div>
                  <p className="font-medium text-sm">Downtown Area</p>
                  <p className="text-xs text-gray-600">Moderate traffic</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-yellow-700">+5 min</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <div>
                  <p className="font-medium text-sm">Highway 101</p>
                  <p className="text-xs text-gray-600">Clear roads</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-green-700">On time</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
