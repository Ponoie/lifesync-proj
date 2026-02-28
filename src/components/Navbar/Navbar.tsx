import { Link, useLocation } from 'react-router-dom';
import { CoinBadge } from '../CoinBadge';
import { useThemeStore } from '../../stores/themeStore';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { path: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
];

export function Navbar() {
  const location = useLocation();
  const { theme, toggleTheme } = useThemeStore();

  return (
    <nav
      className={`border-b transition-colors ${
        theme === 'dark'
          ? 'bg-gray-900 border-gray-700'
          : 'bg-white border-gray-200'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              to="/dashboard"
              className={`text-xl font-bold transition-colors ${
                theme === 'dark' ? 'text-white' : 'text-gray-800'
              }`}
            >
              LifeSync
            </Link>

            <div className="flex items-center gap-6">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? theme === 'dark'
                          ? 'bg-gray-800 text-white'
                          : 'bg-blue-50 text-blue-600'
                        : theme === 'dark'
                        ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <CoinBadge totalCoins={250} />
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
