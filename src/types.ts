export interface Event {
  id: string;
  title: string;
  location: string;
  startTime: string;
  endTime: string;
}

export interface Route {
  id: string;
  from: string;
  to: string;
  distance: number;
  duration: number;
  trafficLevel?: "low" | "medium" | "high";
  cost?: number;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
}