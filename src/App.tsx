import { GoalCard } from './components/GoalCard';
import type { Goal } from './types/goal';
import './index.css';

function App() {
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">LifeSync - Goal Tracker</h1>
        <div className="space-y-4">
          {sampleGoals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
