/**
 * Routes API — Supabase data access for the `routes` table.
 *
 * All functions are typed using src/types/index.ts.
 * Column mapping is handled by mapper.ts.
 */

import { supabase } from '../../lib/supabase';
import type { TravelRoute } from '../../types';
import {
  routeFromDb,
  routeToDb,
  type RouteRow,
} from './mapper';

const TABLE = 'routes' as const;

/** Fetch all routes belonging to the authenticated user. */
export async function fetchAll(userId: string): Promise<TravelRoute[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`[routes.api] fetchAll: ${error.message}`);
  return (data as RouteRow[]).map(routeFromDb);
}

/** Persist a new route to the database. */
export async function create(userId: string, route: TravelRoute): Promise<TravelRoute> {
  const row = routeToDb(userId, route);

  const { data, error } = await supabase
    .from(TABLE)
    .insert(row)
    .select()
    .single();

  if (error) throw new Error(`[routes.api] create: ${error.message}`);
  return routeFromDb(data as RouteRow);
}

/** Delete a route by id. */
export async function remove(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new Error(`[routes.api] remove: ${error.message}`);
}
