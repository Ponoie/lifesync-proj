import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { GoalCard } from "../components/GoalCard";
import { HabitItem } from "../components/HabitItem";
import { useGoalStore } from "../stores/goalStore";
import { useHabitStore } from "../stores/habitStore";
import { useThemeStore } from "../stores/themeStore";
import { useAuthStore } from "../stores/authStore";

export function GoalHistoryPage() {
  const theme = useThemeStore((state) => state.theme);
  const goals = useGoalStore((state) => state.goals);
  const fetchGoals = useGoalStore((state) => state.fetchGoals);
  const loading = useGoalStore((state) => state.loading);
  const fetchAllHabits = useHabitStore((state) => state.fetchAllHabits);
  const { user, isAuthenticated } = useAuthStore();
  const [allHabits, setAllHabits] = useState<any[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchGoals();
      fetchAllHabits().then((habits) => {
        setAllHabits(habits);
      }).catch((error) => {
        console.error("[GoalHistoryPage] Error fetching habits:", error);
      });
    }
  }, [fetchGoals, fetchAllHabits, isAuthenticated]);

  // Filter completed goals that have claimed coins
  const completedGoals = goals.filter((g) => g.completed && g.coinsClaimed);

  // Sort by completion date (most recent first)
  const sortedGoals = [...completedGoals].sort((a, b) => {
    if (!a.completedAt || !b.completedAt) return 0;
    return (
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );
  });

  // Calculate stats
  const totalCoinsEarned = sortedGoals.reduce((sum, goal) => {
    // Estimate coins based on subtasks
    const subtasksCount = goal.subtasks?.length || 0;
    const baseCoins = subtasksCount * 10; // Base 10 coins per subtask
    return sum + baseCoins;
  }, 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1
          className={`text-2xl font-bold ${
            theme === "dark" ? "text-white" : "text-gray-800"
          }`}
        >
          🏆 Goal History
        </h1>
        <p
          className={`text-sm mt-1 ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}
        >
          Your completed goals and achievements
        </p>
      </div>

      {/* Stats Card */}
      <div
        className={`p-6 rounded-lg border mb-8 ${
          theme === "dark"
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200 shadow-sm"
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p
              className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Completed Goals
            </p>
            <p className={`text-3xl font-bold text-green-600`}>
              {sortedGoals.length}
            </p>
          </div>
          <div className="text-center">
            <p
              className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Total Coins Earned
            </p>
            <p className={`text-3xl font-bold text-yellow-600`}>
              🪙 {totalCoinsEarned}
            </p>
          </div>
          <div className="text-center">
            <p
              className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Current Balance
            </p>
            <p className={`text-3xl font-bold text-blue-600`}>
              🪙 {user?.totalCoins || 0}
            </p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p
            className={`mt-2 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
          >
            Loading history...
          </p>
        </div>
      )}

      {/* Completed Goals List */}
      <div>
        <h2
          className={`text-xl font-semibold mb-4 ${
            theme === "dark" ? "text-white" : "text-gray-700"
          }`}
        >
          ✅ Completed Goals
        </h2>
        {sortedGoals.length === 0 ? (
          <div
            className={`text-center py-12 rounded-lg border-2 border-dashed ${
              theme === "dark"
                ? "border-gray-700 text-gray-400"
                : "border-gray-300 text-gray-500"
            }`}
          >
            <p className="text-lg mb-2">No completed goals yet</p>
            <p className="text-sm mb-4">
              Complete your first goal to see it here!
            </p>
            <Link
              to="/dashboard"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedGoals.map((goal) => {
              const goalId = goal._id || goal.id;
              return (
                <Link key={goalId} to={`/goal/${goalId}`}>
                  <GoalCard goal={goal} showStrikethrough={false} />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Habits Section */}
      <div className="mt-8">
        <h2
          className={`text-xl font-semibold mb-4 ${
            theme === "dark" ? "text-white" : "text-gray-700"
          }`}
        >
          ✨ Completed Habits
        </h2>
        {allHabits.filter((h) => h.completedAt).length === 0 ? (
          <div
            className={`text-center py-8 rounded-lg border-2 border-dashed ${
              theme === "dark"
                ? "border-gray-700 text-gray-400"
                : "border-gray-300 text-gray-500"
            }`}
          >
            <p className="text-sm">No completed habits yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allHabits
              .filter((h) => h.completedAt)
              .sort((a, b) => {
                if (!a.completedAt || !b.completedAt) return 0;
                return (
                  new Date(b.completedAt).getTime() -
                  new Date(a.completedAt).getTime()
                );
              })
              .map((habit) => (
                <HabitItem key={habit._id || habit.id} habit={habit} showStrikethrough={false} />
              ))}
          </div>
        )}
      </div>

      {/* Back to Dashboard */}
      <div className="mt-8">
        <Link
          to="/dashboard"
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            theme === "dark"
              ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
