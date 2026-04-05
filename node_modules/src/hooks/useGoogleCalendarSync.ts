/**
 * useGoogleCalendarSync — React hook for Google Calendar synchronization.
 *
 * Orchestrates the full sync pipeline:
 *  1. Reads the Google OAuth provider_token from the Supabase session
 *  2. Fetches events via the Google Calendar API
 *  3. Upserts them to Supabase (de-duplicated by external_id)
 *  4. Invalidates the React Query events cache so the UI refreshes
 *  5. Optionally calculates routes between consecutive imported events
 *
 * Usage:
 *   const { syncGoogleCalendar, isSyncing, lastSyncedAt, error } = useGoogleCalendarSync();
 */

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import {
  fetchGoogleEvents,
  syncEventsToSupabase,
  transformGoogleEvent,
} from '../services/calendar/googleCalendar.service';
import { geocodeAndCalculateRoute } from '../services/maps/ors.service';
import * as routesApi from '../services/api/routes.api';
import type { TravelRoute, Event } from '../types';
import { EVENTS_KEY } from './useEvents';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CalendarSyncState {
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  importedCount: number;
  error: string | null;
  isConnected: boolean;
}

export interface CalendarSyncActions {
  syncGoogleCalendar: () => Promise<void>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGoogleCalendarSync(): CalendarSyncState & CalendarSyncActions {
  const queryClient = useQueryClient();

  const [isSyncing, setIsSyncing]     = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [importedCount, setImportedCount] = useState(0);
  const [error, setError]             = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const syncGoogleCalendar = useCallback(async () => {
    setIsSyncing(true);
    setError(null);

    try {
      // ── Step 1: Get the current Supabase session ──────────────────────────
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Not authenticated. Please sign in.');
      }

      const userId       = session.user.id;
      const accessToken  = session.provider_token;

      if (!accessToken) {
        throw new Error(
          'Google Calendar access token not found in session. ' +
          'Please connect your Google account using the "Connect Google Calendar" button.'
        );
      }

      setIsConnected(true);

      // ── Step 2: Fetch events from Google Calendar API ─────────────────────
      const googleEvents = await fetchGoogleEvents(accessToken);

      // ── Step 3: Upsert to Supabase ────────────────────────────────────────
      const count = await syncEventsToSupabase(userId, googleEvents);
      setImportedCount(count);

      // ── Step 4: Invalidate React Query cache ──────────────────────────────
      // The events query will automatically re-fetch with the new data
      await queryClient.invalidateQueries({ queryKey: EVENTS_KEY(userId) });

      // ── Step 5: Calculate routes between consecutive imported events ───────
      // Run in the background — doesn't block the sync result
      const importedEvents = googleEvents.map(transformGoogleEvent);
      calculateRoutesInBackground(importedEvents, userId).catch(err => {
        console.warn('[useGoogleCalendarSync] Background route calc error:', err);
      });

      setLastSyncedAt(new Date());
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Calendar sync failed';
      setError(msg);
      console.error('[useGoogleCalendarSync]', err);
    } finally {
      setIsSyncing(false);
    }
  }, [queryClient]);

  return { isSyncing, lastSyncedAt, importedCount, error, isConnected, syncGoogleCalendar };
}

// ─── Background Route Calculation ─────────────────────────────────────────────

/**
 * After importing calendar events, attempt to calculate routes between
 * consecutive events that have location data. Runs fire-and-forget.
 */
async function calculateRoutesInBackground(
  events: Omit<Event, 'id'>[],
  userId: string,
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  // Filter out events without locations, sort by startTime
  const locationEvents = events
    .filter(e => e.location && e.location.trim().length > 0)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  for (let i = 0; i < locationEvents.length - 1; i++) {
    const current = locationEvents[i];
    const next    = locationEvents[i + 1];

    // Only calculate if on the same day
    const sameDay =
      new Date(current.endTime).toDateString() ===
      new Date(next.startTime).toDateString();

    if (!sameDay) continue;

    try {
      const result = await geocodeAndCalculateRoute(
        current.location,
        next.location,
        'driving',
        current.endTime,
      );

      if (!result) continue;

      const route: TravelRoute = {
        id:           crypto.randomUUID(),
        from:         current.location,
        to:           next.location,
        mode:         'driving',
        duration:     result.route.duration,
        distance:     result.route.distance,
        cost:         0,
        arrivalTime:  result.route.arrivalTime,
        status:       result.route.status,
        trafficLevel: result.route.trafficLevel,
      };

      await routesApi.create(userId, route);
    } catch (err) {
      // Non-fatal — skip to next pair
      console.warn(
        `[calendar] Could not calculate route ${current.location} → ${next.location}:`,
        err,
      );
    }
  }
}
