import { useState } from 'react';
import { GoalCard } from './components/GoalCard';
import { HabitItem } from './components/HabitItem';
import { CoinBadge } from './components/CoinBadge';
import type { Goal } from './types/goal';
import type { Habit } from './types/habit';
import './index.css';

function App() {
  const [totalCoins, setTotalCoins] = useState(250);
  const sampleGoals: Goal[] = [
    {
      id: '1',
      title: 'Learn React',
      description: 'Master React fundamentals including hooks, state management, and component lifecycle',
      completed: false,
      progress: 60,
    },
    {
      id: '2',
      title: 'Build Portfolio',
      description: 'Create a personal portfolio website to showcase projects',
      completed: true,
      progress: 100,
    },
  ];

  const sampleHabits: Habit[] = [
    {
      id: '1',
      name: 'Morning Exercise',
      frequency: 'daily',
      streak: 5,
      completedToday: false,
      icon: '🏃',
    },
    {
      id: '2',
      name: 'Read 30 minutes',
      frequency: 'daily',
      streak: 12,
      completedToday: true,
      icon: '📚',
    },
    {
      id: '3',
      name: 'Weekly Review',
      frequency: 'weekly',
      streak: 3,
      completedToday: false,
      icon: '📝',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">LifeSync - Goal & Habit Tracker</h1>
          <CoinBadge totalCoins={totalCoins} />
        </div>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">🎯 Goals</h2>
          <div className="space-y-4">
            {sampleGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">✨ Habits</h2>
          <div className="space-y-3">
            {sampleHabits.map((habit) => (
              <HabitItem key={habit.id} habit={habit} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
