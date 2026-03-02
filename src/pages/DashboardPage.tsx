import { Link } from "react-router-dom";
import { useEffect } from "react";
import { GoalCard } from "../components/GoalCard";
import { HabitItem } from "../components/HabitItem";
import { useGoalStore } from "../stores/goalStore";
import { useThemeStore } from "../stores/themeStore";
import { useAuthStore } from "../stores/authStore";
import type { Habit } from "../types/habit";

const sampleHabits: Habit[] = [
  {
    id: "1",
    name: "Morning Exercise",
    frequency: "daily",
    streak: 5,
    completedToday: false,
    icon: "🏃",
  },
  {
    id: "2",
    name: "Read 30 minutes",
    frequency: "daily",
    streak: 12,
    completedToday: true,
    icon: "📚",
  },
];

export function DashboardPage() {
  const theme = useThemeStore((state) => state.theme);
  const goals = useGoalStore((state) => state.goals);
  const fetchGoals = useGoalStore((state) => state.fetchGoals);
  const loading = useGoalStore((state) => state.loading);
  const { user, logout, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      console.log("[DashboardPage] Component mounted, fetching goals...");
      fetchGoals();
    }
  }, [fetchGoals, isAuthenticated]);

  useEffect(() => {
    console.log("[DashboardPage] Goals state updated:", goals.length, "goals");
    goals.forEach((g) => {
      console.log("[DashboardPage] Goal:", g._id || g.id, "-", g.title);
    });
  }, [goals]);

  const stats = {
    totalGoals: goals.length,
    completedGoals: goals.filter((g) => g.completed).length,
    inProgress: goals.filter((g) => !g.completed && g.progress > 0).length,
    avgProgress: Math.round(
      goals.reduce((sum, g) => sum + g.progress, 0) / goals.length,
    ),
  };

  return (
    <div>
      {/* Header with user info */}
      <div
        className={`flex justify-between items-center mb-6 p-4 rounded-lg ${
          theme === "dark" ? "bg-gray-800" : "bg-white"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">{user?.avatar || "😎"}</span>
          <div>
            <h2
              className={`font-semibold ${
                theme === "dark" ? "text-white" : "text-gray-800"
              }`}
            >
              {user?.username || "User"}
            </h2>
            <p
              className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {user?.role === "admin" ? "👑 Admin" : "👤 User"} •{" "}
              {user?.totalCoins || 0} coins
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Logout
        </button>
      </div>

      <h1
        className={`text-2xl font-bold mb-6 ${
          theme === "dark" ? "text-white" : "text-gray-800"
        }`}
      >
        Dashboard
      </h1>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p
            className={`mt-2 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
          >
            Loading goals...
          </p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div
          className={`p-4 rounded-lg border ${
            theme === "dark"
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <p
            className={`text-sm ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Total Goals
          </p>
          <p
            className={`text-2xl font-bold ${
              theme === "dark" ? "text-white" : "text-gray-800"
            }`}
          >
            {stats.totalGoals}
          </p>
        </div>
        <div
          className={`p-4 rounded-lg border ${
            theme === "dark"
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <p
            className={`text-sm ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Completed
          </p>
          <p className={`text-2xl font-bold text-green-600`}>
            {stats.completedGoals}
          </p>
        </div>
        <div
          className={`p-4 rounded-lg border ${
            theme === "dark"
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <p
            className={`text-sm ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}
          >
            In Progress
          </p>
          <p className={`text-2xl font-bold text-blue-600`}>
            {stats.inProgress}
          </p>
        </div>
        <div
          className={`p-4 rounded-lg border ${
            theme === "dark"
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <p
            className={`text-sm ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Avg Progress
          </p>
          <p className={`text-2xl font-bold text-purple-600`}>
            {stats.avgProgress}%
          </p>
        </div>
      </div>

      {/* Goals Section */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2
            className={`text-xl font-semibold ${
              theme === "dark" ? "text-white" : "text-gray-700"
            }`}
          >
            🎯 Your Goals
          </h2>
          <Link
            to="/goal/new"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              theme === "dark"
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            + Add Goal
          </Link>
        </div>
        <div className="space-y-4">
          {goals.map((goal) => {
            const goalId = goal._id || goal.id;
            console.log("[DashboardPage] Rendering goal:", goalId);
            return (
              <Link key={goalId} to={`/goal/${goalId}`}>
                <GoalCard goal={goal} />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Habits Section */}
      <section>
        <h2
          className={`text-xl font-semibold mb-4 ${
            theme === "dark" ? "text-white" : "text-gray-700"
          }`}
        >
          ✨ Today's Habits
        </h2>
        <div className="space-y-3">
          {sampleHabits.map((habit) => (
            <HabitItem key={habit.id} habit={habit} />
          ))}
        </div>
      </section>
    </div>
  );
}
