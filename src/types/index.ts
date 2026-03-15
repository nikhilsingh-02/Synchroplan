/**
 * SynchroPlan — Canonical Type Definitions
 *
 * Single source of truth for all domain interfaces.
 * All modules must import from this file.
 *
 * Previous locations (now deleted):
 *   - src/types.ts          (minimal, conflicting definitions)
 *   - src/app/context/AppContext.tsx (inline definitions — moved here)
 */

// ─── Core Domain Types ────────────────────────────────────────────────────────

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
  /** Google Calendar event ID (or other external ID). Used for upsert de-duplication. */
  externalId?: string;
  /** Origin of the event. 'manual' = created in-app; 'google_calendar' = imported. */
  source?: 'manual' | 'google_calendar' | 'outlook';
}

export interface TravelRoute {
  id: string;
  from: string;
  to: string;
  mode: 'driving' | 'transit' | 'walking' | 'cycling';
  duration: number;   // minutes
  distance: number;   // km
  cost: number;
  arrivalTime: string;
  status: 'optimal' | 'delayed' | 'normal';
  trafficLevel?: 'low' | 'medium' | 'high';
}

/**
 * Route is an alias for TravelRoute.
 * Kept for compatibility with the AI services layer.
 */
export type Route = TravelRoute;

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
  distance: number;   // km from current location
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

export interface UserPreferences {
  preferredTransport: string;
  maxBudget: number;
  priorityMode: boolean;
}
