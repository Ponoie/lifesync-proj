import { useThemeStore } from '../stores/themeStore';
import { useAuthStore } from '../stores/authStore';
import { ProtectedRoute } from '../components/ProtectedRoute';

export function AdminPage() {
  const theme = useThemeStore((state) => state.theme);
  const user = useAuthStore((state) => state.user);

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div>
        <h1
          className={`text-2xl font-bold mb-6 ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}
        >
          🔐 Admin Dashboard
        </h1>

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
            Admin Panel
          </h2>
          <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
            Welcome, {user?.username}! You have admin privileges.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className={`p-4 rounded-lg border ${
              theme === 'dark'
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
            }`}
          >
            <p className="text-sm text-gray-600">Total Users</p>
            <p className="text-2xl font-bold text-blue-600">1,234</p>
          </div>
          <div
            className={`p-4 rounded-lg border ${
              theme === 'dark'
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
            }`}
          >
            <p className="text-sm text-gray-600">Active Goals</p>
            <p className="text-2xl font-bold text-green-600">5,678</p>
          </div>
          <div
            className={`p-4 rounded-lg border ${
              theme === 'dark'
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
            }`}
          >
            <p className="text-sm text-gray-600">Coins Circulating</p>
            <p className="text-2xl font-bold text-yellow-600">89.5K</p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
