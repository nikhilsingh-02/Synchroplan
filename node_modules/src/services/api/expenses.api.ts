/**
 * Expenses API — Supabase data access for the `expenses` table.
 *
 * All functions are typed using src/types/index.ts.
 * Column mapping is handled by mapper.ts.
 */

import { supabase } from '../../lib/supabase';
import type { Expense } from '../../types';
import {
  expenseFromDb,
  expenseToDb,
  type ExpenseRow,
} from './mapper';

const TABLE = 'expenses' as const;

/** Fetch all expenses belonging to the authenticated user. */
export async function fetchAll(userId: string): Promise<Expense[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`[expenses.api] fetchAll: ${error.message}`);
  return (data as ExpenseRow[]).map(expenseFromDb);
}

/** Persist a new expense to the database. */
export async function create(userId: string, expense: Expense): Promise<Expense> {
  const row = expenseToDb(userId, expense);

  const { data, error } = await supabase
    .from(TABLE)
    .insert(row)
    .select()
    .single();

  if (error) throw new Error(`[expenses.api] create: ${error.message}`);
  return expenseFromDb(data as ExpenseRow);
}

/** Delete an expense by id. */
export async function remove(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new Error(`[expenses.api] remove: ${error.message}`);
}
