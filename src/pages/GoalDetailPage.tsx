import { useParams, Link, useNavigate } from "react-router-dom";
import { useGoalStore } from "../stores/goalStore";
import { useThemeStore } from "../stores/themeStore";
import { useState, useEffect } from "react";

export function GoalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useThemeStore((state) => state.theme);
  const getGoalById = useGoalStore((state) => state.getGoalById);
  const updateGoal = useGoalStore((state) => state.updateGoal);
  const deleteGoal = useGoalStore((state) => state.deleteGoal);
  const completeGoal = useGoalStore((state) => state.completeGoal);
  const fetchGoals = useGoalStore((state) => state.fetchGoals);

  const [goal, setGoal] = useState<ReturnType<typeof getGoalById>>(undefined);
  const [coinsEarned, setCoinsEarned] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [newSubtask, setNewSubtask] = useState({
    title: "",
    description: "",
    dueDate: "",
  });

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  useEffect(() => {
    if (id) {
      setGoal(getGoalById(id));
    }
  }, [id, getGoalById]);

  if (!goal) {
    return (
      <div className="text-center py-12">
        <h1
          className={`text-2xl font-bold mb-4 ${
            theme === "dark" ? "text-white" : "text-gray-800"
          }`}
        >
          Goal Not Found
        </h1>
        <p className="text-gray-600 mb-6">
          The goal you're looking for doesn't exist.
        </p>
        <Link
          to="/dashboard"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this goal?")) {
      const goalId = goal?._id || goal?.id;
      if (goalId) {
        deleteGoal(goalId);
        navigate("/dashboard");
      }
    }
  };

  const handleToggleComplete = async () => {
    const goalId = goal?._id || goal?.id;
    if (!goalId) return;

    if (!goal?.completed) {
      try {
        const result = await completeGoal(goalId);
        setCoinsEarned(result.coinsEarned);
        setGoal((prev) => (prev ? { ...prev, ...result.goal } : prev));
      } catch (error) {
        console.error("Failed to complete goal:", error);
      }
    } else {
      updateGoal(goalId, {
        completed: false,
        progress: goal.progress || 0,
      });
    }
  };

  const handleProgressUpdate = async (newProgress: number) => {
    const goalId = goal?._id || goal?.id;
    if (goalId) {
      await updateGoal(goalId, {
        progress: Math.max(0, Math.min(100, newProgress)),
        completed: newProgress === 100,
      });
    }
  };

  const handleToggleSubtask = async (subtaskIndex: number) => {
    const goalId = goal?._id || goal?.id;
    if (!goal || !goalId) return;

    setIsUpdating(true);

    const updatedSubtasks = [...(goal.subtasks || [])];
    updatedSubtasks[subtaskIndex] = {
      ...updatedSubtasks[subtaskIndex],
      completed: !updatedSubtasks[subtaskIndex].completed,
      completedAt: !updatedSubtasks[subtaskIndex].completed
        ? new Date().toISOString()
        : undefined,
    };

    // Calculate overall progress based on subtasks
    const completedSubtasks = updatedSubtasks.filter(
      (st) => st.completed,
    ).length;
    const newProgress =
      updatedSubtasks.length > 0
        ? Math.round((completedSubtasks / updatedSubtasks.length) * 100)
        : goal.progress;

    try {
      await updateGoal(goalId, {
        subtasks: updatedSubtasks,
        progress: newProgress,
        completed: newProgress === 100,
      });

      // Fetch fresh data to ensure UI updates
      await fetchGoals();
      const updatedGoal = getGoalById(goalId);
      if (updatedGoal) {
        setGoal(updatedGoal);
      }
    } catch (error) {
      console.error("Failed to update subtask:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    const goalId = goal?._id || goal?.id;
    if (!goal || !goalId || !newSubtask.title.trim() || !newSubtask.dueDate) return;

    setIsUpdating(true);

    const newSubtaskData = {
      title: newSubtask.title.trim(),
      description: newSubtask.description.trim() || undefined,
      dueDate: new Date(newSubtask.dueDate).toISOString(),
      completed: false,
    };

    const updatedSubtasks = [...(goal.subtasks || []), newSubtaskData];

    // Recalculate progress
    const completedSubtasks = updatedSubtasks.filter((st) => st.completed).length;
    const newProgress =
      updatedSubtasks.length > 0
        ? Math.round((completedSubtasks / updatedSubtasks.length) * 100)
        : goal.progress;

    try {
      await updateGoal(goalId, {
        subtasks: updatedSubtasks,
        progress: newProgress,
        completed: newProgress === 100,
      });

      // Reset form
      setNewSubtask({ title: "", description: "", dueDate: "" });
      setShowAddSubtask(false);

      // Fetch fresh data to ensure UI updates
      await fetchGoals();
      const updatedGoal = getGoalById(goalId);
      if (updatedGoal) {
        setGoal(updatedGoal);
      }
    } catch (error) {
      console.error("Failed to add subtask:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className={`text-gray-600 hover:text-gray-800 ${
              theme === "dark" ? "text-gray-400 hover:text-white" : ""
            }`}
          >
            ← Back
          </Link>
          <h1
            className={`text-2xl font-bold ${
              theme === "dark" ? "text-white" : "text-gray-800"
            }`}
          >
            {goal.title}
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleToggleComplete}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              goal.completed
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {goal.completed ? "✓ Completed" : "Mark Complete"}
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      <div
        className={`p-6 rounded-lg border mb-6 ${
          theme === "dark"
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        }`}
      >
        <h2
          className={`text-lg font-semibold mb-2 ${
            theme === "dark" ? "text-white" : "text-gray-800"
          }`}
        >
          Description
        </h2>
        <p className={theme === "dark" ? "text-gray-300" : "text-gray-600"}>
          {goal.description}
        </p>
      </div>

      <div
        className={`p-6 rounded-lg border mb-6 ${
          theme === "dark"
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        }`}
      >
        <h2
          className={`text-lg font-semibold mb-4 ${
            theme === "dark" ? "text-white" : "text-gray-800"
          }`}
        >
          Progress: {goal.progress}%
        </h2>
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-4 rounded-full transition-all"
              style={{ width: `${goal.progress}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="100"
            value={goal.progress}
            onChange={(e) => handleProgressUpdate(parseInt(e.target.value))}
            className="flex-1"
          />
          <input
            type="number"
            min="0"
            max="100"
            value={goal.progress}
            onChange={(e) => handleProgressUpdate(parseInt(e.target.value))}
            className={`w-20 px-3 py-2 border rounded-lg text-center ${
              theme === "dark"
                ? "bg-gray-700 border-gray-600 text-white"
                : "bg-white border-gray-300"
            }`}
          />
          <span className="text-gray-600">%</span>
        </div>
      </div>

      {/* Subtasks Section */}
      <div
        className={`p-6 rounded-lg border mb-6 ${
          theme === "dark"
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200 shadow-sm"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            className={`text-lg font-semibold flex items-center gap-2 ${
              theme === "dark" ? "text-white" : "text-gray-800"
            }`}
          >
            📋 Subtasks
            {goal.subtasks && goal.subtasks.length > 0 && (
              <span className={`text-sm font-normal px-3 py-1 rounded-full ${
                theme === "dark"
                  ? "bg-gray-700 text-gray-300"
                  : "bg-blue-100 text-blue-700"
              }`}>
                {goal.subtasks.filter((st) => st.completed).length}/{goal.subtasks.length}
              </span>
            )}
          </h2>
          <button
            onClick={() => setShowAddSubtask(!showAddSubtask)}
            disabled={isUpdating}
            className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-colors ${
              theme === "dark"
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-blue-600 text-white hover:bg-blue-700"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {showAddSubtask ? "✕ Cancel" : "+ Add Subtask"}
          </button>
        </div>

        {/* Add Subtask Form */}
        {showAddSubtask && (
          <form onSubmit={handleAddSubtask} className="mb-4 p-4 rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 dark:bg-gray-700 dark:border-gray-600">
            <div className="space-y-3">
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}>
                  Title *
                </label>
                <input
                  type="text"
                  value={newSubtask.title}
                  onChange={(e) => setNewSubtask({ ...newSubtask, title: e.target.value })}
                  placeholder="Enter subtask title"
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300"
                  }`}
                  disabled={isUpdating}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}>
                  Description
                </label>
                <textarea
                  value={newSubtask.description}
                  onChange={(e) => setNewSubtask({ ...newSubtask, description: e.target.value })}
                  placeholder="Enter description (optional)"
                  rows={2}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300"
                  }`}
                  disabled={isUpdating}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}>
                  Due Date *
                </label>
                <input
                  type="date"
                  value={newSubtask.dueDate}
                  onChange={(e) => setNewSubtask({ ...newSubtask, dueDate: e.target.value })}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300"
                  }`}
                  disabled={isUpdating}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isUpdating || !newSubtask.title.trim() || !newSubtask.dueDate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? "Adding..." : "Add Subtask"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSubtask(false);
                    setNewSubtask({ title: "", description: "", dueDate: "" });
                  }}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Subtasks List */}
        {goal.subtasks && goal.subtasks.length > 0 ? (
          <div className="space-y-3">
            {goal.subtasks.map((subtask, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                  subtask.completed
                    ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
                    : theme === "dark"
                      ? "bg-gray-700 border-gray-600"
                      : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => handleToggleSubtask(index)}
                    disabled={isUpdating}
                    className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      subtask.completed
                        ? "bg-green-600 border-green-600 text-white scale-110"
                        : theme === "dark"
                          ? "border-gray-500 hover:border-green-500 hover:bg-green-500/20"
                          : "border-gray-300 hover:border-green-500 hover:bg-green-500/20"
                    }`}
                  >
                    {subtask.completed && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-semibold text-base ${
                        subtask.completed
                          ? "line-through text-green-600"
                          : theme === "dark"
                            ? "text-white"
                            : "text-gray-800"
                      }`}
                    >
                      {subtask.title}
                    </h3>
                    {subtask.description && (
                      <p
                        className={`text-sm mt-1 ${
                          theme === "dark" ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {subtask.description}
                      </p>
                    )}
                    <div
                      className={`text-xs mt-2 flex items-center gap-3 ${
                        theme === "dark" ? "text-gray-500" : "text-gray-500"
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        📅 Due: {new Date(subtask.dueDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      {subtask.completed && subtask.completedAt && (
                        <span className="flex items-center gap-1 text-green-600">
                          ✓ {new Date(subtask.completedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                  {subtask.completed && (
                    <span className="text-2xl">🎉</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`text-center py-8 ${
            theme === "dark" ? "text-gray-400" : "text-gray-500"
          }`}>
            <p className="text-lg mb-2">No subtasks yet</p>
            <p className="text-sm">Click "+ Add Subtask" to create your first subtask</p>
          </div>
        )}
      </div>

      <div
        className={`p-6 rounded-lg border ${
          theme === "dark"
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200 shadow-sm"
        }`}
      >
        <h2
          className={`text-lg font-semibold mb-4 ${
            theme === "dark" ? "text-white" : "text-gray-800"
          }`}
        >
          📊 Goal Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p
              className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Status
            </p>
            <p
              className={`font-medium flex items-center gap-2 ${
                goal.completed
                  ? "text-green-600"
                  : theme === "dark"
                    ? "text-white"
                    : "text-gray-800"
              }`}
            >
              {goal.completed ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-green-600"></span>
                  Completed
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                  In Progress
                </>
              )}
            </p>
          </div>
          <div>
            <p
              className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Progress
            </p>
            <p
              className={`font-medium ${
                theme === "dark" ? "text-white" : "text-gray-800"
              }`}
            >
              {goal.progress}%
            </p>
          </div>
          <div>
            <p
              className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Subtasks
            </p>
            <p
              className={`font-medium ${
                theme === "dark" ? "text-white" : "text-gray-800"
              }`}
            >
              {goal.subtasks?.length || 0} tasks
            </p>
          </div>
        </div>
        {goal.targetDate && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p
              className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Target Date
            </p>
            <p
              className={`font-medium ${
                theme === "dark" ? "text-white" : "text-gray-800"
              }`}
            >
              {new Date(goal.targetDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        )}
      </div>

      {/* Coins Earned Notification */}
      {coinsEarned !== null && (
        <div className="p-4 bg-gradient-to-r from-green-100 to-emerald-100 border border-green-400 text-green-700 rounded-lg mb-6 flex items-center gap-3 animate-pulse">
          <span className="text-3xl">🎉</span>
          <div>
            <p className="font-bold text-lg">Congratulations!</p>
            <p className="text-sm">You earned {coinsEarned} coins for completing this goal!</p>
          </div>
        </div>
      )}
    </div>
  );
}
