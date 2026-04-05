import { format, differenceInMinutes } from 'date-fns';
import type { Event, TravelRoute, Expense, UserPreferences } from '../../types';
import { getTravelDuration } from './scheduleOptimizer';
import type { NearbyPlace } from '../places/overpass.service';

// ─── Insight Types ────────────────────────────────────────────────────────────

export type InsightCategory =
  | 'TIME_OPTIMIZATION'
  | 'ROUTE_OPTIMIZATION'
  | 'COST_OPTIMIZATION'
  | 'SCHEDULE_CONFLICT'
  | 'TRAVEL_BUFFER_WARNING'
  | 'SCHEDULE_REORDER_SUGGESTION'
  | 'SCHEDULE_GAP_SUGGESTION';

export type InsightSeverity = 'low' | 'medium' | 'high';

export interface NearbyPlaceSuggestion {
  name: string;
  category: 'restaurant' | 'hotel' | 'service' | 'hospital';
  distance: number;           // km
  latitude: number;
  longitude: number;
}

export interface AIInsight {
  id: string;
  category: InsightCategory;
  title: string;
  description: string;
  impact: string;                // Short badge text (e.g. "-15 mins travel", "+₹500 saved")
  severity: InsightSeverity;
  recommendedAction: string;     // Actionable next step
  relatedEventIds?: string[];
  nearbySuggestions?: NearbyPlaceSuggestion[];  // Gap-aware nearby place suggestions
  optimizationDetails?: {
    originalTravelTime: number;
    optimizedTravelTime: number;
    optimizedOrder: Event[];
    originalOrder?: Event[];
  };
}

// ─── Core Engine ──────────────────────────────────────────────────────────────

export function generateInsights(
  events: Event[],
  routes: TravelRoute[],
  expenses: Expense[],
  preferences: UserPreferences,
): AIInsight[] {
  const insights: AIInsight[] = [];

  // Sort events chronologically to analyze flow
  const sortedEvents = [...events]
    .filter(e => e.startTime && e.endTime)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  insights.push(...analyzeTravel(routes));
  insights.push(...analyzeBudget(expenses, preferences.maxBudget));
  insights.push(...analyzeScheduleFlow(sortedEvents, routes));

  // Sort by severity (high -> medium -> low)
  const severityWeight = { high: 3, medium: 2, low: 1 };
  insights.sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity]);

  return insights;
}

// ─── Analysis Modules ─────────────────────────────────────────────────────────

function analyzeTravel(routes: TravelRoute[]): AIInsight[] {
  const insights: AIInsight[] = [];

  for (const route of routes) {
    if (route.trafficLevel === 'high' || route.status === 'delayed') {
      insights.push({
        id: `route-traffic-${route.id}`,
        category: 'ROUTE_OPTIMIZATION',
        title: 'Heavy Traffic Detected',
        description: `Your route from ${route.from.split(',')[0]} to ${route.to.split(',')[0]} is experiencing significant delays.`,
        impact: `+${Math.round(route.duration * 0.3)} min delay`,
        severity: 'high',
        recommendedAction: 'Leave 15-20 minutes earlier or switch to public transit.',
      });
    }

    if (route.distance > 5 && route.mode === 'walking') {
      insights.push({
        id: `route-mode-${route.id}`,
        category: 'ROUTE_OPTIMIZATION',
        title: 'Inefficient Travel Mode',
        description: `${route.distance}km is a long distance to walk from ${route.from.split(',')[0]} to ${route.to.split(',')[0]}.`,
        impact: `Save ${Math.floor(route.duration * 0.7)} mins`,
        severity: 'medium',
        recommendedAction: 'Consider taking a cab or public transit to save significant time.',
      });
    }
  }

  return insights;
}

function analyzeBudget(expenses: Expense[], maxBudget: number): AIInsight[] {
  const insights: AIInsight[] = [];

  const totalSpend = expenses.reduce((sum, e) => sum + e.amount, 0);
  const ratio = totalSpend / maxBudget;

  if (ratio > 1) {
    insights.push({
      id: 'budget-over',
      category: 'COST_OPTIMIZATION',
      title: 'Budget Exceeded',
      description: `You have spent ₹${totalSpend.toLocaleString()} which is over your ₹${maxBudget.toLocaleString()} limit.`,
      impact: `Limit exceeded`,
      severity: 'high',
      recommendedAction: 'Review recent expenses and cut non-essential costs for the rest of the period.',
    });
  } else if (ratio > 0.8) {
    insights.push({
      id: 'budget-warning',
      category: 'COST_OPTIMIZATION',
      title: 'Approaching Budget Limit',
      description: `You have spent ${Math.round(ratio * 100)}% of your ₹${maxBudget.toLocaleString()} budget.`,
      impact: `₹${(maxBudget - totalSpend).toLocaleString()} remaining`,
      severity: 'medium',
      recommendedAction: 'Opt for more cost-effective travel and dining options.',
    });
  }

  const travelSpend = expenses
    .filter(e => e.category === 'transport')
    .reduce((sum, e) => sum + e.amount, 0);

  if (travelSpend > totalSpend * 0.5 && travelSpend > 0) {
    insights.push({
      id: 'budget-transport',
      category: 'COST_OPTIMIZATION',
      title: 'High Transportation Costs',
      description: 'Over 50% of your expenses are going towards transportation.',
      impact: "High spend",
      severity: 'low',
      recommendedAction: 'Consider consolidating trips or using public transit more frequently.',
    });
  }

  return insights;
}

function analyzeScheduleFlow(events: Event[], routes: TravelRoute[]): AIInsight[] {
  const insights: AIInsight[] = [];

  for (let i = 0; i < events.length - 1; i++) {
    const current = events[i];
    const next    = events[i + 1];

    const currentEnd = new Date(current.endTime);
    const nextStart  = new Date(next.startTime);

    // Only analyze pairs on the same day
    if (currentEnd.toDateString() !== nextStart.toDateString()) continue;

    const gapMinutes = differenceInMinutes(nextStart, currentEnd);

    // 1. Long idle gaps (Time Optimization)
    if (gapMinutes > 120) {
      insights.push({
        id: `idle-${current.id}-${next.id}`,
        category: 'TIME_OPTIMIZATION',
        title: 'Large Schedule Gap',
        description: `You have a ${gapMinutes} minute gap between "${current.title}" and "${next.title}".`,
        impact: `Unlock ${Math.floor(gapMinutes / 60)}h ${gapMinutes % 60}m`,
        severity: 'low',
        recommendedAction: 'You can fit a low-priority task here, or consider moving the events closer together.',
        relatedEventIds: [current.id, next.id],
      });
    }

    // 2. Travel Buffer Warning
    if (gapMinutes > 0 && current.location && next.location) {
      const travelTime = getTravelDuration(current, next, routes);

      if (gapMinutes < travelTime) {
        insights.push({
          id: `buffer-${current.id}-${next.id}`,
          category: 'TRAVEL_BUFFER_WARNING',
          title: 'Insufficient Travel Buffer',
          description: `You have ${gapMinutes} mins between events, but travel requires ~${Math.floor(travelTime)} mins.`,
          impact: "Possible delay",
          severity: 'high',
          recommendedAction: `Reschedule "${next.title}" to start ${Math.ceil(travelTime - gapMinutes)} minutes later.`,
          relatedEventIds: [current.id, next.id],
        });
      }
    }
  }

  // 3. Location grouping (Route Optimization)
  // Recommends grouping events in the same area
  const locationCounts = events.reduce<Record<string, number>>((acc, e) => {
    if (!e.location) return acc;
    const baseLoc = e.location.split(',')[0].trim();
    acc[baseLoc] = (acc[baseLoc] || 0) + 1;
    return acc;
  }, {});

  for (const [loc, count] of Object.entries(locationCounts)) {
    if (count >= 3) {
      insights.push({
        id: `grouping-${loc}`,
        category: 'ROUTE_OPTIMIZATION',
        title: 'Location Clustering Opportunity',
        description: `You have ${count} events near "${loc}".`,
        impact: "Save trips",
        severity: 'low',
        recommendedAction: 'Try scheduling these on the same day to minimize back-and-forth travel.',
      });
    }
  }

  return insights;
}

// ─── Schedule Gap Intelligence ─────────────────────────────────────────────────

/**
 * Generates schedule-gap insights that suggest nearby places for free windows.
 * 
 * @param events        The user's calendar events
 * @param nearbyPlaces  Raw NearbyPlace objects from Overpass
 */
export function generateScheduleGapInsights(
  events: Event[],
  nearbyPlaces: NearbyPlace[],
  routes: TravelRoute[],
): AIInsight[] {
  if (!nearbyPlaces || nearbyPlaces.length === 0) return [];

  const insights: AIInsight[] = [];

  const sorted = [...events]
    .filter(e => e.startTime && e.endTime)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next    = sorted[i + 1];

    const currentEnd  = new Date(current.endTime);
    const nextStart   = new Date(next.startTime);

    if (currentEnd.toDateString() !== nextStart.toDateString()) continue;

    const gapMinutes = differenceInMinutes(nextStart, currentEnd);
    const travelTime = getTravelDuration(current, next, routes);
    const availableGap = gapMinutes - travelTime;

    if (availableGap < 0) {
      insights.push({
        id: `conflict-${current.id}-${next.id}`,
        category: 'SCHEDULE_CONFLICT',
        title: 'Travel Time Conflict',
        description: `Travel time between "${current.title}" and "${next.title}" is insufficient. You need ~${Math.floor(travelTime)} mins, but only have ${gapMinutes} mins.`,
        impact: `Needs +${Math.ceil(Math.abs(availableGap))} mins`,
        severity: 'high',
        recommendedAction: 'Reschedule your events to allow enough travel time.',
        relatedEventIds: [current.id, next.id],
      });
      continue;
    }

    if (availableGap < 20) continue;

    const hour = currentEnd.getHours();
    const isLunchWindow = hour >= 11 && hour <= 14;
    
    let wantedTypes: string[];
    let contextLabel: string;

    if (isLunchWindow) {
      wantedTypes = ['restaurant'];
      contextLabel = 'restaurants for lunch';
    } else if (availableGap > 90) {
      wantedTypes = ['cafe', 'service'];
      contextLabel = 'cafes or services';
    } else {
      wantedTypes = ['cafe'];
      contextLabel = 'caffees nearby';
    }

    const suggestions = nearbyPlaces
      .filter(p => (wantedTypes as any[]).includes(p.category) && p.distance <= 10)
      .slice(0, 3);

    if (suggestions.length === 0) continue;

    const gapHours = Math.floor(gapMinutes / 60);
    const gapMins  = gapMinutes % 60;
    const gapLabel = gapHours > 0
      ? `${gapHours}h ${gapMins > 0 ? `${gapMins}m` : ''}`.trim()
      : `${gapMins}m`;

    const nearbySuggestions: NearbyPlaceSuggestion[] = suggestions.map(p => ({
      name:      p.name,
      category:  p.category as any,
      distance:  p.distance,
      latitude:  p.latitude,
      longitude: p.longitude,
    }));

    insights.push({
      id:       `gap-${current.id}-${next.id}`,
      category: 'SCHEDULE_GAP_SUGGESTION',
      title:    `${gapLabel} Gap — Suggested Stop`,
      description:
        `You have a ${gapLabel} window between your meetings. How about visiting one of these ${contextLabel}?`,
      impact:            `${gapLabel} free`,
      severity:          'low',
      recommendedAction: `Visit ${suggestions[0].name} or another nearby spot during your break.`,
      relatedEventIds:   [current.id, next.id],
      nearbySuggestions,
    });
  }

  return insights;
}
