import React, { useMemo } from "react";
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useAIInsights } from '../../hooks/useAIInsights';
import { useNearbyPlaces } from '../../hooks/useNearbyPlaces';
import { SmartRecommendations } from '../components/dashboard/SmartRecommendations';
import { DayTimeline } from '../components/dashboard/DayTimeline';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { formatINR } from "../../utils/currency";
import { 
  Calendar, 
  IndianRupee, 
  AlertTriangle,
  Navigation,
  Sparkles,
  CloudSun,
  ShieldCheck,
  ChevronRight,
  TrendingDown,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export const Dashboard: React.FC = () => {
  const { events, conflicts, expenses, budget, routes } = useApp();
  const { insights } = useAIInsights();
  const { places } = useNearbyPlaces();
  const { user } = useAuth();
  
  const userName = user?.user_metadata?.full_name?.split(' ')[0] || user?.user_metadata?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';

  const combinedInsights = [
    ...conflicts.map(c => ({
      id: c.id,
      category: 'CONFLICT_WARNING',
      title: c.type.replace(/_/g, ' ').toUpperCase(),
      description: c.description,
      severity: c.severity,
      conflictObj: c
    })),
    ...insights.filter(i => 
      ['SCHEDULE_REORDER_SUGGESTION', 'SCHEDULE_GAP_SUGGESTION', 'ROUTE_OPTIMIZATION', 'TIME_OPTIMIZATION', 'COST_OPTIMIZATION', 'SCHEDULE_CONFLICT'].includes(i.category)
    ),
    ...places.slice(0, 3).map(p => ({
      id: p.id,
      category: 'PLACE_SUGGESTION',
      title: p.name,
      description: p.location,
      rating: p.rating,
      distance: p.distance,
      placeObj: p,
    }))
  ];

  const todayEvents = useMemo(() => events.filter(event => {
    const eventDate = format(parseISO(event.startTime), 'yyyy-MM-dd');
    const today = format(new Date(), 'yyyy-MM-dd');
    return eventDate === today;
  }), [events]);

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const budgetPercentage = (totalExpenses / budget) * 100;
  const highPriorityConflicts = conflicts.filter(c => c.severity === 'high');
  const optimalRoutes = routes.filter(r => r.status === 'optimal').length;

  return (
    <div className="space-y-16 fade-in-up pb-20">
      
      {/* ─── Elegant Header ─── */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-10">
        <div className="space-y-2">
           <h1 className="text-6xl font-heading font-black tracking-tighter text-foreground leading-none">
             Welcome, <span className="text-gradient-primary">{userName}</span>.
           </h1>
           <p className="text-lg text-muted-foreground font-medium tracking-tight ml-1">
             {format(new Date(), 'EEEE, MMMM do')} • Your day is fully optimized.
           </p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
           <div className="flex-1 md:flex-none glass px-8 py-5 rounded-[2rem] flex items-center gap-5 border-l-4 border-l-amber-400/50 shadow-sm">
             <div className="p-2.5 bg-amber-50 rounded-2xl">
               <CloudSun className="h-6 w-6 text-amber-500" />
             </div>
             <div>
               <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Local Forecast</p>
               <p className="text-sm font-bold text-foreground">28°C • Mostly Sunny</p>
             </div>
           </div>
           
           <div className="flex-1 md:flex-none glass px-8 py-5 rounded-[2rem] flex items-center gap-5 border-l-4 border-l-primary/50 shadow-sm">
             <div className="p-2.5 bg-primary/5 rounded-2xl">
               <ShieldCheck className="h-6 w-6 text-primary" />
             </div>
             <div>
               <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">System Status</p>
               <p className="text-sm font-bold text-foreground">Active & Secure</p>
             </div>
           </div>
        </div>
      </div>

      {/* ─── Visual Storytelling: Day Timeline ─── */}
      <section className="animate-in slide-in-from-bottom duration-700">
         <DayTimeline events={events} routes={routes} />
      </section>

      {/* ─── Elegant Metrics Grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { title: "Today's Events", value: todayEvents.length, sub: `${todayEvents.filter(e => e.priority === 'high').length} high priority`, icon: Calendar, color: "text-primary", bg: "bg-primary/5", link: "/schedule" },
          { title: "Active Conflicts", value: conflicts.length, sub: `${highPriorityConflicts.length} critical`, icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/5", link: "/schedule" },
          { title: "Budget Used", value: `${budgetPercentage.toFixed(0)}%`, sub: `${formatINR(budget - totalExpenses)} remaining`, icon: IndianRupee, color: "text-emerald-500", bg: "bg-emerald-50", link: "/expenses" },
          { title: "Path Optimization", value: optimalRoutes, sub: "AI-Analyzed routes", icon: Navigation, color: "text-indigo-500", bg: "bg-indigo-50", link: "/travel" }
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Link to={item.link} className="block group outline-none">
              <Card className="glass border-white/20 group-hover:border-primary/20 group-hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] group-hover:-translate-y-2 transition-all duration-500 rounded-[2rem] p-5 border-0">
                <CardHeader className="p-0 mb-6">
                   <div className="flex justify-between items-center mb-4">
                      <div className={`p-4 ${item.bg} rounded-2xl transition-transform group-hover:scale-110 group-hover:rotate-3 duration-500 shadow-sm`}>
                        <item.icon className={`h-6 w-6 ${item.color}`} />
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500" />
                   </div>
                   <CardTitle className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground group-hover:text-foreground transition-colors duration-500">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                   <div className="text-5xl font-heading font-black text-foreground tracking-tighter mb-2 leading-none">{item.value}</div>
                   <p className="text-xs font-semibold text-muted-foreground tracking-tight">{item.sub}</p>
                   {item.title === "Budget Used" && <Progress value={budgetPercentage} className="h-1.5 mt-6 bg-muted rounded-full" />}
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20">
        
        {/* ─── Smart AI Recommendations ─── */}
        <section className="space-y-8">
           <div className="flex items-center justify-between px-2">
              <h2 className="text-3xl font-heading font-black tracking-tight text-foreground flex items-center gap-3">
                <Sparkles className="h-7 w-7 text-primary animate-pulse" />
                Intelligence Hub
              </h2>
           </div>
           <SmartRecommendations insights={combinedInsights} />
        </section>

        {/* ─── Financial Pulse Section ─── */}
        <section className="space-y-8">
           <div className="flex items-center justify-between px-2">
              <h2 className="text-3xl font-heading font-black tracking-tight text-foreground flex items-center gap-3">
                <IndianRupee className="h-7 w-7 text-emerald-500" />
                Financial Pulse
              </h2>
           </div>
           <Card className="glass border-white/20 rounded-[2.5rem] p-10 overflow-hidden relative shadow-sm border-0">
              <div className="flex items-center justify-between mb-12">
                 <div>
                    <h3 className="text-5xl font-heading font-black text-foreground tracking-tighter mb-2">{formatINR(totalExpenses)}</h3>
                    <p className="text-[10px] text-emerald-600 font-bold tracking-[0.2em] uppercase">Total Expenditure This Cycle</p>
                 </div>
                 <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100/50 shadow-sm">
                    <TrendingDown className="h-10 w-10 text-emerald-500" />
                 </div>
              </div>
              
              <div className="space-y-6 mb-12">
                 {expenses.slice(-3).reverse().map((exp) => (
                    <div key={exp.id} className="flex items-center justify-between group p-3 hover:bg-primary/5 rounded-2xl transition-all">
                       <div className="flex items-center gap-5">
                          <div className="h-12 w-12 glass rounded-xl flex items-center justify-center font-bold text-muted-foreground group-hover:text-primary transition-all shadow-sm">
                             {exp.description[0].toUpperCase()}
                          </div>
                          <div>
                             <p className="font-bold text-foreground group-hover:text-primary transition-colors text-sm tracking-tight">{exp.description}</p>
                             <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">{format(parseISO(exp.date), 'MMMM d')}</p>
                          </div>
                       </div>
                       <span className="font-bold text-foreground text-base tracking-tight">{formatINR(exp.amount)}</span>
                    </div>
                 ))}
              </div>

              <Link to="/expenses" className="block outline-none">
                 <Button className="w-full bg-primary hover:bg-foreground text-primary-foreground rounded-2xl h-16 font-bold text-base shadow-xl shadow-primary/20 transition-all active:scale-[0.98] group">
                   Analyze Detailed Ledger
                   <ChevronRight className="h-5 w-5 ml-2 transition-transform group-hover:translate-x-1" />
                 </Button>
              </Link>
           </Card>
        </section>

      </div>
    </div>
  );
};
