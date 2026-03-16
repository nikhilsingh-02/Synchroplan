import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from 'react';
import { format, isAfter } from 'date-fns';
import { supabase } from '../../lib/supabase';
import type {
  Event,
  TravelRoute,
  Expense,
  Recommendation,
  Conflict,
  UserPreferences,
} from '../../types';
import {
  useEvents,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
} from '../../hooks/useEvents';
import {
  useExpenses,
  useCreateExpense,
  useDeleteExpense,
} from '../../hooks/useExpenses';
import { useRoutes, useCreateRoute } from '../../hooks/useRoutes';
import { usePreferences, useUpsertPreferences, DEFAULT_PREFERENCES } from '../../hooks/usePreferences';
import { getTravelDuration } from '../../services/ai/scheduleOptimizer';

// Re-export domain types so existing page-level imports continue to work.
export type { Event, TravelRoute, Expense, Recommendation, Conflict, UserPreferences } from '../../types';

// ─── Context Interface (public API — unchanged) ────────────────────────────────

interface AppContextType {
  events: Event[];
  addEvent: (event: Omit<Event, 'id'>) => void;
  updateEvent: (id: string, updates: Partial<Event>) => void;
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

  userPreferences: UserPreferences;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

// ─── Static Recommendations (not yet persisted — wired in Phase 4) ────────────

const STATIC_RECOMMENDATIONS: Recommendation[] = [
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
];

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  // ── Auth user id (sourced directly from Supabase — no AuthContext dependency)
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Server state via React Query ─────────────────────────────────────────────

  const eventsQuery      = useEvents(userId);
  const expensesQuery    = useExpenses(userId);
  const routesQuery      = useRoutes(userId);
  const preferencesQuery = usePreferences(userId);

  const events      = eventsQuery.data      ?? [];
  const expenses    = expensesQuery.data    ?? [];
  const routes      = routesQuery.data      ?? [];
  const userPreferences = preferencesQuery.data ?? DEFAULT_PREFERENCES;
  const budget      = userPreferences.maxBudget;

  // ── Mutations ─────────────────────────────────────────────────────────────────

  const createEventMutation    = useCreateEvent(userId);
  const updateEventMutation    = useUpdateEvent(userId);
  const deleteEventMutation    = useDeleteEvent(userId);

  const createExpenseMutation  = useCreateExpense(userId);
  const deleteExpenseMutation  = useDeleteExpense(userId);

  const createRouteMutation    = useCreateRoute(userId);

  const upsertPrefsMutation    = useUpsertPreferences(userId);

  // ── Manually resolved conflicts (dismissed by user in this session) ───────────
  const [manuallyResolved, setManuallyResolved] = useState<Set<string>>(new Set());

  // ── Conflict Detection ───────────────────────────────────────────────────────
  // Derived from server state — recomputed whenever events / expenses / budget change.

  const conflicts = useMemo<Conflict[]>(() => {
    const detected: Conflict[] = [];
    const sorted = [...events].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next    = sorted[i + 1];

      const currentEnd = new Date(current.endTime);
      const nextStart  = new Date(next.startTime);

      // Time overlap
      if (isAfter(currentEnd, nextStart)) {
        detected.push({
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

      // Insufficient travel buffer
      const gapMin = (nextStart.getTime() - currentEnd.getTime()) / 60_000;
      const travelMin = getTravelDuration(current, next, routes);

      if (gapMin < travelMin && gapMin > 0) {
        detected.push({
          id: `travel-${current.id}-${next.id}`,
          eventIds: [current.id, next.id],
          type: 'insufficient_travel_time',
          severity: 'high',
          description: `⚠ Travel time between events is insufficient. Only ${Math.floor(gapMin)} min available, but ~${Math.floor(travelMin)} min needed.`,
          suggestions: [
            `Add ${Math.ceil(travelMin - gapMin)} minutes buffer`,
            `Use faster transportation`,
            `Reschedule one event`,
          ],
        });
      }
    }

    // Budget alert
    const totalSpend = expenses.reduce((sum, e) => sum + e.amount, 0);
    if (totalSpend > budget * 0.9) {
      detected.push({
        id: 'budget-warning',
        eventIds: [],
        type: 'budget_exceeded',
        severity: totalSpend > budget ? 'high' : 'medium',
        description: `Expenses (${totalSpend.toFixed(2)}) approaching budget limit (${budget})`,
        suggestions: [
          'Review and reduce non-essential expenses',
          'Increase budget allocation',
          'Choose more cost-effective travel options',
        ],
      });
    }

    // Filter out any the user has dismissed this session
    return detected.filter(c => !manuallyResolved.has(c.id));
  }, [events, expenses, budget, manuallyResolved]);

  // ── Public Mutation Wrappers ───────────────────────────────────────────────────
  // These maintain the same synchronous-looking API the UI components expect.

  const addEvent = (event: Omit<Event, 'id'>) => {
    const newEvent: Event = { ...event, id: crypto.randomUUID() };
    createEventMutation.mutate(newEvent);
  };

  const updateEvent = (id: string, updates: Partial<Event>) => {
    updateEventMutation.mutate({ id, updates });
  };

  const deleteEvent = (id: string) => {
    deleteEventMutation.mutate(id);
  };

  const addRoute = (route: Omit<TravelRoute, 'id'>) => {
    const newRoute: TravelRoute = { ...route, id: crypto.randomUUID() };
    createRouteMutation.mutate(newRoute);
  };

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newExpense: Expense = { ...expense, id: crypto.randomUUID() };
    createExpenseMutation.mutate(newExpense);
  };

  const deleteExpense = (id: string) => {
    deleteExpenseMutation.mutate(id);
  };

  const resolveConflict = (conflictId: string, _action: string) => {
    setManuallyResolved(prev => new Set([...prev, conflictId]));
  };

  const updatePreferences = (prefs: Partial<UserPreferences>) => {
    const updated = { ...userPreferences, ...prefs };
    upsertPrefsMutation.mutate(updated);
  };

  const setBudget = (amount: number) => {
    const updated = { ...userPreferences, maxBudget: amount };
    upsertPrefsMutation.mutate(updated);
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
        recommendations: STATIC_RECOMMENDATIONS,
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
