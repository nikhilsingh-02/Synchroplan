import React, { useMemo } from 'react';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Clock, 
  MapPin, 
  Navigation, 
  ChevronRight, 
  Zap, 
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
      <Link to="/schedule" className="block outline-none">
        <div className="glass rounded-3xl p-16 text-center border-dashed border-2 border-primary/10 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer group">
          <Clock className="h-14 w-14 mx-auto mb-6 text-primary/20 opacity-50 group-hover:scale-110 group-hover:text-primary/50 transition-all" />
          <h3 className="text-2xl font-heading font-semibold text-foreground/60 transition-colors group-hover:text-foreground">Quiet Day Ahead</h3>
          <p className="text-muted-foreground text-sm mt-2 max-w-xs mx-auto font-medium">Your timeline will appear here once you add events to your schedule. Click to plan your day.</p>
        </div>
      </Link>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between px-2">
        <div className="space-y-1">
          <h2 className="text-3xl font-heading font-black tracking-tight text-foreground flex items-center gap-3">
            <Zap className="h-7 w-7 text-primary fill-primary/10" />
            Daily Rhythm
          </h2>
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-[0.2em] ml-10">
            {format(today, 'EEEE, MMMM do')}
          </p>
        </div>
      </div>

      <div className="relative overflow-x-auto pb-10 pt-4 hide-scrollbar -mx-2 px-2">
        <div className="flex items-center gap-6 min-w-max">
          {timelineItems.map((item, idx) => (
            <React.Fragment key={idx}>
              {item.type === 'event' ? (
                <motion.div
                  whileHover={{ scale: 1.02, translateY: -4 }}
                  onClick={() => onEventClick?.(item.data)}
                  className={`relative w-80 shrink-0 glass rounded-[2rem] p-8 cursor-pointer transition-all border-l-[6px] shadow-sm hover:shadow-xl ${
                    item.data.priority === 'high' ? 'border-l-destructive' : 'border-l-primary'
                  }`}
                >
                  <div className="flex justify-between items-center mb-6">
                    <Badge variant="secondary" className="px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest bg-primary/5 text-primary border-0">
                      {item.data.type}
                    </Badge>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span className="text-[11px] font-bold">
                        {format(parseISO(item.data.startTime), 'h:mm a')}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-xl font-heading font-bold text-foreground leading-tight mb-4 line-clamp-2">
                    {item.data.title}
                  </h3>
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-semibold">
                    <div className="p-1.5 bg-primary/5 rounded-lg">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="truncate">{item.data.location}</span>
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center px-6 group">
                  <div className="h-0.5 w-20 bg-primary/10 group-hover:bg-primary/30 transition-all relative">
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap">
                       <span className="text-[10px] font-bold text-muted-foreground group-hover:text-primary transition-colors tracking-widest uppercase">
                         {item.duration}m Buffer
                       </span>
                    </div>
                  </div>
                  {item.route ? (
                    <div className="mt-6 flex flex-col items-center gap-1.5">
                      <div className="p-2 bg-emerald-50 rounded-xl">
                        <Navigation className="h-4 w-4 text-emerald-500 animate-float" />
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{item.route.duration}m Travel</span>
                    </div>
                  ) : (
                    <div className="mt-6 opacity-30 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-1.5 grayscale group-hover:grayscale-0">
                       <div className="p-2 bg-muted rounded-xl">
                        <Navigation className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </React.Fragment>
          ))}
          <Link to="/schedule" className="block outline-none shrink-0">
            <div className="w-48 h-full min-h-[200px] flex flex-col items-center justify-center p-10 border-2 border-dashed border-primary/10 rounded-[2.5rem] bg-primary/5 group hover:border-primary/30 hover:bg-primary/10 transition-all cursor-pointer">
               <ChevronRight className="h-10 w-10 mb-3 text-primary/20 group-hover:text-primary/60 group-hover:translate-x-1.5 transition-all" />
               <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/40 group-hover:text-primary/80 transition-colors text-center">Plan More<br/>Activity</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};
