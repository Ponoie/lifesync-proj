import { useState } from 'react';
import type { Habit } from '../types/habit';

interface HabitItemProps {
  habit: Habit;
}

export function HabitItem({ habit }: HabitItemProps) {
  const [completed, setCompleted] = useState(habit.completedToday);
  const [streak, setStreak] = useState(habit.streak);

  const handleComplete = () => {
    if (!completed) {
      setCompleted(true);
      setStreak((prev) => prev + 1);
    } else {
      setCompleted(false);
      setStreak((prev) => Math.max(0, prev - 1));
    }
  };

  const getFrequencyColor = (frequency: Habit['frequency']) => {
    switch (frequency) {
      case 'daily':
        return 'bg-blue-100 text-blue-800';
      case 'weekly':
        return 'bg-purple-100 text-purple-800';
      case 'monthly':
        return 'bg-orange-100 text-orange-800';
    }
  };

  return (
    <div className={`p-3 border rounded-lg flex items-center gap-3 transition-colors ${
      completed ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'
    }`}>
      <button
        onClick={handleComplete}
        className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
          completed
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-gray-300 hover:border-green-500'
        }`}
      >
        {completed && <span className="text-sm">✓</span>}
      </button>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          {habit.icon && <span className="text-lg">{habit.icon}</span>}
          <span className={`font-medium ${completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
            {habit.name}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded ${getFrequencyColor(habit.frequency)}`}>
            {habit.frequency}
          </span>
        </div>

        {streak > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-orange-500">🔥</span>
            <span className="text-sm text-gray-600">{streak} day streak!</span>
          </div>
        )}

        {completed && (
          <p className="text-sm text-green-600 mt-1">
            Great job! Keep it up! 💪
          </p>
        )}
      </div>
    </div>
  );
}
