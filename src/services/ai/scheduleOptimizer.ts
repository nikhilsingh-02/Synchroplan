/**
 * Autonomous Route & Schedule Optimizer
 *
 * Implements a heuristic Traveling Salesman optimization:
 * 1. Nearest Neighbor (to build initial fast route)
 * 2. 2-opt improvement loop (to untangle crossing paths)
 *
 * Designed to minimize total travel time within a single day.
 */

import type { Event, TravelRoute } from '../../types';

export interface OptimizationResult {
  optimizedOrder: Event[];
  originalTravelTime: number;
  optimizedTravelTime: number;
  travelTimeSaved: number;
}

/**
 * Helper to fetch travel duration from the existing Mapbox routes table.
 * Falls back to 25 mins if no route has been generated yet between locations.
 */
function getTravelDuration(fromNode: Event, toNode: Event, routes: TravelRoute[]): number {
  if (!fromNode.location || !toNode.location) return 0; // Same location or missing

  const fromPrefix = fromNode.location.split(',')[0].trim().toLowerCase();
  const toPrefix   = toNode.location.split(',')[0].trim().toLowerCase();

  if (fromPrefix === toPrefix) return 0; // Same base location

  const route = routes.find(r => {
    const rFrom = r.from.toLowerCase();
    const rTo = r.to.toLowerCase();
    return (rFrom.includes(fromPrefix) && rTo.includes(toPrefix)) ||
           (rFrom.includes(toPrefix) && rTo.includes(fromPrefix));
  });

  return route?.duration ?? 25; // Default estimate
}

/**
 * Calculates total travel duration for a given sequence of events.
 */
function calculateTotalDuration(sequence: Event[], routes: TravelRoute[]): number {
  let sum = 0;
  for (let i = 0; i < sequence.length - 1; i++) {
    sum += getTravelDuration(sequence[i], sequence[i + 1], routes);
  }
  return sum;
}

/**
 * Optimizes a daily schedule to minimize travel time.
 * Assumes the events provided are for a single day.
 * 
 * First event is locked as the Starting Node (e.g. morning departure).
 */
export function optimizeDailySchedule(
  events: Event[],
  routes: TravelRoute[]
): OptimizationResult {
  if (events.length <= 2) {
    const dur = calculateTotalDuration(events, routes);
    return {
      optimizedOrder: events,
      originalTravelTime: dur,
      optimizedTravelTime: dur,
      travelTimeSaved: 0,
    };
  }

  // 1. Initial State
  const originalDuration = calculateTotalDuration(events, routes);

  // 2. Nearest Neighbor Algorithm (Initial Construction)
  const unvisited = events.slice(1);
  const currentOrder = [events[0]];

  while (unvisited.length > 0) {
    const lastNode = currentOrder[currentOrder.length - 1];
    
    let nearestIdx = 0;
    let minDur = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const dur = getTravelDuration(lastNode, unvisited[i], routes);
      if (dur < minDur) {
        minDur = dur;
        nearestIdx = i;
      }
    }

    currentOrder.push(unvisited[nearestIdx]);
    unvisited.splice(nearestIdx, 1);
  }

  // 3. 2-opt Improvement Loop (Untangles crossing routes)
  let bestOrder = [...currentOrder];
  let bestDuration = calculateTotalDuration(bestOrder, routes);
  let improvement = true;
  let iterations = 0;
  const MAX_ITERATIONS = 100; // Failsafe for performance

  while (improvement && iterations < MAX_ITERATIONS) {
    improvement = false;
    iterations++;

    for (let i = 1; i < bestOrder.length - 2; i++) {
      for (let k = i + 1; k < bestOrder.length - 1; k++) {
        // Swap edges by reversing section between i and k
        const newOrder = [
          ...bestOrder.slice(0, i),
          ...bestOrder.slice(i, k + 1).reverse(),
          ...bestOrder.slice(k + 1)
        ];

        const testDuration = calculateTotalDuration(newOrder, routes);

        // If swap reduces travel time, adopt it
        if (testDuration < bestDuration) {
          bestDuration = testDuration;
          bestOrder = newOrder;
          improvement = true;
        }
      }
    }
  }

  return {
    optimizedOrder: bestOrder,
    originalTravelTime: originalDuration,
    optimizedTravelTime: bestDuration,
    travelTimeSaved: originalDuration - bestDuration,
  };
}
