/**
 * useRoutes — TanStack Query hooks for the routes domain.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as routesApi from '../services/api/routes.api';
import type { TravelRoute } from '../types';

export const ROUTES_KEY = (userId: string) => ['routes', userId] as const;

// ─── Query ────────────────────────────────────────────────────────────────────

export function useRoutes(userId: string | null) {
  return useQuery({
    queryKey: ROUTES_KEY(userId ?? ''),
    queryFn: () => routesApi.fetchAll(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
  });
}

// ─── Create ───────────────────────────────────────────────────────────────────

export function useCreateRoute(userId: string | null) {
  const queryClient = useQueryClient();
  const key = ROUTES_KEY(userId ?? '');

  return useMutation({
    mutationFn: (route: TravelRoute) => routesApi.create(userId!, route),

    onMutate: async (newRoute) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<TravelRoute[]>(key);
      queryClient.setQueryData<TravelRoute[]>(key, old => [...(old ?? []), newRoute]);
      return { previous };
    },

    onError: (_err, _route, ctx) => {
      if (ctx?.previous !== undefined) {
        queryClient.setQueryData(key, ctx.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}
