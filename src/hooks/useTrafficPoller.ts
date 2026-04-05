import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export interface TrafficSegment {
  coordinates: [number, number][];
  congestionRatio: number;
}

export function useTrafficPoller(routeGeometry: GeoJSON.LineString | null) {
  const [segments, setSegments] = useState<TrafficSegment[]>([]);
  const [trafficLevel, setTrafficLevel] = useState<'low' | 'medium' | 'high'>('low');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const refresh = useCallback(async () => {
    if (!routeGeometry || !routeGeometry.coordinates || routeGeometry.coordinates.length < 2) {
      setSegments([]);
      setTrafficLevel('low');
      return;
    }

    setIsRefreshing(true);
    try {
      // Simulate real-world traffic fluctuations
      const newSegments: TrafficSegment[] = [];
      const coords = routeGeometry.coordinates;
      let currentCongestion = Math.random() < 0.25 ? 'high' : (Math.random() < 0.3 ? 'medium' : 'low');
      let overallRatio = 0;

      for (let i = 0; i < coords.length - 1; i++) {
        if (Math.random() < 0.15) {
          currentCongestion = Math.random() < 0.4 ? 'high' : (Math.random() < 0.5 ? 'medium' : 'low');
        }

        const ratio = currentCongestion === 'high' ? 1.7 : (currentCongestion === 'medium' ? 1.3 : 1.0);
        overallRatio += ratio;

        newSegments.push({
          coordinates: [
            [coords[i][1], coords[i][0]],
            [coords[i+1][1], coords[i+1][0]]
          ],
          congestionRatio: ratio
        });
      }

      const finalRatio = overallRatio / (coords.length - 1);
      const newLevel = finalRatio > 1.5 ? 'high' : (finalRatio > 1.2 ? 'medium' : 'low');
      
      // Proactive Alert Logic
      if (newLevel === 'high' && trafficLevel !== 'high') {
         toast.error('Proactive Alert: Heavy traffic detected! Consider leaving 10 minutes earlier.', {
            duration: 8000,
            icon: '🚨'
         });
      }

      setSegments(newSegments);
      setTrafficLevel(newLevel);
      setLastRefreshed(new Date());

    } catch (e) {
      console.warn("[Poller] Falling back to clear route.");
    } finally {
      setIsRefreshing(false);
    }
  }, [routeGeometry, trafficLevel]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60_000); // Poll every 60s for "Real-Life" urgency
    return () => clearInterval(interval);
  }, [refresh]);

  return { segments, trafficLevel, isRefreshing, lastRefreshed, refresh };
}
