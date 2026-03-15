/**
 * Row mapper utilities
 *
 * PostgreSQL columns use snake_case; TypeScript interfaces use camelCase.
 * All translation between the two lives here — never in individual API files.
 *
 * Each API file imports the mapper for its own type and uses it for all
 * insert payloads (toDb) and query results (fromDb).
 */

import type { Event, TravelRoute, Expense, UserPreferences } from '../../types';

// ─── Events ──────────────────────────────────────────────────────────────────

/** Supabase row shape for the `events` table */
export interface EventRow {
  id: string;
  user_id: string;
  title: string;
  location: string;
  start_time: string;
  end_time: string;
  priority: Event['priority'];
  type: Event['type'];
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  has_conflict: boolean;
  external_id: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
}


export function eventFromDb(row: EventRow): Event {
  return {
    id: row.id,
    title: row.title,
    location: row.location,
    startTime: row.start_time,
    endTime: row.end_time,
    priority: row.priority,
    type: row.type,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    notes: row.notes ?? undefined,
    hasConflict: row.has_conflict,
    externalId: row.external_id ?? undefined,
    source: (row.source ?? 'manual') as Event['source'],
  };
}


export function eventToDb(
  userId: string,
  event: Omit<Event, 'id'> & { id?: string }
): Omit<EventRow, 'created_at' | 'updated_at'> {
  return {
    id: event.id!,
    user_id: userId,
    title: event.title,
    location: event.location,
    start_time: event.startTime,
    end_time: event.endTime,
    priority: event.priority,
    type: event.type,
    latitude: event.latitude ?? null,
    longitude: event.longitude ?? null,
    notes: event.notes ?? null,
    has_conflict: event.hasConflict ?? false,
    external_id: event.externalId ?? null,
    source: event.source ?? 'manual',
  };
}


// ─── Routes ──────────────────────────────────────────────────────────────────

/** Supabase row shape for the `routes` table */
export interface RouteRow {
  id: string;
  user_id: string;
  from_location: string;
  to_location: string;
  mode: TravelRoute['mode'];
  duration: number;
  distance: number;
  cost: number;
  arrival_time: string | null;
  status: TravelRoute['status'];
  traffic_level: TravelRoute['trafficLevel'] | null;
  created_at: string;
}

export function routeFromDb(row: RouteRow): TravelRoute {
  return {
    id: row.id,
    from: row.from_location,
    to: row.to_location,
    mode: row.mode,
    duration: row.duration,
    distance: Number(row.distance),
    cost: Number(row.cost),
    arrivalTime: row.arrival_time ?? '',
    status: row.status,
    trafficLevel: row.traffic_level ?? undefined,
  };
}

export function routeToDb(
  userId: string,
  route: Omit<TravelRoute, 'id'> & { id?: string }
): Omit<RouteRow, 'created_at'> {
  return {
    id: route.id!,
    user_id: userId,
    from_location: route.from,
    to_location: route.to,
    mode: route.mode,
    duration: route.duration,
    distance: route.distance,
    cost: route.cost,
    arrival_time: route.arrivalTime || null,
    status: route.status,
    traffic_level: route.trafficLevel ?? null,
  };
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

/** Supabase row shape for the `expenses` table */
export interface ExpenseRow {
  id: string;
  user_id: string;
  category: Expense['category'];
  amount: number;
  description: string;
  date: string;
  related_event_id: string | null;
  created_at: string;
}

export function expenseFromDb(row: ExpenseRow): Expense {
  return {
    id: row.id,
    category: row.category,
    amount: Number(row.amount),
    description: row.description,
    date: row.date,
    relatedEventId: row.related_event_id ?? undefined,
  };
}

export function expenseToDb(
  userId: string,
  expense: Omit<Expense, 'id'> & { id?: string }
): Omit<ExpenseRow, 'created_at'> {
  return {
    id: expense.id!,
    user_id: userId,
    category: expense.category,
    amount: expense.amount,
    description: expense.description,
    date: expense.date,
    related_event_id: expense.relatedEventId ?? null,
  };
}

// ─── Preferences ─────────────────────────────────────────────────────────────

/** Supabase row shape for the `preferences` table */
export interface PreferencesRow {
  id: string;
  user_id: string;
  preferred_transport: string;
  max_budget: number;
  priority_mode: boolean;
  created_at: string;
  updated_at: string;
}

export function preferencesFromDb(row: PreferencesRow): UserPreferences {
  return {
    preferredTransport: row.preferred_transport,
    maxBudget: Number(row.max_budget),
    priorityMode: row.priority_mode,
  };
}

export function preferencesToDb(
  userId: string,
  prefs: UserPreferences
): Pick<PreferencesRow, 'user_id' | 'preferred_transport' | 'max_budget' | 'priority_mode'> {
  return {
    user_id: userId,
    preferred_transport: prefs.preferredTransport,
    max_budget: prefs.maxBudget,
    priority_mode: prefs.priorityMode,
  };
}
