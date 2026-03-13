import { createBrowserRouter } from "react-router";
import { RootLayout } from "./layouts/RootLayout";
import { Dashboard } from "./pages/Dashboard";
import { Schedule } from "./pages/Schedule";
import { TravelPlanner } from "./pages/TravelPlanner";
import { Recommendations } from "./pages/Recommendations";
import { ExpenseTracker } from "./pages/ExpenseTracker";
import { Settings } from "./pages/Settings";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/signup",
    Component: Signup,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <RootLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, Component: Dashboard },
      { path: "schedule", Component: Schedule },
      { path: "travel", Component: TravelPlanner },
      { path: "recommendations", Component: Recommendations },
      { path: "expenses", Component: ExpenseTracker },
      { path: "settings", Component: Settings },
    ],
  },
]);
