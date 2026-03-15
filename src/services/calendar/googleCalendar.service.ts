/**
 * Google Calendar Integration Service
 *
 * Handles:
 *  1. Fetching events from the Google Calendar REST API
 *  2. Transforming Google event schema → internal Event type
 *  3. Upserting events to Supabase (de-duplicated by external_id)
 *
 * Requirements:
 *  - User must be signed in via Google OAuth with calendar.readonly scope
 *  - provider_token must be available in the Supabase session
 *
 * No credentials are hardcoded — all auth is delegated to Supabase OAuth.
 */

import { supabase } from '../../lib/supabase';
import type { Event } from '../../types';

// ─── Google Calendar API Types ────────────────────────────────────────────────

interface GoogleEventDateTime {
  dateTime?: string;   // ISO 8601 with timezone (timed events)
  date?: string;       // YYYY-MM-DD (all-day events)
  timeZone?: string;
}

interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start: GoogleEventDateTime;
  end: GoogleEventDateTime;
  status?: string;
  htmlLink?: string;
}

interface GoogleCalendarResponse {
  items: GoogleCalendarEvent[];
  nextPageToken?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CALENDAR_API = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

// Fetch events from now to 30 days ahead by default
const DEFAULT_WINDOW_DAYS = 30;

// ─── Fetch ────────────────────────────────────────────────────────────────────

/**
 * Fetches events from the user's primary Google Calendar.
 *
 * @param accessToken  Google OAuth access token (session.provider_token)
 * @param windowDays   How many days ahead to fetch (default: 30)
 */
export async function fetchGoogleEvents(
  accessToken: string,
  windowDays = DEFAULT_WINDOW_DAYS,
): Promise<GoogleCalendarEvent[]> {
  const now      = new Date();
  const timeMin  = now.toISOString();
  const timeMax  = new Date(now.getTime() + windowDays * 86_400_000).toISOString();

  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents:  'true',
    orderBy:       'startTime',
    maxResults:    '250',
  });

  const res = await fetch(`${CALENDAR_API}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (res.status === 401) {
    throw new Error('Google Calendar access token expired. Please reconnect your calendar.');
  }
  if (!res.ok) {
    throw new Error(`Google Calendar API error: ${res.status} ${res.statusText}`);
  }

  const json: GoogleCalendarResponse = await res.json();
  return (json.items ?? []).filter(e => e.status !== 'cancelled');
}

// ─── Transform ────────────────────────────────────────────────────────────────

/**
 * Transforms a raw Google Calendar event into the internal Event shape.
 * All-day events (date-only) are given a default 1-hour duration at 09:00.
 */
export function transformGoogleEvent(gEvent: GoogleCalendarEvent): Omit<Event, 'id'> {
  const startRaw = gEvent.start.dateTime ?? `${gEvent.start.date}T09:00:00`;
  const endRaw   = gEvent.end.dateTime   ?? `${gEvent.end.date}T10:00:00`;

  return {
    title:      gEvent.summary?.trim()   || '(No title)',
    location:   gEvent.location?.trim()  || '',
    startTime:  startRaw,
    endTime:    endRaw,
    priority:   'medium',
    type:       'meeting',
    notes:      gEvent.description?.slice(0, 500) ?? undefined,
    hasConflict: false,
    externalId:  gEvent.id,
    source:      'google_calendar',
  };
}

// ─── Upsert ───────────────────────────────────────────────────────────────────

/**
 * Upserts a batch of Google Calendar events to the Supabase events table.
 * Uses (user_id, external_id) uniqueness to prevent duplicates on repeated syncs.
 *
 * @returns Number of events that were inserted or updated
 */
export async function syncEventsToSupabase(
  userId: string,
  googleEvents: GoogleCalendarEvent[],
): Promise<number> {
  if (googleEvents.length === 0) return 0;

  const rows = googleEvents.map(gEvent => {
    const ev = transformGoogleEvent(gEvent);
    return {
      user_id:     userId,
      title:       ev.title,
      location:    ev.location,
      start_time:  ev.startTime,
      end_time:    ev.endTime,
      priority:    ev.priority,
      type:        ev.type,
      notes:       ev.notes ?? null,
      has_conflict: false,
      external_id: gEvent.id,
      source:      'google_calendar' as const,
    };
  });

  // Upsert in batches of 50 to stay within Supabase request size limits
  const BATCH = 50;
  let total = 0;

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);

    const { data, error } = await supabase
      .from('events')
      .upsert(batch, {
        onConflict: 'user_id, external_id',
        ignoreDuplicates: false,   // update existing rows on re-sync
      })
      .select('id');

    if (error) {
      console.error('[googleCalendar.service] syncEventsToSupabase batch error:', error.message);
      // Continue with remaining batches — partial sync is better than none
    } else {
      total += data?.length ?? 0;
    }
  }

  return total;
}
