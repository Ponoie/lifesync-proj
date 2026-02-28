import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '../components/Layout/MainLayout';
import { DashboardPage } from '../pages/DashboardPage';
import { GoalDetailPage } from '../pages/GoalDetailPage';
import { LeaderboardPage } from '../pages/LeaderboardPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'goal/:id',
        element: <GoalDetailPage />,
      },
      {
        path: 'leaderboard',
        element: <LeaderboardPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
