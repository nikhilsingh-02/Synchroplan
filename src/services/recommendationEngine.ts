import { Event, Route, Expense } from "../types";

export interface Insight {
  title: string;
  description: string;
  impact: string;
  type: "time" | "cost" | "route";
}

export function generateInsights(
  events: Event[],
  routes: Route[],
  expenses: Expense[]
): Insight[] {
  const insights: Insight[] = [];

  // Detect schedule gaps
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  sortedEvents.forEach((event, i) => {
    const next = sortedEvents[i + 1];
    if (!next) return;

    const gap =
      new Date(next.startTime).getTime() -
      new Date(event.endTime).getTime();

    if (gap > 60 * 60 * 1000) {
      insights.push({
        title: "Free Time Detected",
        description: "You have over 1 hour between meetings",
        impact: "Opportunity for lunch or break",
        type: "time"
      });
    }
  });

  // Detect traffic problems
  routes.forEach((route) => {
    if (route.trafficLevel === "high") {
      insights.push({
        title: "Traffic Alert",
        description: `Heavy traffic detected on route ${route.from} → ${route.to}`,
        impact: "Leave 15 minutes earlier",
        type: "route"
      });
    }
  });

  // Expense analysis
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  if (totalExpenses > 1000) {
    insights.push({
      title: "High Travel Expenses",
      description: "Your travel costs are above average",
      impact: "Switching to transit may save money",
      type: "cost"
    });
  }

  return insights;
}