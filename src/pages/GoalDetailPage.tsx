import { useParams, Link, useNavigate } from 'react-router-dom';
import { useGoalStore } from '../stores/goalStore';
import { useThemeStore } from '../stores/themeStore';

export function GoalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useThemeStore((state) => state.theme);
  const getGoalById = useGoalStore((state) => state.getGoalById);
  const updateGoal = useGoalStore((state) => state.updateGoal);
  const deleteGoal = useGoalStore((state) => state.deleteGoal);

  const goal = id ? getGoalById(id) : undefined;

  if (!goal) {
    return (
      <div className="text-center py-12">
        <h1
          className={`text-2xl font-bold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
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
    if (confirm('Are you sure you want to delete this goal?')) {
      deleteGoal(goal.id);
      navigate('/dashboard');
    }
  };

  const handleToggleComplete = () => {
    updateGoal(goal.id, {
      completed: !goal.completed,
      progress: !goal.completed ? 100 : goal.progress,
    });
  };

  const handleProgressUpdate = (newProgress: number) => {
    updateGoal(goal.id, {
      progress: Math.max(0, Math.min(100, newProgress)),
      completed: newProgress === 100,
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className={`text-gray-600 hover:text-gray-800 ${
              theme === 'dark' ? 'text-gray-400 hover:text-white' : ''
            }`}
          >
            ← Back
          </Link>
          <h1
            className={`text-2xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-800'
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
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {goal.completed ? '✓ Completed' : 'Mark Complete'}
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
          theme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}
      >
        <h2
          className={`text-lg font-semibold mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}
        >
          Description
        </h2>
        <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
          {goal.description}
        </p>
      </div>

      <div
        className={`p-6 rounded-lg border mb-6 ${
          theme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}
      >
        <h2
          className={`text-lg font-semibold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
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
              theme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300'
            }`}
          />
          <span className="text-gray-600">%</span>
        </div>
      </div>

      <div
        className={`p-6 rounded-lg border ${
          theme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}
      >
        <h2
          className={`text-lg font-semibold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}
        >
          Goal Metadata
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p
              className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              Status
            </p>
            <p
              className={`font-medium ${
                goal.completed
                  ? 'text-green-600'
                  : theme === 'dark'
                  ? 'text-white'
                  : 'text-gray-800'
              }`}
            >
              {goal.completed ? 'Completed' : 'In Progress'}
            </p>
          </div>
          <div>
            <p
              className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              Goal ID
            </p>
            <p
              className={`font-mono text-sm ${
                theme === 'dark' ? 'text-white' : 'text-gray-800'
              }`}
            >
              {goal.id}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
