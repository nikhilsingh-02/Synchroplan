/**
 * useEvents — TanStack Query hooks for the events domain.
 *
 * Provides:
 *  - live query that fetches from Supabase on mount / invalidation
 *  - create / update / delete mutations with optimistic UI updates
 *
 * Optimistic update pattern:
 *   onMutate  → immediately patch the query cache (instant UI)
 *   onError   → roll back to previous cache snapshot
 *   onSettled → hard-refetch from server to guarantee consistency
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import * as eventsApi from '../services/api/events.api';
import type { Event } from '../types';

export const EVENTS_KEY = (userId: string) => ['events', userId] as const;

// ─── Query ────────────────────────────────────────────────────────────────────

export function useEvents(userId: string | null) {
  return useQuery({
    queryKey: EVENTS_KEY(userId ?? ''),
    queryFn: () => eventsApi.fetchAll(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60,        // consider cached data fresh for 1 minute
    gcTime: 1000 * 60 * 5,       // keep unused cache for 5 minutes
  });
}

// ─── Create ───────────────────────────────────────────────────────────────────

export function useCreateEvent(userId: string | null) {
  const queryClient = useQueryClient();
  const key = EVENTS_KEY(userId ?? '');

  return useMutation({
    mutationFn: (event: Event) => eventsApi.create(userId!, event),

    onMutate: async (newEvent) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Event[]>(key);
      queryClient.setQueryData<Event[]>(key, old => [...(old ?? []), newEvent]);
      return { previous };
    },

    onError: (_err, _event, ctx) => {
      if (ctx?.previous !== undefined) {
        queryClient.setQueryData(key, ctx.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

// ─── Update ───────────────────────────────────────────────────────────────────

export function useUpdateEvent(userId: string | null) {
  const queryClient = useQueryClient();
  const key = EVENTS_KEY(userId ?? '');

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Event> }) =>
      eventsApi.update(id, userId!, updates),

    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Event[]>(key);
      queryClient.setQueryData<Event[]>(key, old =>
        (old ?? []).map(e => e.id === id ? { ...e, ...updates } : e)
      );
      return { previous };
    },

    onError: (_err, _vars, ctx) => {
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

export function useDeleteEvent(userId: string | null) {
  const queryClient = useQueryClient();
  const key = EVENTS_KEY(userId ?? '');

  return useMutation({
    mutationFn: (id: string) => eventsApi.remove(id, userId!),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Event[]>(key);
      queryClient.setQueryData<Event[]>(key, old =>
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
