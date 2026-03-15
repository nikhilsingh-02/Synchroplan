/**
 * useExpenses — TanStack Query hooks for the expenses domain.
 *
 * Optimistic update pattern mirrors useEvents.ts.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as expensesApi from '../services/api/expenses.api';
import type { Expense } from '../types';

export const EXPENSES_KEY = (userId: string) => ['expenses', userId] as const;

// ─── Query ────────────────────────────────────────────────────────────────────

export function useExpenses(userId: string | null) {
  return useQuery({
    queryKey: EXPENSES_KEY(userId ?? ''),
    queryFn: () => expensesApi.fetchAll(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
  });
}

// ─── Create ───────────────────────────────────────────────────────────────────

export function useCreateExpense(userId: string | null) {
  const queryClient = useQueryClient();
  const key = EXPENSES_KEY(userId ?? '');

  return useMutation({
    mutationFn: (expense: Expense) => expensesApi.create(userId!, expense),

    onMutate: async (newExpense) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Expense[]>(key);
      queryClient.setQueryData<Expense[]>(key, old => [...(old ?? []), newExpense]);
      return { previous };
    },

    onError: (_err, _expense, ctx) => {
      if (ctx?.previous !== undefined) {
        queryClient.setQueryData(key, ctx.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export function useDeleteExpense(userId: string | null) {
  const queryClient = useQueryClient();
  const key = EXPENSES_KEY(userId ?? '');

  return useMutation({
    mutationFn: (id: string) => expensesApi.remove(id, userId!),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Expense[]>(key);
      queryClient.setQueryData<Expense[]>(key, old =>
        (old ?? []).filter(e => e.id !== id)
      );
      return { previous };
    },

    onError: (_err, _id, ctx) => {
      if (ctx?.previous !== undefined) {
        queryClient.setQueryData(key, ctx.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}
