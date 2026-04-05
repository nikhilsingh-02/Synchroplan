/**
 * Preferences API — Supabase data access for the `preferences` table.
 *
 * One row per user (enforced by a UNIQUE constraint on user_id in the DB).
 * All mutations use upsert so this is safe to call whether or not the row
 * already exists.
 */

import { supabase } from '../../lib/supabase';
import type { UserPreferences } from '../../types';
import {
  preferencesFromDb,
  preferencesToDb,
  type PreferencesRow,
} from './mapper';

const TABLE = 'preferences' as const;

/** Fetch the user's preferences row. Returns null if none have been saved yet. */
export async function fetch(userId: string): Promise<UserPreferences | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(`[preferences.api] fetch: ${error.message}`);
  return data ? preferencesFromDb(data as PreferencesRow) : null;
}

/**
 * Create or update the user's preferences.
 * Uses upsert to handle both the first-save and subsequent updates.
 */
export async function upsert(
  userId: string,
  prefs: UserPreferences,
): Promise<UserPreferences> {
  const row = preferencesToDb(userId, prefs);

  const { data, error } = await supabase
    .from(TABLE)
    .upsert(row, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) throw new Error(`[preferences.api] upsert: ${error.message}`);
  return preferencesFromDb(data as PreferencesRow);
}
