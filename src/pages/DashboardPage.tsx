import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { GoalCard } from "../components/GoalCard";
import { HabitItem } from "../components/HabitItem";
import { useGoalStore } from "../stores/goalStore";
import { useHabitStore } from "../stores/habitStore";
import { useThemeStore } from "../stores/themeStore";
import { useAuthStore } from "../stores/authStore";

export function DashboardPage() {
  const theme = useThemeStore((state) => state.theme);
  const goals = useGoalStore((state) => state.goals);
  const fetchGoals = useGoalStore((state) => state.fetchGoals);
  const loading = useGoalStore((state) => state.loading);
  const habits = useHabitStore((state) => state.habits);
  const fetchHabits = useHabitStore((state) => state.fetchHabits);
  const { user, logout, isAuthenticated } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      console.log("[DashboardPage] Component mounted/navigated, fetching goals and habits...");
      fetchGoals();
      fetchHabits().catch((error) => {
        console.error("[DashboardPage] Error fetching habits:", error);
      });
    }
  }, [fetchGoals, fetchHabits, isAuthenticated, location.pathname]);

  useEffect(() => {
    console.log("[DashboardPage] Goals state updated:", goals.length, "goals");
    console.log("[DashboardPage] All goals with status:");
    goals.forEach((g) => {
      console.log(`  - ${g.title}: completed=${g.completed}, coinsClaimed=${g.coinsClaimed}`);
    });
  }, [goals]);

  // Filter goals: show only active goals (not completed OR completed but coins not claimed)
  const activeGoals = goals.filter((g) => !g.completed || !g.coinsClaimed);

  // Completed goals that have claimed coins (for stats)
  const completedGoalsHistory = goals.filter((g) => g.completed && g.coinsClaimed);

  console.log("[DashboardPage] Active goals:", activeGoals.length);
  console.log("[DashboardPage] Completed history:", completedGoalsHistory.length);
  console.log("[DashboardPage] Filtered goals:", activeGoals.map(g => ({ title: g.title, completed: g.completed, coinsClaimed: g.coinsClaimed })));

  const stats = {
    totalGoals: activeGoals.length + completedGoalsHistory.length, // Active + Completed from history
    completedGoals: completedGoalsHistory.length, // Show from history
    inProgress: activeGoals.filter((g) => !g.completed && g.progress > 0).length,
    avgProgress: Math.round(
      activeGoals.reduce((sum, g) => sum + g.progress, 0) / (activeGoals.length || 1),
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
          {activeGoals.length === 0 ? (
            <div
              className={`text-center py-8 rounded-lg border-2 border-dashed ${
                theme === "dark"
                  ? "border-gray-700 text-gray-400"
                  : "border-gray-300 text-gray-500"
              }`}
            >
              <p className="text-lg mb-2">No active goals yet</p>
              <p className="text-sm">Create your first goal to get started!</p>
            </div>
          ) : (
            activeGoals.map((goal) => {
              const goalId = goal._id || goal.id;
              console.log("[DashboardPage] Rendering goal:", goalId);
              return (
                <Link key={goalId} to={`/goal/${goalId}`}>
                  <GoalCard goal={goal} />
                </Link>
              );
            })
          )}
        </div>
      </section>

      {/* Habits Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2
            className={`text-xl font-semibold ${
              theme === "dark" ? "text-white" : "text-gray-700"
            }`}
          >
            ✨ Today's Habits
          </h2>
          <Link
            to="/habit/new"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              theme === "dark"
                ? "bg-purple-600 text-white hover:bg-purple-700"
                : "bg-purple-600 text-white hover:bg-purple-700"
            }`}
          >
            + Add Habit
          </Link>
        </div>
        <div className="space-y-3">
          {habits.length > 0 ? (
            habits.map((habit) => (
              <HabitItem key={habit._id || habit.id} habit={habit} />
            ))
          ) : (
            <div
              className={`text-center py-8 rounded-lg border-2 border-dashed ${
                theme === "dark"
                  ? "border-gray-700 text-gray-400"
                  : "border-gray-300 text-gray-500"
              }`}
            >
              <p className="text-sm">No habits yet. Create your first habit to track!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
