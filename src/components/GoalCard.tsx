import type { Goal } from "../types/goal";

interface GoalCardProps {
  goal: Goal;
  showStrikethrough?: boolean; // Control whether to show line-through for completed goals
}

export function GoalCard({ goal, showStrikethrough = true }: GoalCardProps) {
  const subtaskCount = goal.subtasks?.length || 0;
  const completedSubtasks =
    goal.subtasks?.filter((st) => st.completed).length || 0;

  return (
    <div
      className={`p-4 border rounded-lg transition-all ${
        goal.completed
          ? "bg-green-50 border-green-300"
          : "bg-white border-gray-200 hover:shadow-md"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3
              className={`font-semibold ${
                goal.completed && showStrikethrough
                  ? "line-through text-gray-500"
                  : "text-gray-800"
              }`}
            >
              {goal.title}
            </h3>
            {goal.completed && (
              <span className="text-green-600 text-sm">✓</span>
            )}
          </div>

          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {goal.description}
          </p>

          {/* Subtasks Info */}
          {subtaskCount > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-gray-500">
                📋 {completedSubtasks}/{subtaskCount} subtasks
              </span>
              <div className="flex-1 bg-gray-200 rounded-full h-1.5 max-w-[100px]">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all"
                  style={{
                    width: `${(completedSubtasks / subtaskCount) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{goal.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${goal.progress}%` }}
              />
            </div>
          </div>

          {/* Target Date */}
          {goal.targetDate && (
            <div className="mt-2 text-xs text-gray-500">
              📅 Target: {new Date(goal.targetDate).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
