import { Link, useLocation, useNavigate } from "react-router-dom";
import { CoinBadge } from "../CoinBadge";
import { useThemeStore } from "../../stores/themeStore";
import { useAuthStore } from "../../stores/authStore";

const publicNavItems = [
  { path: "/dashboard", label: "Dashboard", icon: "🏠" },
  { path: "/history", label: "History", icon: "📜" },
  { path: "/leaderboard", label: "Leaderboard", icon: "🏆" },
];

const adminNavItems = [{ path: "/admin", label: "Admin", icon: "🔐" }];

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();
  const { user, logout, hasRole } = useAuthStore();
  const totalCoins = user?.totalCoins || 0;

  const navItems = [...publicNavItems];
  if (hasRole(["admin"])) {
    navItems.push(...adminNavItems);
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav
      className={`border-b transition-colors ${
        theme === "dark"
          ? "bg-gray-900 border-gray-700"
          : "bg-white border-gray-200"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              to="/dashboard"
              className={`text-xl font-bold transition-colors ${
                theme === "dark" ? "text-white" : "text-gray-800"
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
                        ? theme === "dark"
                          ? "bg-gray-800 text-white"
                          : "bg-blue-50 text-blue-600"
                        : theme === "dark"
                          ? "text-gray-300 hover:text-white hover:bg-gray-800"
                          : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
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
            <CoinBadge totalCoins={totalCoins} />
            <div className="flex items-center gap-2">
              <span
                className={`text-sm ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {user?.username}
              </span>
              <span className="text-lg">{user?.avatar}</span>
            </div>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${
                theme === "dark"
                  ? "bg-gray-800 text-yellow-400 hover:bg-gray-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            <button
              onClick={handleLogout}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                theme === "dark"
                  ? "bg-red-900 text-red-300 hover:bg-red-800"
                  : "bg-red-100 text-red-600 hover:bg-red-200"
              }`}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
