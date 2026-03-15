/**
 * useAIInsights — React hook to power the Recommendations page.
 *
 * Fetches required data (events, routes, expenses, preferences)
 * from the React Query cache, and computes AI insights using useMemo.
 */

import { useMemo } from 'react';
import { useEvents } from './useEvents';
import { useRoutes } from './useRoutes';
import { useExpenses } from './useExpenses';
import { usePreferences, DEFAULT_PREFERENCES } from './usePreferences';
import { generateInsights, generateScheduleGapInsights, type AIInsight } from '../services/ai/optimization.engine';
import { optimizeDailySchedule } from '../services/ai/scheduleOptimizer';
import { useNearbyPlaces } from './useNearbyPlaces';
import { supabase } from '../lib/supabase';


// Helper hook to grab the current user ID
import { useEffect, useState } from 'react';

export function useAIInsights(): { insights: AIInsight[]; isLoading: boolean } {
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

  const { data: events = [],     isLoading: req1 } = useEvents(userId);
  const { data: routes = [],     isLoading: req2 } = useRoutes(userId);
  const { data: expenses = [],   isLoading: req3 } = useExpenses(userId);
  const { data: prefs = DEFAULT_PREFERENCES, isLoading: req4 } = usePreferences(userId);
  const { rawPlaces } = useNearbyPlaces();

  const isLoading = req1 || req2 || req3 || req4;

  const insights = useMemo(() => {
    if (isLoading) return [];
    
    // 1. Core Rule-Based Insights
    const baseInsights = generateInsights(events, routes, expenses, prefs);

    // 2. Autonomous Route & Schedule Optimizer
    const optimizerInsights: AIInsight[] = [];
    
    // Group events by day
    const eventsByDay = events.reduce<Record<string, typeof events>>((acc, e) => {
      const day = new Date(e.startTime).toDateString();
      if (!acc[day]) acc[day] = [];
      acc[day].push(e);
      return acc;
    }, {});

    for (const [day, dayEvents] of Object.entries(eventsByDay)) {
      if (dayEvents.length > 2) {
        // Evaluate the day's schedule through the AI Optimizer
        const result = optimizeDailySchedule(dayEvents, routes);
        
        // Only generate an insight if we can save meaningful time (> 5 mins)
        if (result.travelTimeSaved > 5) {
          optimizerInsights.push({
            id: `optimize-${day.replace(/\s/g, '-')}`,
            category: 'SCHEDULE_REORDER_SUGGESTION',
            title: 'Reorder Meetings to Reduce Travel',
            description: `Reordering your meetings on ${day} could reduce travel time by ${Math.round(result.travelTimeSaved)} minutes.`,
            impact: `Save ${Math.round(result.travelTimeSaved)} mins travel`,
            severity: 'medium',
            recommendedAction: 'Apply the optimized schedule order below.',
            optimizationDetails: {
              ...result,
              originalOrder: dayEvents,
            },
          });
        }
      }
    }

    // 3. Schedule Gap Intelligence (location-aware)
    const gapInsights = generateScheduleGapInsights(events, rawPlaces);

    return [...optimizerInsights, ...gapInsights, ...baseInsights];
  }, [events, routes, expenses, prefs, isLoading, rawPlaces]);


  return { insights, isLoading };
}
