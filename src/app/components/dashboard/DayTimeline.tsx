import React, { useMemo } from 'react';
import { format, parseISO, differenceInMinutes, addMinutes, startOfDay, endOfDay } from 'date-fns';
import { motion } from 'framer-motion';
import { 
  Clock, 
  MapPin, 
  Navigation, 
  ChevronRight, 
  Zap, 
  AlertCircle 
} from 'lucide-react';
import { Badge } from '../ui/badge';
import type { Event, TravelRoute } from '../../../types';

interface DayTimelineProps {
  events: Event[];
  routes: TravelRoute[];
  onEventClick?: (event: Event) => void;
}

export const DayTimeline: React.FC<DayTimelineProps> = ({ 
  events, 
  routes, 
  onEventClick 
}) => {
  const today = new Date();
  const todayEvents = useMemo(() => {
    return events
      .filter(e => {
        const d = parseISO(e.startTime);
        return d.getDate() === today.getDate() && 
               d.getMonth() === today.getMonth() && 
               d.getFullYear() === today.getFullYear();
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [events]);

  const timelineItems = useMemo(() => {
    const items: any[] = [];
    
    for (let i = 0; i < todayEvents.length; i++) {
      const event = todayEvents[i];
      items.push({ type: 'event', data: event });

      if (i < todayEvents.length - 1) {
        const nextEvent = todayEvents[i + 1];
        const gapMin = differenceInMinutes(parseISO(nextEvent.startTime), parseISO(event.endTime));
        
        if (gapMin > 0) {
          // Find matching route for this gap if exists
          const route = routes.find(r => 
            r.from.toLowerCase().includes(event.location.toLowerCase()) || 
            r.to.toLowerCase().includes(nextEvent.location.toLowerCase())
          );
          
          items.push({ 
            type: 'gap', 
            duration: gapMin, 
            route,
            from: event.location,
            to: nextEvent.location
          });
        }
      }
    }
    return items;
  }, [todayEvents, routes]);

  if (todayEvents.length === 0) {
    return (
      <div className="glass rounded-[2rem] p-12 text-center border-dashed border-2 border-gray-200">
        <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300 opacity-50" />
        <h3 className="text-xl font-bold text-gray-400">No events today</h3>
        <p className="text-gray-400 text-sm mt-1">Your timeline will appear here once you add events.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-2xl font-black tracking-tight text-gray-900 flex items-center gap-2">
          <Zap className="h-6 w-6 text-amber-500 fill-amber-500" />
          Today's Journey
        </h2>
        <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">
          {format(today, 'EEEE, MMM do')}
        </span>
      </div>

      <div className="relative overflow-x-auto pb-8 pt-4 hide-scrollbar">
        <div className="flex items-center gap-4 min-w-max px-2">
          {timelineItems.map((item, idx) => (
            <React.Fragment key={idx}>
              {item.type === 'event' ? (
                <motion.div
                  whileHover={{ scale: 1.02, translateY: -4 }}
                  onClick={() => onEventClick?.(item.data)}
                  className={`relative w-72 shrink-0 glass rounded-[2rem] p-6 cursor-pointer transition-all border-l-8 ${
                    item.data.priority === 'high' ? 'border-l-red-500' : 'border-l-indigo-500'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest border-gray-100 text-gray-400">
                      {item.data.type}
                    </Badge>
                    <span className="text-[10px] font-black text-gray-400">
                      {format(parseISO(item.data.startTime), 'h:mm a')}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-gray-900 leading-tight mb-2 line-clamp-1">
                    {item.data.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
                    <MapPin className="h-3.5 w-3.5 text-indigo-400" />
                    <span className="truncate">{item.data.location}</span>
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center px-4 py-2 group">
                  <div className="h-0.5 w-16 bg-gray-100 group-hover:bg-indigo-100 transition-colors relative">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                       <span className="text-[10px] font-black text-gray-300 group-hover:text-indigo-400 transition-colors tracking-tighter uppercase">
                         {item.duration}m Gap
                       </span>
                    </div>
                  </div>
                  {item.route ? (
                    <div className="mt-4 flex flex-col items-center gap-1">
                      <Navigation className="h-4 w-4 text-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">{item.route.duration}m Travel</span>
                    </div>
                  ) : (
                    <div className="mt-4 opacity-20 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-1">
                      <Navigation className="h-4 w-4 text-gray-300" />
                    </div>
                  )}
                </div>
              )}
            </React.Fragment>
          ))}
          
          <div className="w-40 shrink-0 flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-100 rounded-[2rem] text-gray-300">
             <ChevronRight className="h-8 w-8 mb-2" />
             <span className="text-[10px] font-black uppercase tracking-widest">End of Day</span>
          </div>
        </div>
      </div>
    </div>
  );
};
