import { useParams, Link, useNavigate } from "react-router-dom";
import { useGoalStore } from "../stores/goalStore";
import { useThemeStore } from "../stores/themeStore";
import { useState, useEffect } from "react";
import { CoinRewardDialog } from "../components/CoinRewardDialog";

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
  const [editingSubtaskIndex, setEditingSubtaskIndex] = useState<number | null>(null);
  const [newSubtask, setNewSubtask] = useState({
    title: "",
    description: "",
    dueDate: "",
  });
  const [dateError, setDateError] = useState<string>("");
  const [showCoinReward, setShowCoinReward] = useState(false);
  const [claimedCoinsForGoal, setClaimedCoinsForGoal] = useState<Set<string>>(new Set());

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

    // Store the previous state BEFORE updating
    const wasPreviouslyCompleted = (goal.subtasks || [])[subtaskIndex]?.completed || false;

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

    // Check if all subtasks are now completed (and this was the last uncompleted one)
    const allCompleted = updatedSubtasks.length > 0 &&
      completedSubtasks === updatedSubtasks.length &&
      !wasPreviouslyCompleted; // Was false, now true - this was the last one!

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

      // Show coin reward dialog if all subtasks are completed and not yet claimed
      if (allCompleted && goalId && !claimedCoinsForGoal.has(goalId)) {
        console.log("[CoinReward] All subtasks completed! Showing dialog...");
        // Delay slightly to let the UI update first
        setTimeout(() => {
          setShowCoinReward(true);
        }, 500);
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

    // Validate due date
    const validationError = validateSubtaskDueDate(newSubtask.dueDate);
    if (validationError) {
      setDateError(validationError);
      return;
    }

    setIsUpdating(true);

    const subtaskData = {
      title: newSubtask.title.trim(),
      description: newSubtask.description.trim() || undefined,
      dueDate: new Date(newSubtask.dueDate).toISOString(),
      completed: false,
    };

    let updatedSubtasks: typeof goal.subtasks;

    if (editingSubtaskIndex !== null) {
      // Update existing subtask
      updatedSubtasks = (goal.subtasks || []).map((st, i) =>
        i === editingSubtaskIndex ? { ...st, ...subtaskData } : st
      );
    } else {
      // Add new subtask
      updatedSubtasks = [...(goal.subtasks || []), subtaskData];
    }

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
      setEditingSubtaskIndex(null);
      setDateError("");

      // Fetch fresh data to ensure UI updates
      await fetchGoals();
      const updatedGoal = getGoalById(goalId);
      if (updatedGoal) {
        setGoal(updatedGoal);
      }
    } catch (error) {
      console.error("Failed to save subtask:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditSubtask = (index: number) => {
    const subtask = (goal?.subtasks || [])[index];
    if (!subtask) return;

    setNewSubtask({
      title: subtask.title,
      description: subtask.description || "",
      dueDate: new Date(subtask.dueDate).toISOString().split('T')[0],
    });
    setEditingSubtaskIndex(index);
    setShowAddSubtask(true);
    setDateError("");
  };

  const handleDeleteSubtask = async (index: number) => {
    if (!confirm("Are you sure you want to delete this subtask?")) return;

    const goalId = goal?._id || goal?.id;
    if (!goal || !goalId) return;

    setIsUpdating(true);

    const updatedSubtasks = (goal.subtasks || []).filter((_, i) => i !== index);

    // Recalculate progress
    const completedSubtasks = updatedSubtasks.filter((st) => st.completed).length;
    const newProgress =
      updatedSubtasks.length > 0
        ? Math.round((completedSubtasks / updatedSubtasks.length) * 100)
        : 0;

    try {
      await updateGoal(goalId, {
        subtasks: updatedSubtasks,
        progress: newProgress,
        completed: newProgress === 100,
      });

      // Fetch fresh data
      await fetchGoals();
      const updatedGoal = getGoalById(goalId);
      if (updatedGoal) {
        setGoal(updatedGoal);
      }
    } catch (error) {
      console.error("Failed to delete subtask:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Validate subtask due date based on constraints
  const validateSubtaskDueDate = (dueDateStr: string): string => {
    if (!goal) return "";

    const newDueDate = new Date(dueDateStr);
    newDueDate.setHours(0, 0, 0, 0); // Reset time to midnight for comparison

    // Check if goal has a target date
    if (!goal.targetDate) {
      return "Goal must have a target date before adding subtasks";
    }

    const goalTargetDate = new Date(goal.targetDate);
    goalTargetDate.setHours(0, 0, 0, 0);

    // Check if due date is after goal's target date
    if (newDueDate > goalTargetDate) {
      return `Subtask due date cannot be after goal's target date (${formatDate(goalTargetDate)})`;
    }

    // Check if due date is before today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (newDueDate < today) {
      return "Subtask due date cannot be in the past";
    }

    // Get existing subtasks and sort by due date
    const existingSubtasks = goal.subtasks || [];
    const sortedSubtasks = [...existingSubtasks].sort((a, b) =>
      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );

    // If there are existing subtasks, validate against the last one
    if (sortedSubtasks.length > 0) {
      const lastSubtask = sortedSubtasks[sortedSubtasks.length - 1];
      const lastSubtaskDueDate = new Date(lastSubtask.dueDate);
      lastSubtaskDueDate.setHours(0, 0, 0, 0);

      // New subtask must be after the last subtask
      if (newDueDate <= lastSubtaskDueDate) {
        return `Subtask due date must be after the last subtask (${formatDate(lastSubtaskDueDate)})`;
      }

      // Special rule: if this will be the last subtask (because we're adding it),
      // and there are already many subtasks, suggest using goal's target date
      // But don't enforce it strictly - just provide guidance
      if (newDueDate < goalTargetDate) {
        // Optional: You could add a warning here that the user should consider
        // using the goal's target date for the final subtask
      }
    }

    return "";
  };

  // Helper to format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get min and max dates for the date picker
  const getDateConstraints = () => {
    if (!goal || !goal.targetDate) return { minDate: "", maxDate: "" };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const goalTargetDate = new Date(goal.targetDate);
    goalTargetDate.setHours(0, 0, 0, 0);

    // Get existing subtasks (excluding the one being edited)
    const existingSubtasks = editingSubtaskIndex !== null
      ? (goal.subtasks || []).filter((_, i) => i !== editingSubtaskIndex)
      : (goal.subtasks || []);

    const sortedSubtasks = [...existingSubtasks].sort((a, b) =>
      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );

    let minDate = today.toISOString().split('T')[0];
    let maxDate = goalTargetDate.toISOString().split('T')[0];

    // If there are existing subtasks, min date should be after the last one
    if (sortedSubtasks.length > 0) {
      const lastSubtask = sortedSubtasks[sortedSubtasks.length - 1];
      const lastSubtaskDueDate = new Date(lastSubtask.dueDate);
      lastSubtaskDueDate.setDate(lastSubtaskDueDate.getDate() + 1); // Add 1 day
      minDate = lastSubtaskDueDate.toISOString().split('T')[0];
    }

    return { minDate, maxDate };
  };

  const { minDate, maxDate } = getDateConstraints();

  const handleClaimCoins = async (_newTotalCoins: number) => {
    const goalId = goal?._id || goal?.id;
    if (goalId) {
      setClaimedCoinsForGoal(prev => new Set([...prev, goalId]));
    }
    // Refresh user data from server to get updated coins
    // The CoinRewardDialog already updates the auth store, but we need to sync
    try {
      await fetchGoals();
      // Navigate to dashboard after fetching is complete
      navigate("/dashboard");
    } catch (error) {
      console.error("Failed to refresh data:", error);
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
            onClick={() => {
              setEditingSubtaskIndex(null);
              setNewSubtask({ title: "", description: "", dueDate: "" });
              setDateError("");
              setShowAddSubtask(!showAddSubtask);
            }}
            disabled={isUpdating || !goal.targetDate}
            className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-colors ${
              theme === "dark"
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-blue-600 text-white hover:bg-blue-700"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={!goal.targetDate ? "Goal must have a target date to add subtasks" : ""}
          >
            {showAddSubtask ? "✕" : "+ Add"}
          </button>
        </div>

        {/* Add/Edit Subtask Form */}
        {showAddSubtask && (
          <form onSubmit={handleAddSubtask} className="mb-6 p-4 bg-white border border-gray-200 rounded-lg">
            <h3 className={`text-sm font-semibold mb-3 ${
              theme === "dark" ? "text-white" : "text-gray-800"
            }`}>
              {editingSubtaskIndex !== null ? "Edit Subtask" : "New Subtask"}
            </h3>
            <div className="space-y-3">
              <div>
                <input
                  type="text"
                  value={newSubtask.title}
                  onChange={(e) => setNewSubtask({ ...newSubtask, title: e.target.value })}
                  placeholder="Title"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={isUpdating}
                />
              </div>
              <div>
                <input
                  type="text"
                  value={newSubtask.description}
                  onChange={(e) => setNewSubtask({ ...newSubtask, description: e.target.value })}
                  placeholder="Description (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={isUpdating}
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="date"
                    value={newSubtask.dueDate}
                    onChange={(e) => {
                      setNewSubtask({ ...newSubtask, dueDate: e.target.value });
                      setDateError("");
                    }}
                    required
                    min={minDate}
                    max={maxDate}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      dateError ? "border-red-500" : "border-gray-300"
                    }`}
                    disabled={isUpdating}
                  />
                  {dateError && (
                    <p className="text-red-500 text-xs mt-1">{dateError}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isUpdating || !newSubtask.title.trim() || !newSubtask.dueDate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? "..." : editingSubtaskIndex !== null ? "Save" : "Add"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddSubtask(false);
                      setEditingSubtaskIndex(null);
                      setNewSubtask({ title: "", description: "", dueDate: "" });
                      setDateError("");
                    }}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* Subtasks List */}
        {goal.subtasks && goal.subtasks.length > 0 ? (
          <div className="space-y-2">
            {goal.subtasks.map((subtask, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border flex items-center gap-3 ${
                  subtask.completed
                    ? "bg-green-50 border-green-200"
                    : "bg-white border-gray-200"
                }`}
              >
                <button
                  onClick={() => handleToggleSubtask(index)}
                  disabled={isUpdating}
                  className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    subtask.completed
                      ? "bg-green-600 border-green-600 text-white"
                      : "border-gray-300 hover:border-green-500"
                  }`}
                >
                  {subtask.completed && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <h3
                    className={`font-medium text-sm ${
                      subtask.completed
                        ? "line-through text-green-600"
                        : "text-gray-800"
                    }`}
                  >
                    {subtask.title}
                  </h3>
                  {subtask.description && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                      {subtask.description}
                    </p>
                  )}
                  <div className="text-xs text-gray-400 mt-1 flex gap-2">
                    <span>📅 {new Date(subtask.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    {subtask.completed && subtask.completedAt && (
                      <span className="text-green-600">✓ {new Date(subtask.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEditSubtask(index)}
                    disabled={isUpdating}
                    className="text-blue-600 hover:text-blue-700 text-xs font-medium disabled:opacity-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteSubtask(index)}
                    disabled={isUpdating}
                    className="text-red-500 hover:text-red-600 text-xs disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">No subtasks yet. Click "+ Add" to create one.</p>
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

      {/* Coin Reward Dialog */}
      {goal && (goal._id || goal.id) && goal.targetDate && (
        <CoinRewardDialog
          isOpen={showCoinReward}
          onClose={() => setShowCoinReward(false)}
          goalId={goal._id || goal.id || ""}
          subtasks={goal.subtasks || []}
          goalTargetDate={goal.targetDate}
          onClaimSuccess={handleClaimCoins}
        />
      )}
    </div>
  );
}
