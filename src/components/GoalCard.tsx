import { useState } from 'react';
import type { Goal } from '../types/goal';

interface GoalCardProps {
  goal: Goal;
}

export function GoalCard({ goal }: GoalCardProps) {
  const [isCompleted, setIsCompleted] = useState(goal.completed);
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleComplete = () => {
    setIsCompleted((prev) => !prev);
  };

  return (
    <div className={`p-4 border rounded-lg ${isCompleted ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className={`font-semibold ${isCompleted ? 'line-through text-gray-500' : 'text-gray-800'}`}>
            {goal.title}
          </h3>
          {isExpanded && (
            <p className="text-sm text-gray-600 mt-2">{goal.description}</p>
          )}
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${goal.progress}%` }}
              />
            </div>
            <span className="text-xs text-gray-500">{goal.progress}% complete</span>
          </div>
        </div>
        <div className="flex gap-2 ml-4">
          <button
            onClick={toggleComplete}
            className={`px-3 py-1 rounded text-sm ${
              isCompleted
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {isCompleted ? '✓ Done' : 'Mark Done'}
          </button>
          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="px-3 py-1 rounded text-sm bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            {isExpanded ? '▲' : '▼'}
          </button>
        </div>
      </div>
    </div>
  );
}
