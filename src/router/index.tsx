import { createBrowserRouter, Navigate } from "react-router-dom";
import { MainLayout } from "../components/Layout/MainLayout";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { LoginPage } from "../pages/LoginPage";
import { DashboardPage } from "../pages/DashboardPage";
import { GoalDetailPage } from "../pages/GoalDetailPage";
import { GoalCreationPage } from "../pages/GoalCreationPage";
import { LeaderboardPage } from "../pages/LeaderboardPage";
import { AdminPage } from "../pages/AdminPage";
import { NotFoundPage } from "../pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <DashboardPage />,
      },
      {
        path: "goal/:id",
        element: <GoalDetailPage />,
      },
      {
        path: "goal/new",
        element: <GoalCreationPage />,
      },
      {
        path: "leaderboard",
        element: <LeaderboardPage />,
      },
      {
        path: "admin",
        element: (
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);
