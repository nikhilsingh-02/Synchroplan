/**
 * Events API — Supabase data access for the `events` table.
 *
 * All functions are typed using src/types/index.ts.
 * Column mapping is handled by mapper.ts.
 * Errors are thrown so the caller (AppContext) can log them.
 */

import { supabase } from '../../lib/supabase';
import type { Event } from '../../types';
import {
  eventFromDb,
  eventToDb,
  type EventRow,
} from './mapper';

const TABLE = 'events' as const;

/** Fetch all events belonging to the authenticated user. */
export async function fetchAll(userId: string): Promise<Event[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('start_time', { ascending: true });

  if (error) throw new Error(`[events.api] fetchAll: ${error.message}`);
  return (data as EventRow[]).map(eventFromDb);
}

/** Persist a new event to the database. */
export async function create(userId: string, event: Event): Promise<Event> {
  const row = eventToDb(userId, event);

  const { data, error } = await supabase
    .from(TABLE)
    .insert(row)
    .select()
    .single();

  if (error) throw new Error(`[events.api] create: ${error.message}`);
  return eventFromDb(data as EventRow);
}

/** Update an existing event. Only provided fields are changed. */
export async function update(
  id: string,
  userId: string,
  updates: Partial<Omit<Event, 'id'>>
): Promise<Event> {
  // Build a partial DB row — only include fields that were supplied
  const partial: Partial<EventRow> = {};
  if (updates.title !== undefined) partial.title = updates.title;
  if (updates.location !== undefined) partial.location = updates.location;
  if (updates.startTime !== undefined) partial.start_time = updates.startTime;
  if (updates.endTime !== undefined) partial.end_time = updates.endTime;
  if (updates.priority !== undefined) partial.priority = updates.priority;
  if (updates.type !== undefined) partial.type = updates.type;
  if (updates.latitude !== undefined) partial.latitude = updates.latitude ?? null;
  if (updates.longitude !== undefined) partial.longitude = updates.longitude ?? null;
  if (updates.notes !== undefined) partial.notes = updates.notes ?? null;
  if (updates.hasConflict !== undefined) partial.has_conflict = updates.hasConflict;

  const { data, error } = await supabase
    .from(TABLE)
    .update(partial)
    .eq('id', id)
    .eq('user_id', userId)   // belt-and-suspenders: RLS also enforces this
    .select()
    .single();

  if (error) throw new Error(`[events.api] update: ${error.message}`);
  return eventFromDb(data as EventRow);
}

/** Delete an event by id. */
export async function remove(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new Error(`[events.api] remove: ${error.message}`);
}
