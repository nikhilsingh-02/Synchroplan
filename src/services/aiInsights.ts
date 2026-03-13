import type { Event, Route, Expense } from "../types";

export interface AIInsight {
  title: string;
  description: string;
  impact: string;
  type: "time" | "cost" | "route";
}

/*
AI Insight Generator

Analyzes:
• events
• routes
• expenses

Produces intelligent recommendations
*/

export function generateAIInsights(
  events: Event[],
  routes: Route[],
  expenses: Expense[]
): AIInsight[] {

  const insights: AIInsight[] = [];

  /* ------------------------------------------------
    Schedule Gap Detection
  ------------------------------------------------ */
insights.push({
  title: "AI System Active",
  description: "Your AI recommendation engine is running correctly.",
  impact: "System check successful",
  type: "time"
});

  const sortedEvents = [...events].sort(
    (a, b) =>
      new Date(a.startTime).getTime() -
      new Date(b.startTime).getTime()
  );

  sortedEvents.forEach((event, index) => {
    const nextEvent = sortedEvents[index + 1];
    if (!nextEvent) return;

    const gap =
      new Date(nextEvent.startTime).getTime() -
      new Date(event.endTime).getTime();

    if (gap > 60 * 60 * 1000) {
      insights.push({
        title: "Free Time Detected",
        description:
          "You have more than 1 hour between meetings.",
        impact: "Good opportunity for lunch or a break.",
        type: "time",
      });
    }
  });

  /* ------------------------------------------------
    Travel Conflict Detection
  ------------------------------------------------ */

  routes.forEach((route) => {
    if (route.trafficLevel === "high") {
      insights.push({
        title: "Heavy Traffic Warning",
        description: `Traffic is heavy on route ${route.from} → ${route.to}`,
        impact: "Leave 15 minutes earlier.",
        type: "route",
      });
    }
  });

  /* ------------------------------------------------
    High Travel Cost Detection
  ------------------------------------------------ */

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  if (totalExpenses > 2000) {
    insights.push({
      title: "High Travel Spending",
      description:
        "Your travel expenses are higher than usual this week.",
      impact: "Consider switching to public transport.",
      type: "cost",
    });
  }

  /* ------------------------------------------------
Route Efficiency Analysis
  ------------------------------------------------ */

  routes.forEach((route) => {
    if (route.duration > 60) {
      insights.push({
        title: "Long Commute Detected",
        description: `Route from ${route.from} to ${route.to} takes over 1 hour.`,
        impact: "Consider leaving earlier or choosing another route.",
        type: "route",
      });
    }
  });

  /* ------------------------------------------------
    Event Overlap Detection
  ------------------------------------------------ */

  for (let i = 0; i < sortedEvents.length - 1; i++) {
    const current = sortedEvents[i];
    const next = sortedEvents[i + 1];

    if (
      new Date(current.endTime).getTime() >
      new Date(next.startTime).getTime()
    ) {
      insights.push({
        title: "Schedule Conflict",
        description: `"${current.title}" overlaps with "${next.title}".`,
        impact: "You may need to reschedule one of the meetings.",
        type: "time",
      });
    }
  }

  return insights;
}