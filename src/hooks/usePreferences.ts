/**
 * usePreferences — TanStack Query hooks for the preferences domain.
 *
 * One row per user (upsert pattern on mutation).
 * Falls back to hardcoded defaults when no row exists yet in the DB.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as preferencesApi from '../services/api/preferences.api';
import type { UserPreferences } from '../types';

export const PREFERENCES_KEY = (userId: string) => ['preferences', userId] as const;

export const DEFAULT_PREFERENCES: UserPreferences = {
  preferredTransport: 'transit',
  maxBudget: 500,
  priorityMode: true,
};

// ─── Query ────────────────────────────────────────────────────────────────────

export function usePreferences(userId: string | null) {
  return useQuery({
    queryKey: PREFERENCES_KEY(userId ?? ''),
    queryFn: async () => {
      const prefs = await preferencesApi.fetch(userId!);
      // Return DB row if it exists, otherwise use defaults (first-time user)
      return prefs ?? DEFAULT_PREFERENCES;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,   // preferences change infrequently
    gcTime: 1000 * 60 * 10,
  });
}

// ─── Upsert ───────────────────────────────────────────────────────────────────

export function useUpsertPreferences(userId: string | null) {
  const queryClient = useQueryClient();
  const key = PREFERENCES_KEY(userId ?? '');

  return useMutation({
    mutationFn: (prefs: UserPreferences) => preferencesApi.upsert(userId!, prefs),

    onMutate: async (newPrefs) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<UserPreferences>(key);
      queryClient.setQueryData<UserPreferences>(key, newPrefs);
      return { previous };
    },

    onError: (_err, _prefs, ctx) => {
      if (ctx?.previous !== undefined) {
        queryClient.setQueryData(key, ctx.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}
