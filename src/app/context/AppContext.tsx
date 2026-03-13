import React, { createContext, useContext, useState, useEffect } from 'react';
import { addHours, addMinutes, format, parseISO, isBefore, isAfter } from 'date-fns';

export interface Event {
  id: string;
  title: string;
  location: string;
  startTime: string;
  endTime: string;
  priority: 'high' | 'medium' | 'low';
  type: 'meeting' | 'task' | 'travel' | 'personal';
  latitude?: number;
  longitude?: number;
  notes?: string;
  hasConflict?: boolean;
}

export interface TravelRoute {
  id: string;
  from: string;
  to: string;
  mode: 'driving' | 'transit' | 'walking' | 'cycling';
  duration: number; // minutes
  distance: number; // km
  cost: number;
  arrivalTime: string;
  status: 'optimal' | 'delayed' | 'normal';
  trafficLevel?: 'low' | 'medium' | 'high';
}

export interface Expense {
  id: string;
  category: 'transport' | 'food' | 'accommodation' | 'other';
  amount: number;
  description: string;
  date: string;
  relatedEventId?: string;
}

export interface Recommendation {
  id: string;
  type: 'restaurant' | 'hotel' | 'service' | 'route';
  name: string;
  location: string;
  rating: number;
  priceRange: string;
  distance: number; // km from current location
  relevanceScore: number;
}

export interface Conflict {
  id: string;
  eventIds: string[];
  type: 'overlap' | 'insufficient_travel_time' | 'budget_exceeded';
  severity: 'high' | 'medium' | 'low';
  description: string;
  suggestions: string[];
}

interface AppContextType {
  events: Event[];
  addEvent: (event: Omit<Event, 'id'>) => void;
  updateEvent: (id: string, event: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  
  routes: TravelRoute[];
  addRoute: (route: Omit<TravelRoute, 'id'>) => void;
  
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;
  
  recommendations: Recommendation[];
  
  conflicts: Conflict[];
  resolveConflict: (conflictId: string, action: string) => void;
  
  budget: number;
  setBudget: (amount: number) => void;
  
  userPreferences: {
    preferredTransport: string;
    maxBudget: number;
    priorityMode: boolean;
  };
  updatePreferences: (prefs: Partial<AppContextType['userPreferences']>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize with sample data
  const [events, setEvents] = useState<Event[]>([
    {
      id: '1',
      title: 'Team Strategy Meeting',
      location: 'Downtown Office, 123 Business St',
      startTime: '2026-03-06T09:00:00',
      endTime: '2026-03-06T10:30:00',
      priority: 'high',
      type: 'meeting',
      latitude: 40.7589,
      longitude: -73.9851,
    },
    {
      id: '2',
      title: 'Client Presentation',
      location: 'Midtown Conference Center, 456 Corporate Ave',
      startTime: '2026-03-06T11:00:00',
      endTime: '2026-03-06T12:30:00',
      priority: 'high',
      type: 'meeting',
      latitude: 40.7549,
      longitude: -73.9840,
      hasConflict: true,
    },
    {
      id: '3',
      title: 'Lunch with Investors',
      location: 'The Grand Restaurant, 789 Finance Blvd',
      startTime: '2026-03-06T13:00:00',
      endTime: '2026-03-06T14:30:00',
      priority: 'medium',
      type: 'meeting',
      latitude: 40.7580,
      longitude: -73.9855,
    },
    {
      id: '4',
      title: 'Project Review',
      location: 'Tech Hub, 321 Innovation Dr',
      startTime: '2026-03-06T15:00:00',
      endTime: '2026-03-06T16:00:00',
      priority: 'medium',
      type: 'meeting',
      latitude: 40.7614,
      longitude: -73.9776,
    },
  ]);

  const [routes, setRoutes] = useState<TravelRoute[]>([
    {
      id: 'r1',
      from: 'Downtown Office',
      to: 'Midtown Conference Center',
      mode: 'driving',
      duration: 25,
      distance: 3.2,
      cost: 12.50,
      arrivalTime: '2026-03-06T10:55:00',
      status: 'delayed',
      trafficLevel: 'high',
    },
    {
      id: 'r2',
      from: 'Downtown Office',
      to: 'Midtown Conference Center',
      mode: 'transit',
      duration: 18,
      distance: 2.8,
      cost: 2.75,
      arrivalTime: '2026-03-06T10:48:00',
      status: 'optimal',
      trafficLevel: 'low',
    },
  ]);

  const [expenses, setExpenses] = useState<Expense[]>([
    {
      id: 'e1',
      category: 'transport',
      amount: 45.30,
      description: 'Taxi to client meeting',
      date: '2026-03-05T14:30:00',
      relatedEventId: '2',
    },
    {
      id: 'e2',
      category: 'food',
      amount: 67.80,
      description: 'Business lunch',
      date: '2026-03-05T13:00:00',
      relatedEventId: '3',
    },
    {
      id: 'e3',
      category: 'accommodation',
      amount: 189.00,
      description: 'Hotel near conference venue',
      date: '2026-03-05T20:00:00',
    },
  ]);

  const [recommendations, setRecommendations] = useState<Recommendation[]>([
    {
      id: 'rec1',
      type: 'restaurant',
      name: 'Bella Italia',
      location: '234 Central Ave',
      rating: 4.5,
      priceRange: '$$',
      distance: 0.3,
      relevanceScore: 0.92,
    },
    {
      id: 'rec2',
      type: 'hotel',
      name: 'Executive Suites Hotel',
      location: '567 Business District',
      rating: 4.7,
      priceRange: '$$$',
      distance: 0.8,
      relevanceScore: 0.88,
    },
    {
      id: 'rec3',
      type: 'service',
      name: 'QuickPrint Services',
      location: '890 Office Plaza',
      rating: 4.3,
      priceRange: '$',
      distance: 0.2,
      relevanceScore: 0.85,
    },
  ]);

  const [conflicts, setConflicts] = useState<Conflict[]>([
    {
      id: 'c1',
      eventIds: ['1', '2'],
      type: 'insufficient_travel_time',
      severity: 'high',
      description: 'Only 30 minutes between meetings, but 25 min travel time required',
      suggestions: [
        'Reschedule Client Presentation to 11:30 AM',
        'Use transit instead of driving (18 min)',
        'Move Team Meeting end time to 10:00 AM',
      ],
    },
  ]);

  const [budget, setBudget] = useState(500);
  const [userPreferences, setUserPreferences] = useState({
    preferredTransport: 'transit',
    maxBudget: 500,
    priorityMode: true,
  });

  // Conflict detection logic
  useEffect(() => {
    const detectedConflicts: Conflict[] = [];
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    for (let i = 0; i < sortedEvents.length - 1; i++) {
      const current = sortedEvents[i];
      const next = sortedEvents[i + 1];
      
      const currentEnd = new Date(current.endTime);
      const nextStart = new Date(next.startTime);
      
      // Check for overlap
      if (isAfter(currentEnd, nextStart)) {
        detectedConflicts.push({
          id: `conflict-${current.id}-${next.id}`,
          eventIds: [current.id, next.id],
          type: 'overlap',
          severity: 'high',
          description: `${current.title} overlaps with ${next.title}`,
          suggestions: [
            `Reschedule ${next.title} to after ${format(currentEnd, 'h:mm a')}`,
            `End ${current.title} earlier`,
            `Cancel lower priority event`,
          ],
        });
      }
      
      // Check travel time sufficiency
      const timeGap = (nextStart.getTime() - currentEnd.getTime()) / (1000 * 60); // minutes
      const estimatedTravelTime = 20; // simplified - would use actual route data
      
      if (timeGap < estimatedTravelTime && timeGap > 0) {
        detectedConflicts.push({
          id: `travel-${current.id}-${next.id}`,
          eventIds: [current.id, next.id],
          type: 'insufficient_travel_time',
          severity: 'high',
          description: `Only ${Math.floor(timeGap)} minutes between events, ${estimatedTravelTime} min needed for travel`,
          suggestions: [
            `Add ${estimatedTravelTime - timeGap} minutes buffer`,
            `Use faster transportation`,
            `Reschedule one event`,
          ],
        });
      }
    }

    // Check budget
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    if (totalExpenses > budget * 0.9) {
      detectedConflicts.push({
        id: 'budget-warning',
        eventIds: [],
        type: 'budget_exceeded',
        severity: totalExpenses > budget ? 'high' : 'medium',
        description: `Expenses (${totalExpenses.toFixed(2)}) approaching budget limit (${budget})`,
        suggestions: [
          'Review and reduce non-essential expenses',
          'Increase budget allocation',
          'Choose more cost-effective travel options',
        ],
      });
    }

    setConflicts(detectedConflicts);
  }, [events, expenses, budget]);

  const addEvent = (event: Omit<Event, 'id'>) => {
    const newEvent = { ...event, id: Date.now().toString() };
    setEvents([...events, newEvent]);
  };

  const updateEvent = (id: string, updates: Partial<Event>) => {
    setEvents(events.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const deleteEvent = (id: string) => {
    setEvents(events.filter(e => e.id !== id));
  };

  const addRoute = (route: Omit<TravelRoute, 'id'>) => {
    const newRoute = { ...route, id: Date.now().toString() };
    setRoutes([...routes, newRoute]);
  };

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newExpense = { ...expense, id: Date.now().toString() };
    setExpenses([...expenses, newExpense]);
  };

  const deleteExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const resolveConflict = (conflictId: string, action: string) => {
    // Implement conflict resolution logic
    setConflicts(conflicts.filter(c => c.id !== conflictId));
  };

  const updatePreferences = (prefs: Partial<typeof userPreferences>) => {
    setUserPreferences({ ...userPreferences, ...prefs });
  };

  return (
    <AppContext.Provider
      value={{
        events,
        addEvent,
        updateEvent,
        deleteEvent,
        routes,
        addRoute,
        expenses,
        addExpense,
        deleteExpense,
        recommendations,
        conflicts,
        resolveConflict,
        budget,
        setBudget,
        userPreferences,
        updatePreferences,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
