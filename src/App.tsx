import { useState } from 'react';
import { GoalCard } from './components/GoalCard';
import { HabitItem } from './components/HabitItem';
import { CoinBadge } from './components/CoinBadge';
import { CommentSection } from './components/CommentSection';
import type { Goal } from './types/goal';
import type { Habit } from './types/habit';
import type { Comment } from './types/comment';
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

  const sampleComments: Comment[] = [
    {
      id: '1',
      author: 'Alice',
      content: 'Great progress on your goals! Keep it up! 💪',
      timestamp: new Date(Date.now() - 3600000),
      replies: [
        {
          id: '2',
          author: 'Bob',
          content: 'I agree! The consistency is really paying off.',
          timestamp: new Date(Date.now() - 1800000),
          replies: [
            {
              id: '3',
              author: 'Alice',
              content: 'Thanks Bob! Been working hard on it.',
              timestamp: new Date(Date.now() - 900000),
              replies: [],
            },
          ],
        },
        {
          id: '4',
          author: 'Charlie',
          content: 'What\'s your secret to staying motivated?',
          timestamp: new Date(Date.now() - 600000),
          replies: [],
        },
      ],
    },
    {
      id: '5',
      author: 'David',
      content: 'The habit streak feature is amazing! 🔥',
      timestamp: new Date(Date.now() - 7200000),
      replies: [
        {
          id: '6',
          author: 'Eve',
          content: 'Yeah, the 12-day streak is impressive!',
          timestamp: new Date(Date.now() - 5400000),
          replies: [
            {
              id: '7',
              author: 'Frank',
              content: 'How do you keep track of everything?',
              timestamp: new Date(Date.now() - 3600000),
              replies: [
                {
                  id: '8',
                  author: 'Eve',
                  content: 'I use a combination of this app and calendar reminders.',
                  timestamp: new Date(Date.now() - 1800000),
                  replies: [],
                },
              ],
            },
          ],
        },
      ],
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

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">✨ Habits</h2>
          <div className="space-y-3">
            {sampleHabits.map((habit) => (
              <HabitItem key={habit.id} habit={habit} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">💬 Discussion</h2>
          <CommentSection comments={sampleComments} />
        </section>
      </div>
    </div>
  );
}

export default App;
