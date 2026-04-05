import React, { useMemo } from "react";
import { useApp } from '../context/AppContext';
import { useAIInsights } from '../../hooks/useAIInsights';
import { useNearbyPlaces } from '../../hooks/useNearbyPlaces';
import { SmartRecommendations } from '../components/dashboard/SmartRecommendations';
import { DayTimeline } from '../components/dashboard/DayTimeline';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { formatINR } from "../../utils/currency";
import { 
  Calendar, 
  MapPin, 
  IndianRupee, 
  AlertTriangle,
  TrendingUp,
  Clock,
  Navigation,
  Zap,
  Sparkles,
  CloudSun,
  ShieldCheck,
  ChevronRight,
  TrendingDown,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Link } from 'react-router';
import { motion } from 'framer-motion';

export const Dashboard: React.FC = () => {
  const { events, conflicts, expenses, budget, routes } = useApp();
  const { insights } = useAIInsights();
  const { places } = useNearbyPlaces();

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
    <div className="space-y-12 animate-in fade-in duration-1000 pb-20">
      
      {/* ─── Premium Header ─── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div className="space-y-1">
           <h1 className="text-5xl font-black tracking-tighter text-gray-900 leading-none">
             Welcome back, <span className="text-gradient-primary">Vivekj</span>.
           </h1>
           <p className="text-lg text-gray-500 font-bold tracking-tight">
             {format(new Date(), 'EEEE, MMMM do')} • All systems optimized.
           </p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="glass px-6 py-4 rounded-3xl flex items-center gap-4 border-l-4 border-l-amber-400">
             <div className="p-2 bg-amber-50 rounded-xl">
               <CloudSun className="h-5 w-5 text-amber-500" />
             </div>
             <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Local Forecast</p>
               <p className="text-sm font-black text-gray-800">28°C • Mostly Sunny</p>
             </div>
           </div>
           
           <div className="glass px-6 py-4 rounded-3xl flex items-center gap-4 border-l-4 border-l-indigo-500">
             <div className="p-2 bg-indigo-50 rounded-xl">
               <ShieldCheck className="h-5 w-5 text-indigo-600" />
             </div>
             <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Status</p>
               <p className="text-sm font-black text-gray-800">Synch Active</p>
             </div>
           </div>
        </div>
      </div>

      {/* ─── Visual Storytelling: Day Timeline ─── */}
      <section className="animate-in slide-in-from-bottom duration-700">
         <DayTimeline events={events} routes={routes} />
      </section>

      {/* ─── Quick Summary & Metrics ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Today's Events", value: todayEvents.length, sub: `${todayEvents.filter(e => e.priority === 'high').length} high priority`, icon: Calendar, color: "text-blue-500", bg: "bg-blue-50" },
          { title: "Active Conflicts", value: conflicts.length, sub: `${highPriorityConflicts.length} critical`, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50" },
          { title: "Budget Used", value: `${budgetPercentage.toFixed(0)}%`, sub: `${formatINR(budget - totalExpenses)} remaining`, icon: IndianRupee, color: "text-emerald-500", bg: "bg-emerald-50" },
          { title: "Optimal Routes", value: optimalRoutes, sub: "AI-Analyzed paths", icon: Navigation, color: "text-indigo-500", bg: "bg-indigo-50" }
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="group glass hover:shadow-2xl transition-all duration-500 border-0 rounded-[2.5rem] p-4">
              <CardHeader className="pb-2">
                 <div className="flex justify-between items-center mb-2">
                    <div className={`p-4 ${item.bg} rounded-3xl transition-transform group-hover:scale-110 duration-500`}>
                      <item.icon className={`h-6 w-6 ${item.color}`} />
                    </div>
                 </div>
                 <CardTitle className="text-sm font-black uppercase tracking-widest text-gray-400">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="text-4xl font-black text-gray-900 tracking-tighter mb-1">{item.value}</div>
                 <p className="text-xs font-bold text-gray-500 tracking-tight">{item.sub}</p>
                 {item.title === "Budget Used" && <Progress value={budgetPercentage} className="h-1.5 mt-4 bg-gray-100" />}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* ─── Smart AI Recommendations ─── */}
        <section className="space-y-6">
           <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-black tracking-tight text-gray-900 flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-indigo-500" />
                AI Strategy Center
              </h2>
           </div>
           <SmartRecommendations insights={combinedInsights} />
        </section>

        {/* ─── Financial Snapshot ─── */}
        <section className="space-y-6">
           <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-black tracking-tight text-gray-900 flex items-center gap-2">
                <IndianRupee className="h-6 w-6 text-emerald-500 underline decoration-emerald-100" />
                Financial Pulse
              </h2>
           </div>
           <Card className="glass border-0 rounded-[3rem] p-10 overflow-hidden relative">
              <div className="flex items-center justify-between mb-10">
                 <div>
                    <h3 className="text-5xl font-black text-gray-900 tracking-tighter mb-1">{formatINR(totalExpenses)}</h3>
                    <p className="text-sm text-emerald-600 font-black tracking-widest uppercase">Total Spent This Month</p>
                 </div>
                 <div className="p-6 bg-emerald-50 rounded-full border border-emerald-100/50">
                    <TrendingDown className="h-10 w-10 text-emerald-500" />
                 </div>
              </div>
              
              <div className="space-y-6 mb-10">
                 {expenses.slice(-3).reverse().map((exp, i) => (
                    <div key={exp.id} className="flex items-center justify-between group">
                       <div className="flex items-center gap-6">
                          <div className="h-14 w-14 bg-gray-50 rounded-2xl flex items-center justify-center font-black text-gray-400 group-hover:bg-white shadow-sm transition-all">
                             {exp.description[0]}
                          </div>
                          <div>
                             <p className="font-black text-gray-900 group-hover:text-indigo-600 transition-colors uppercase text-sm tracking-tight">{exp.description}</p>
                             <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{format(parseISO(exp.date), 'MMM d')}</p>
                          </div>
                       </div>
                       <span className="font-black text-gray-900">{formatINR(exp.amount)}</span>
                    </div>
                 ))}
              </div>

              <Link to="/expenses" className="block mt-4">
                 <Button className="w-full bg-indigo-600 hover:bg-black rounded-3xl h-16 font-black text-base shadow-2xl shadow-indigo-100 transition-all active:scale-95">
                   Full Expense Ledger
                   <ChevronRight className="h-5 w-5 ml-2" />
                 </Button>
              </Link>
           </Card>
        </section>

      </div>
    </div>
  );
};
